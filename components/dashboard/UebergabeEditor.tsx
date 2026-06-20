"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Warning,
  Plus,
  X,
  Camera,
  TrashSimple,
  Lightning,
  Drop,
  Flame,
  Thermometer,
  Pencil,
} from "@phosphor-icons/react"
import { createClient } from "@/lib/supabase/client"
import {
  RAEUME_CHECKBOXEN,
  ZUSTAND_OPTIONS,
  GESAMTZUSTAND_OPTIONS,
  TYP_CONFIG,
} from "@/lib/protokoll-raeume"

// ─── TYPES ────────────────────────────────────────────────────────

interface Raum {
  id: string
  name: string
  zustand: string | null
  zustand_notizen: string | null
  waende_ok: boolean | null
  boden_ok: boolean | null
  decke_ok: boolean | null
  fenster_ok: boolean | null
  tueren_ok: boolean | null
  heizung_ok: boolean | null
  steckdosen_ok: boolean | null
  maengel: string[]
}

interface Foto {
  id: string
  raum_id: string | null
  file_path: string
  file_name: string
  url?: string
}

interface Protokoll {
  id: string
  typ: "einzug" | "auszug" | "zwischenkontrolle"
  datum: string
  mieter_name: string
  vermieter_name: string
  zeuge_name: string | null
  uhrzeit: string | null
  vermieter_unterschrift: boolean
  mieter_unterschrift: boolean
  schlussel_uebergeben: number | null
  schlussel_typ: string | null
  schlussel_notizen: string | null
  zaehler_strom: number | null
  zaehler_strom_nr: string | null
  zaehler_gas: number | null
  zaehler_gas_nr: string | null
  zaehler_wasser: number | null
  zaehler_wasser_nr: string | null
  zaehler_waerme: number | null
  gesamtzustand: string | null
  allgemeine_notizen: string | null
  vereinbarungen: string | null
  status: "entwurf" | "fertig" | "unterzeichnet"
  properties: { name: string; address: string } | null
}

interface UebergabeEditorProps {
  protokoll: Protokoll
  vermieterName: string
  onBack: () => void
}

type Panel = "stammdaten" | "schluessel" | "zaehlerstaende" | "gesamtzustand" | "vereinbarungen" | "unterschriften" | string

// ─── HELPERS ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 9,
  border: "1px solid rgba(0,0,0,0.12)", fontSize: 13,
  background: "white", outline: "none", boxSizing: "border-box", color: "#101418",
}

const cardStyle: React.CSSProperties = {
  background: "white", border: "1px solid rgba(0,0,0,0.07)",
  borderRadius: 14, padding: 24, marginBottom: 16,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function UebergabeEditor({ protokoll, vermieterName: _vermieterName, onBack }: UebergabeEditorProps) {
  const supabase = createClient()
  const [activePanel, setActivePanel] = useState<Panel>("stammdaten")
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Protocol fields ──
  const [fields, setFields] = useState({
    vermieter_name: protokoll.vermieter_name,
    mieter_name: protokoll.mieter_name,
    zeuge_name: protokoll.zeuge_name ?? "",
    datum: protokoll.datum,
    uhrzeit: protokoll.uhrzeit ?? "",
    schlussel_uebergeben: protokoll.schlussel_uebergeben ?? 0,
    schlussel_typ: protokoll.schlussel_typ ?? "",
    schlussel_notizen: protokoll.schlussel_notizen ?? "",
    zaehler_strom: protokoll.zaehler_strom?.toString() ?? "",
    zaehler_strom_nr: protokoll.zaehler_strom_nr ?? "",
    zaehler_gas: protokoll.zaehler_gas?.toString() ?? "",
    zaehler_gas_nr: protokoll.zaehler_gas_nr ?? "",
    zaehler_wasser: protokoll.zaehler_wasser?.toString() ?? "",
    zaehler_wasser_nr: protokoll.zaehler_wasser_nr ?? "",
    zaehler_waerme: protokoll.zaehler_waerme?.toString() ?? "",
    gesamtzustand: protokoll.gesamtzustand ?? "",
    allgemeine_notizen: protokoll.allgemeine_notizen ?? "",
    vereinbarungen: protokoll.vereinbarungen ?? "",
    vermieter_unterschrift: protokoll.vermieter_unterschrift,
    mieter_unterschrift: protokoll.mieter_unterschrift,
  })

  // ── Rooms ──
  const [raeume, setRaeume] = useState<Raum[]>([])
  const [raeumeFetched, setRaeumeFetched] = useState(false)
  const [newRaumName, setNewRaumName] = useState("")
  const [addingRaum, setAddingRaum] = useState(false)

  // ── Photos ──
  const [fotos, setFotos] = useState<Foto[]>([])
  const [fotosFetched, setFotosFetched] = useState(false)

  // ── Mangel input ──
  const [mangelInput, setMangelInput] = useState("")

  // ── Unterzeichnet timestamps ──
  const [vmTs, setVmTs] = useState<string | null>(null)
  const [mtTs, setMtTs] = useState<string | null>(null)

  const FIXED_PANELS = ["stammdaten", "schluessel", "zaehlerstaende", "gesamtzustand", "vereinbarungen", "unterschriften"]

  // Fetch rooms lazily
  const fetchRaeume = useCallback(async () => {
    if (raeumeFetched) return
    const { data } = await supabase.from("protokoll_raeume").select("*").eq("protokoll_id", protokoll.id).order("sort_order")
    setRaeume((data ?? []) as Raum[])
    setRaeumeFetched(true)
  }, [protokoll.id, raeumeFetched, supabase])

  const fetchFotos = useCallback(async () => {
    if (fotosFetched) return
    const { data } = await supabase.from("protokoll_fotos").select("*").eq("protokoll_id", protokoll.id).order("sort_order")
    setFotos((data ?? []) as Foto[])
    setFotosFetched(true)
  }, [protokoll.id, fotosFetched, supabase])

  const handlePanelSwitch = (panel: Panel) => {
    setActivePanel(panel)
    fetchRaeume()
    if (!FIXED_PANELS.includes(panel)) {
      fetchFotos()
    }
  }

  // ── Save field ──
  async function saveField(key: string, value: unknown) {
    await supabase.from("uebergabeprotokolle").update({ [key]: value }).eq("id", protokoll.id)
  }

  // ── Save all ──
  async function saveAll() {
    setSaving(true)
    await supabase.from("uebergabeprotokolle").update({
      vermieter_name: fields.vermieter_name,
      mieter_name: fields.mieter_name,
      zeuge_name: fields.zeuge_name || null,
      datum: fields.datum,
      uhrzeit: fields.uhrzeit || null,
      schlussel_uebergeben: fields.schlussel_uebergeben,
      schlussel_typ: fields.schlussel_typ || null,
      schlussel_notizen: fields.schlussel_notizen || null,
      zaehler_strom: parseFloat(fields.zaehler_strom) || null,
      zaehler_strom_nr: fields.zaehler_strom_nr || null,
      zaehler_gas: parseFloat(fields.zaehler_gas) || null,
      zaehler_gas_nr: fields.zaehler_gas_nr || null,
      zaehler_wasser: parseFloat(fields.zaehler_wasser) || null,
      zaehler_wasser_nr: fields.zaehler_wasser_nr || null,
      zaehler_waerme: parseFloat(fields.zaehler_waerme) || null,
      gesamtzustand: fields.gesamtzustand || null,
      allgemeine_notizen: fields.allgemeine_notizen || null,
      vereinbarungen: fields.vereinbarungen || null,
      vermieter_unterschrift: fields.vermieter_unterschrift,
      mieter_unterschrift: fields.mieter_unterschrift,
    }).eq("id", protokoll.id)
    setSaving(false)
  }

  // ── Finalize ──
  async function finalize() {
    setSaving(true)
    await saveAll()
    await supabase.from("uebergabeprotokolle").update({ status: "unterzeichnet", unterzeichnet_am: new Date().toISOString() }).eq("id", protokoll.id)
    setSaving(false)
    onBack()
  }

  // ── Raum update ──
  async function updateRaum(raumId: string, key: string, value: unknown) {
    setRaeume(prev => prev.map(r => r.id === raumId ? { ...r, [key]: value } : r))
    await supabase.from("protokoll_raeume").update({ [key]: value }).eq("id", raumId)
  }

  // ── Add raum ──
  async function addRaum() {
    if (!newRaumName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("protokoll_raeume").insert({
      protokoll_id: protokoll.id,
      user_id: user.id,
      name: newRaumName.trim(),
      sort_order: raeume.length,
    }).select().single()
    if (data) setRaeume(prev => [...prev, data as Raum])
    setNewRaumName("")
    setAddingRaum(false)
  }

  // ── Delete raum ──
  async function deleteRaum(raumId: string) {
    await supabase.from("protokoll_raeume").delete().eq("id", raumId)
    setRaeume(prev => prev.filter(r => r.id !== raumId))
    setActivePanel("stammdaten")
  }

  // ── Photo upload ──
  async function uploadFoto(file: File) {
    setUploadingPhoto(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadingPhoto(false); return }
    const formData = new FormData()
    formData.append("file", file)
    formData.append("protokoll_id", protokoll.id)
    if (!FIXED_PANELS.includes(activePanel)) {
      formData.append("raum_id", activePanel)
    }
    try {
      const res = await fetch("/api/protokoll/foto", { method: "POST", body: formData })
      const { foto } = await res.json()
      if (foto) setFotos(prev => [...prev, foto as Foto])
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function deleteFoto(fotoId: string) {
    await supabase.from("protokoll_fotos").delete().eq("id", fotoId)
    setFotos(prev => prev.filter(f => f.id !== fotoId))
  }

  const tc = TYP_CONFIG[protokoll.typ]
  const activeRaum = raeume.find(r => r.id === activePanel)
  const raumFotos = fotos.filter(f => f.raum_id === activePanel)
  const canFinalize = fields.vermieter_unterschrift && fields.mieter_unterschrift

  // ── Nav sections ──
  const navSections = [
    {
      label: "ALLGEMEIN",
      items: [
        { id: "stammdaten", label: "Stammdaten" },
        { id: "schluessel", label: "Schlüssel" },
        { id: "zaehlerstaende", label: "Zählerstände" },
      ],
    },
    {
      label: "RÄUME",
      items: raeume.map(r => ({
        id: r.id,
        label: r.name,
        zustand: r.zustand,
      })),
    },
    {
      label: "ABSCHLUSS",
      items: [
        { id: "gesamtzustand", label: "Gesamtzustand" },
        { id: "vereinbarungen", label: "Vereinbarungen" },
        { id: "unterschriften", label: "Unterschriften" },
      ],
    },
  ]

  function zustandDot(zustand: string | null | undefined) {
    const z = ZUSTAND_OPTIONS.find(o => o.value === zustand)
    return (
      <span style={{ width: 8, height: 8, borderRadius: 99, background: z?.color ?? "#D1D5DB", display: "inline-block", flexShrink: 0 }} />
    )
  }

  return (
    <div style={{ background: "#F8F7F4", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* STICKY HEADER */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "white", borderBottom: "1px solid rgba(0,0,0,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={14} color="#6B7280" />
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: tc.bg, color: tc.color }}>{tc.label}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#101418" }}>{protokoll.mieter_name}</span>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{protokoll.properties?.name ?? ""}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={saveAll} disabled={saving} style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer" }}>
            {saving ? "Speichert..." : "Speichern"}
          </button>
          <button onClick={() => handlePanelSwitch("unterschriften")}
            style={{ fontSize: 12, fontWeight: 600, color: "white", background: "#A07830", padding: "7px 16px", borderRadius: 8, cursor: "pointer", boxShadow: "0 3px 10px rgba(160,120,48,0.25)" }}>
            Abschließen
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1 }}>

        {/* LEFT NAV */}
        <div style={{ width: 240, background: "white", borderRight: "1px solid rgba(0,0,0,0.07)", overflowY: "auto", padding: "16px 8px", flexShrink: 0 }}>
          {navSections.map(section => (
            <div key={section.label} style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.12em", padding: "0 8px", marginBottom: 6 }}>{section.label}</p>
              {section.items.map((item) => {
                const isActive = activePanel === item.id
                const hasZustand = "zustand" in item
                return (
                  <button key={item.id} onClick={() => handlePanelSwitch(item.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 9, cursor: "pointer", marginBottom: 2, textAlign: "left", background: isActive ? "rgba(160,120,48,0.08)" : "transparent", transition: "background 0.1s" }}>
                    <span style={{ fontSize: 13, color: isActive ? "#A07830" : "#6B7280", fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                    {hasZustand && zustandDot((item as { id: string; label: string; zustand: string | null }).zustand)}
                  </button>
                )
              })}
              {/* Add room button in RÄUME section */}
              {section.label === "RÄUME" && (
                <div style={{ padding: "0 4px" }}>
                  {addingRaum ? (
                    <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                      <input value={newRaumName} onChange={e => setNewRaumName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") addRaum(); if (e.key === "Escape") { setAddingRaum(false); setNewRaumName("") } }}
                        autoFocus placeholder="Raumname..."
                        style={{ flex: 1, padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(160,120,48,0.3)", fontSize: 12, outline: "none" }} />
                      <button onClick={addRaum} style={{ padding: "6px 8px", borderRadius: 7, background: "#A07830", color: "white", fontSize: 11, cursor: "pointer" }}>+</button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingRaum(true)}
                      style={{ width: "100%", padding: "7px 12px", borderRadius: 9, border: "1px dashed rgba(0,0,0,0.15)", fontSize: 12, color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                      <Plus size={12} />
                      Raum hinzufügen
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={activePanel} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

              {/* ── STAMMDATEN ── */}
              {activePanel === "stammdaten" && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#101418", marginBottom: 20, letterSpacing: "-0.02em" }}>Stammdaten</h2>
                  <div style={cardStyle}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Field label="Vermieter *">
                        <input value={fields.vermieter_name} onChange={e => setFields(f => ({ ...f, vermieter_name: e.target.value }))} style={inputStyle} onBlur={() => saveField("vermieter_name", fields.vermieter_name)} />
                      </Field>
                      <Field label="Mieter *">
                        <input value={fields.mieter_name} onChange={e => setFields(f => ({ ...f, mieter_name: e.target.value }))} style={inputStyle} onBlur={() => saveField("mieter_name", fields.mieter_name)} />
                      </Field>
                      <Field label="Datum">
                        <input type="date" value={fields.datum} onChange={e => setFields(f => ({ ...f, datum: e.target.value }))} style={inputStyle} onBlur={() => saveField("datum", fields.datum)} />
                      </Field>
                      <Field label="Uhrzeit">
                        <input type="time" value={fields.uhrzeit} onChange={e => setFields(f => ({ ...f, uhrzeit: e.target.value }))} style={inputStyle} onBlur={() => saveField("uhrzeit", fields.uhrzeit || null)} />
                      </Field>
                      <Field label="Zeuge (optional)">
                        <input value={fields.zeuge_name} onChange={e => setFields(f => ({ ...f, zeuge_name: e.target.value }))} style={inputStyle} placeholder="Name des Zeugen" onBlur={() => saveField("zeuge_name", fields.zeuge_name || null)} />
                      </Field>
                    </div>
                    <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(160,120,48,0.04)", border: "1px solid rgba(160,120,48,0.1)", borderRadius: 10 }}>
                      <p style={{ fontSize: 12, color: "#A07830" }}>
                        Anwesend: <strong>{fields.vermieter_name}</strong> (Vermieter) und <strong>{fields.mieter_name}</strong> (Mieter)
                        {fields.zeuge_name ? ` sowie ${fields.zeuge_name} (Zeuge)` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SCHLÜSSEL ── */}
              {activePanel === "schluessel" && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#101418", marginBottom: 20, letterSpacing: "-0.02em" }}>Schlüsselübergabe</h2>
                  <div style={cardStyle}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <Field label="Anzahl Schlüssel übergeben">
                        <input type="number" min="0" value={fields.schlussel_uebergeben} onChange={e => setFields(f => ({ ...f, schlussel_uebergeben: parseInt(e.target.value) || 0 }))} style={inputStyle} onBlur={() => saveField("schlussel_uebergeben", fields.schlussel_uebergeben)} />
                      </Field>
                      <Field label="Typ">
                        <input value={fields.schlussel_typ} onChange={e => setFields(f => ({ ...f, schlussel_typ: e.target.value }))} style={inputStyle} placeholder="z.B. Wohnungsschlüssel, Briefkasten..." onBlur={() => saveField("schlussel_typ", fields.schlussel_typ || null)} />
                      </Field>
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 10 }}>SCHLÜSSELARTEN</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {["Wohnungsschlüssel", "Briefkastenschlüssel", "Kellerschlüssel", "Garagenschlüssel", "Sonstige"].map(key => (
                        <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#101418" }}>
                          <input type="checkbox" style={{ width: 16, height: 16, accentColor: "#A07830" }} />
                          {key}
                        </label>
                      ))}
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <Field label="Notizen">
                        <textarea value={fields.schlussel_notizen} onChange={e => setFields(f => ({ ...f, schlussel_notizen: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Besondere Hinweise zur Schlüsselübergabe..." onBlur={() => saveField("schlussel_notizen", fields.schlussel_notizen || null)} />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ZÄHLERSTÄNDE ── */}
              {activePanel === "zaehlerstaende" && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#101418", marginBottom: 4, letterSpacing: "-0.02em" }}>Zählerstände</h2>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>Werden zum Abrechnungsnachweis im Protokoll gespeichert.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { key: "strom", label: "Strom", icon: <Lightning size={18} color="#A07830" />, unit: "kWh", nrKey: "zaehler_strom_nr" as const, valKey: "zaehler_strom" as const },
                      { key: "gas", label: "Gas", icon: <Flame size={18} color="#A07830" />, unit: "m³", nrKey: "zaehler_gas_nr" as const, valKey: "zaehler_gas" as const },
                      { key: "wasser", label: "Wasser (kalt)", icon: <Drop size={18} color="#A07830" />, unit: "m³", nrKey: "zaehler_wasser_nr" as const, valKey: "zaehler_wasser" as const },
                      { key: "waerme", label: "Wärme", icon: <Thermometer size={18} color="#A07830" />, unit: "kWh", nrKey: null, valKey: "zaehler_waerme" as const },
                    ].map(z => (
                      <div key={z.key} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: 18 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(160,120,48,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>{z.icon}</div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#101418" }}>{z.label}</p>
                          <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>{z.unit}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: z.nrKey ? "1fr 1fr" : "1fr", gap: 12 }}>
                          {z.nrKey && (
                            <Field label="Zähler-Nr.">
                              <input value={fields[z.nrKey]} onChange={e => setFields(f => ({ ...f, [z.nrKey!]: e.target.value }))} style={inputStyle} placeholder="Z123456" onBlur={() => saveField(z.nrKey!, fields[z.nrKey!] || null)} />
                            </Field>
                          )}
                          <Field label={`Zählerstand (${z.unit})`}>
                            <input type="number" step="0.001" value={fields[z.valKey]} onChange={e => setFields(f => ({ ...f, [z.valKey]: e.target.value }))} style={inputStyle} placeholder="0.000" onBlur={() => saveField(z.valKey, parseFloat(fields[z.valKey]) || null)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── RAUM PANEL ── */}
              {activeRaum && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#101418", letterSpacing: "-0.02em" }}>{activeRaum.name}</h2>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => {
                        const newName = prompt("Raumname:", activeRaum.name)
                        if (newName && newName.trim()) updateRaum(activeRaum.id, "name", newName.trim())
                      }} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Pencil size={13} color="#9CA3AF" />
                      </button>
                      <button onClick={() => { if (confirm(`Raum "${activeRaum.name}" löschen?`)) deleteRaum(activeRaum.id) }}
                        style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(185,28,28,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <TrashSimple size={13} color="#B91C1C" />
                      </button>
                    </div>
                  </div>

                  {/* Zustand selector */}
                  <div style={cardStyle}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 10 }}>ALLGEMEINER ZUSTAND</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                      {ZUSTAND_OPTIONS.map(opt => {
                        const sel = activeRaum.zustand === opt.value
                        return (
                          <button key={opt.value} onClick={() => updateRaum(activeRaum.id, "zustand", opt.value)}
                            style={{ padding: "10px 8px", borderRadius: 8, fontSize: 11, fontWeight: sel ? 700 : 500, cursor: "pointer", textAlign: "center", border: `1.5px solid ${sel ? opt.color : "rgba(0,0,0,0.1)"}`, background: sel ? opt.color : "white", color: sel ? "white" : "#6B7280", transition: "all 0.15s" }}>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Checkboxes */}
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 10 }}>EINZELNE ELEMENTE</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                      {RAEUME_CHECKBOXEN.map(cb => {
                        const key = cb.key as keyof Raum
                        const checked = activeRaum[key] as boolean | null
                        return (
                          <label key={cb.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 10px", borderRadius: 8, border: `1px solid ${checked === true ? "rgba(45,106,45,0.2)" : checked === false ? "rgba(185,28,28,0.15)" : "rgba(0,0,0,0.08)"}`, background: checked === true ? "rgba(45,106,45,0.04)" : checked === false ? "rgba(185,28,28,0.04)" : "white", transition: "all 0.15s" }}>
                            <input type="checkbox" checked={checked === true} onChange={e => updateRaum(activeRaum.id, cb.key, e.target.checked)} style={{ width: 15, height: 15, accentColor: "#2D6A2D" }} />
                            <span style={{ fontSize: 12, color: "#101418", fontWeight: 500 }}>{cb.label}</span>
                            {checked === true && <Check size={12} color="#2D6A2D" style={{ marginLeft: "auto" }} />}
                          </label>
                        )
                      })}
                    </div>

                    {/* Mängel */}
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>MÄNGEL</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      {(activeRaum.maengel ?? []).map((m, i) => (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "rgba(185,28,28,0.08)", color: "#B91C1C", border: "1px solid rgba(185,28,28,0.15)" }}>
                          {m}
                          <button onClick={() => updateRaum(activeRaum.id, "maengel", (activeRaum.maengel ?? []).filter((_, j) => j !== i))} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                            <X size={10} color="#B91C1C" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      <input value={mangelInput} onChange={e => setMangelInput(e.target.value)} placeholder="Mangel beschreiben..."
                        onKeyDown={e => { if (e.key === "Enter" && mangelInput.trim()) { updateRaum(activeRaum.id, "maengel", [...(activeRaum.maengel ?? []), mangelInput.trim()]); setMangelInput("") } }}
                        style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={() => { if (mangelInput.trim()) { updateRaum(activeRaum.id, "maengel", [...(activeRaum.maengel ?? []), mangelInput.trim()]); setMangelInput("") } }}
                        style={{ padding: "9px 14px", borderRadius: 9, background: "#A07830", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+</button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {["Kratzer", "Fleck", "Riss", "Schimmel", "Wasserfleck", "Fehlende Fliesen"].map(s => (
                        <button key={s} onClick={() => updateRaum(activeRaum.id, "maengel", [...(activeRaum.maengel ?? []), s])}
                          style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, border: "1px solid rgba(0,0,0,0.1)", background: "#F8F7F4", color: "#6B7280", cursor: "pointer" }}>
                          + {s}
                        </button>
                      ))}
                    </div>

                    {/* Notizen */}
                    <div style={{ marginTop: 16 }}>
                      <Field label="Raumnotizen">
                        <textarea value={activeRaum.zustand_notizen ?? ""} onChange={e => updateRaum(activeRaum.id, "zustand_notizen", e.target.value)} rows={3}
                          style={{ ...inputStyle, resize: "vertical" }} placeholder="Besondere Hinweise für diesen Raum..." />
                      </Field>
                    </div>
                  </div>

                  {/* Fotos */}
                  <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#101418" }}>Fotos für diesen Raum</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{raumFotos.length} Fotos</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {raumFotos.map(foto => (
                        <div key={foto.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", background: "#F8F7F4" }}>
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#9CA3AF" }}>
                            📷 {foto.file_name.slice(0, 12)}
                          </div>
                          <button onClick={() => deleteFoto(foto.id)}
                            style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 99, background: "rgba(185,28,28,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <X size={10} color="white" />
                          </button>
                        </div>
                      ))}

                      {/* Upload card */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        style={{ aspectRatio: "1", borderRadius: 8, border: "2px dashed rgba(160,120,48,0.25)", background: "#F8F7F4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: uploadingPhoto ? "wait" : "pointer" }}>
                        <Camera size={20} color="#A07830" />
                        <span style={{ fontSize: 10, color: "#A07830", fontWeight: 600 }}>{uploadingPhoto ? "Lädt..." : "Foto hinzufügen"}</span>
                      </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" capture="environment" style={{ display: "none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadFoto(f); e.target.value = "" }} />
                  </div>
                </div>
              )}

              {/* ── GESAMTZUSTAND ── */}
              {activePanel === "gesamtzustand" && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#101418", marginBottom: 20, letterSpacing: "-0.02em" }}>Gesamtzustand</h2>
                  <div style={cardStyle}>
                    {/* Room summary */}
                    <div style={{ background: "#F8F7F4", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>RAUMZUSAMMENFASSUNG</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {ZUSTAND_OPTIONS.map(opt => {
                          const count = raeume.filter(r => r.zustand === opt.value).length
                          if (count === 0) return null
                          return (
                            <span key={opt.value} style={{ fontSize: 12, padding: "3px 12px", borderRadius: 99, fontWeight: 600, background: `${opt.color}15`, color: opt.color }}>
                              {count}× {opt.label}
                            </span>
                          )
                        })}
                        {raeume.filter(r => !r.zustand).length > 0 && (
                          <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 99, background: "rgba(0,0,0,0.06)", color: "#9CA3AF" }}>
                            {raeume.filter(r => !r.zustand).length}× Nicht bewertet
                          </span>
                        )}
                      </div>
                    </div>

                    <p style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 12 }}>GESAMTBEWERTUNG</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                      {GESAMTZUSTAND_OPTIONS.map(opt => {
                        const sel = fields.gesamtzustand === opt.value
                        return (
                          <button key={opt.value} onClick={() => { setFields(f => ({ ...f, gesamtzustand: opt.value })); saveField("gesamtzustand", opt.value) }}
                            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${sel ? opt.color : "rgba(0,0,0,0.1)"}`, background: sel ? `${opt.color}0D` : "white", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                            <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: sel ? opt.color : "#101418" }}>{opt.label}</p>
                              <p style={{ fontSize: 11, color: "#9CA3AF" }}>{opt.desc}</p>
                            </div>
                            {sel && <CheckCircle size={18} color={opt.color} weight="fill" style={{ marginLeft: "auto" }} />}
                          </button>
                        )
                      })}
                    </div>

                    <Field label="Allgemeine Notizen">
                      <textarea value={fields.allgemeine_notizen} onChange={e => setFields(f => ({ ...f, allgemeine_notizen: e.target.value }))} rows={4}
                        style={{ ...inputStyle, resize: "vertical" }} placeholder="Gesamteindruck der Immobilie..." onBlur={() => saveField("allgemeine_notizen", fields.allgemeine_notizen || null)} />
                    </Field>
                  </div>
                </div>
              )}

              {/* ── VEREINBARUNGEN ── */}
              {activePanel === "vereinbarungen" && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#101418", marginBottom: 20, letterSpacing: "-0.02em" }}>Vereinbarungen</h2>
                  <div style={cardStyle}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#101418", marginBottom: 4 }}>Was wurde vereinbart?</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>Diese Vereinbarungen werden rechtlich bindend im Protokoll festgehalten.</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                      {[
                        "Schönheitsreparaturen bis zum Auszug",
                        "Mangel wird vom Vermieter behoben",
                        "Mieter behebt Schaden auf eigene Kosten",
                        "Nachbesserung durch Mieter vereinbart",
                        "Verrechnung mit Kaution",
                      ].map(s => (
                        <button key={s} onClick={() => setFields(f => ({ ...f, vereinbarungen: f.vereinbarungen ? f.vereinbarungen + "\n• " + s : "• " + s }))}
                          style={{ fontSize: 11, padding: "5px 12px", borderRadius: 99, border: "1px solid rgba(160,120,48,0.2)", background: "rgba(160,120,48,0.05)", color: "#A07830", cursor: "pointer" }}>
                          + {s}
                        </button>
                      ))}
                    </div>
                    <textarea value={fields.vereinbarungen} onChange={e => setFields(f => ({ ...f, vereinbarungen: e.target.value }))} rows={8}
                      style={{ ...inputStyle, resize: "vertical", minHeight: 150 }}
                      placeholder="Hier werden alle getroffenen Vereinbarungen festgehalten..." onBlur={() => saveField("vereinbarungen", fields.vereinbarungen || null)} />
                  </div>
                </div>
              )}

              {/* ── UNTERSCHRIFTEN ── */}
              {activePanel === "unterschriften" && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#101418", marginBottom: 20, letterSpacing: "-0.02em" }}>Protokoll abschließen</h2>

                  {/* Summary */}
                  <div style={{ background: "rgba(160,120,48,0.04)", border: "1px solid rgba(160,120,48,0.15)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#A07830", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Zusammenfassung</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Typ", val: TYP_CONFIG[protokoll.typ].label },
                        { label: "Datum", val: new Date(fields.datum).toLocaleDateString("de-DE") },
                        { label: "Mieter", val: fields.mieter_name },
                        { label: "Vermieter", val: fields.vermieter_name },
                        { label: "Räume", val: `${raeume.length} Räume` },
                        { label: "Fotos", val: `${fotos.length} Fotos` },
                        { label: "Gesamtzustand", val: GESAMTZUSTAND_OPTIONS.find(g => g.value === fields.gesamtzustand)?.label ?? "—" },
                        { label: "Objekt", val: protokoll.properties?.name ?? "—" },
                      ].map(item => (
                        <div key={item.label}>
                          <p style={{ fontSize: 9, color: "#A07830", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</p>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#101418", marginTop: 2 }}>{item.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warning if not all rooms rated */}
                  {raeume.some(r => !r.zustand) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)", borderRadius: 10, marginBottom: 16 }}>
                      <Warning size={14} color="#D97706" />
                      <p style={{ fontSize: 12, color: "#92400E" }}>{raeume.filter(r => !r.zustand).length} Raum/Räume noch nicht bewertet.</p>
                    </div>
                  )}

                  {/* Signatures */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                    {[
                      { key: "vermieter_unterschrift" as const, name: fields.vermieter_name, role: "Vermieter", ts: vmTs, setTs: setVmTs },
                      { key: "mieter_unterschrift" as const, name: fields.mieter_name, role: "Mieter", ts: mtTs, setTs: setMtTs },
                    ].map(sig => {
                      const checked = fields[sig.key]
                      return (
                        <div key={sig.key} style={{ background: checked ? "rgba(45,106,45,0.04)" : "#F8F7F4", border: `1px solid ${checked ? "rgba(45,106,45,0.2)" : "rgba(0,0,0,0.07)"}`, borderRadius: 12, padding: 20, textAlign: "center", transition: "all 0.2s" }}>
                          {checked ? (
                            <CheckCircle size={28} color="#2D6A2D" weight="fill" style={{ margin: "0 auto 8px" }} />
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: 99, border: "2px solid rgba(0,0,0,0.15)", margin: "0 auto 8px" }} />
                          )}
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#101418", marginBottom: 2 }}>{sig.name}</p>
                          <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12 }}>{sig.role}</p>
                          {sig.ts && <p style={{ fontSize: 10, color: "#2D6A2D", marginBottom: 8 }}>{sig.ts}</p>}
                          <button onClick={() => {
                            const val = !fields[sig.key]
                            setFields(f => ({ ...f, [sig.key]: val }))
                            saveField(sig.key, val)
                            if (val) sig.setTs(new Date().toLocaleString("de-DE"))
                            else sig.setTs(null)
                          }} style={{ fontSize: 11, fontWeight: 600, padding: "6px 14px", borderRadius: 8, background: checked ? "#2D6A2D" : "white", color: checked ? "white" : "#6B7280", border: checked ? "none" : "1px solid rgba(0,0,0,0.12)", cursor: "pointer", transition: "all 0.15s" }}>
                            {checked ? "✓ Bestätigt" : "Unterschrift bestätigen"}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={saveAll}
                      style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "white", color: "#6B7280", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      Als Entwurf speichern
                    </button>
                    <button onClick={finalize} disabled={!canFinalize || saving}
                      style={{ flex: 2, padding: "12px", borderRadius: 10, background: canFinalize ? "#A07830" : "rgba(0,0,0,0.08)", color: canFinalize ? "white" : "#9CA3AF", fontSize: 13, fontWeight: 600, cursor: canFinalize ? "pointer" : "not-allowed", boxShadow: canFinalize ? "0 4px 14px rgba(160,120,48,0.3)" : "none", transition: "all 0.2s" }}>
                      {saving ? "Speichert..." : "✓ Protokoll finalisieren"}
                    </button>
                  </div>
                  <p style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", marginTop: 12 }}>
                    Beide Unterschriften erforderlich zum Finalisieren. Danach ist das Protokoll unveränderlich.
                  </p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
