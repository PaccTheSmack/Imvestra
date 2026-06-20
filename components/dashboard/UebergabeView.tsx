"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  ClipboardText,
  Plus,
  X,
  Buildings,
  UsersFour,
  FilePdf,
  DotsThreeVertical,
} from "@phosphor-icons/react"
import { createClient } from "@/lib/supabase/client"
import { STANDARD_RAEUME, TYP_CONFIG, GESAMTZUSTAND_OPTIONS } from "@/lib/protokoll-raeume"
import UebergabeEditor from "./UebergabeEditor"

// ─── TYPES ────────────────────────────────────────────────────────

interface Property { id: string; name: string; address: string }
interface Tenant { id: string; name: string; property_id: string | null }

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
  tenants: { name: string } | null
  protokoll_raeume: { id: string }[]
  protokoll_fotos: { id: string }[]
  tenant_id: string | null
  property_id: string
}

interface UebergabeViewProps {
  protokolle: Protokoll[]
  properties: Property[]
  tenants: Tenant[]
  vermieterName: string
}

// ─── HELPERS ──────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE")
}

// ─── MAIN ─────────────────────────────────────────────────────────

export default function UebergabeView({ protokolle, properties, tenants, vermieterName }: UebergabeViewProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [activeProtokoll, setActiveProtokoll] = useState<Protokoll | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // ── Modal form state ──
  const [newTyp, setNewTyp] = useState<"einzug" | "auszug" | "zwischenkontrolle">("einzug")
  const [newPropertyId, setNewPropertyId] = useState("")
  const [newTenantId, setNewTenantId] = useState("")
  const [newDatum, setNewDatum] = useState(new Date().toISOString().split("T")[0])
  const [useStandardRaeume, setUseStandardRaeume] = useState(true)
  const [creating, setCreating] = useState(false)

  const filteredTenants = tenants.filter(t => !newPropertyId || t.property_id === newPropertyId)
  const selectedProperty = properties.find(p => p.id === newPropertyId)
  const selectedTenant = tenants.find(t => t.id === newTenantId)

  async function createProtokoll() {
    if (!newPropertyId) return
    setCreating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get vermieter from profile
      const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single()

      const { data: proto, error } = await supabase
        .from("uebergabeprotokolle")
        .insert({
          user_id: user.id,
          property_id: newPropertyId,
          tenant_id: newTenantId || null,
          typ: newTyp,
          datum: newDatum,
          vermieter_name: profile?.name ?? vermieterName,
          mieter_name: selectedTenant?.name ?? "Mieter",
          status: "entwurf",
        })
        .select()
        .single()

      if (error || !proto) return

      // Create standard rooms if enabled
      if (useStandardRaeume) {
        await supabase.from("protokoll_raeume").insert(
          STANDARD_RAEUME.map((name, i) => ({
            protokoll_id: proto.id,
            user_id: user.id,
            name,
            sort_order: i,
          }))
        )
      }

      // Fetch fresh protokoll with joins
      const { data: fresh } = await supabase
        .from("uebergabeprotokolle")
        .select(`*, properties(name, address), tenants(name), protokoll_raeume(id), protokoll_fotos(id)`)
        .eq("id", proto.id)
        .single()

      setShowModal(false)
      setActiveProtokoll(fresh as Protokoll)
    } finally {
      setCreating(false)
    }
  }

  // ── EDITOR VIEW ──
  if (activeProtokoll) {
    return (
      <UebergabeEditor
        protokoll={activeProtokoll}
        vermieterName={vermieterName}
        onBack={() => { setActiveProtokoll(null); router.refresh() }}
      />
    )
  }

  // ── LIST VIEW ──
  return (
    <div style={{ background: "#F8F7F4", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ padding: "28px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClipboardText size={18} color="#A07830" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#101418", letterSpacing: "-0.02em" }}>Übergabeprotokolle</h1>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{protokolle.length} Protokoll{protokolle.length !== 1 ? "e" : ""}</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "9px 18px", borderRadius: 10, boxShadow: "0 4px 12px rgba(160,120,48,0.25)", cursor: "pointer" }}
          >
            <Plus size={14} weight="bold" />
            Neues Protokoll
          </button>
        </div>
      </div>

      <div style={{ padding: "0 32px 32px" }}>
        {protokolle.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 32px", background: "white", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)" }}>
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(160,120,48,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <ClipboardText size={26} color="#A07830" />
            </motion.div>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#101418", marginBottom: 6 }}>Noch kein Übergabeprotokoll</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24, maxWidth: 320, margin: "0 auto 24px" }}>
              Dokumentiere Ein- und Auszüge rechtssicher mit Fotos und Zählerständen.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "10px 20px", borderRadius: 10, cursor: "pointer" }}
            >
              Erstes Protokoll erstellen
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {protokolle.map(p => {
              const tc = TYP_CONFIG[p.typ]
              const gz = GESAMTZUSTAND_OPTIONS.find(g => g.value === p.gesamtzustand)
              return (
                <div key={p.id} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20, transition: "border-color 0.2s", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: tc.bg, color: tc.color }}>{tc.label}</span>
                        {p.status === "unterzeichnet" && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: "rgba(45,106,45,0.08)", color: "#2D6A2D" }}>Unterzeichnet</span>
                        )}
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>{p.mieter_name}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                        {p.properties?.name ?? "—"} · {fmtDate(p.datum)}
                      </p>
                    </div>
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <DotsThreeVertical size={14} color="#9CA3AF" />
                      </button>
                      {openMenu === p.id && (
                        <div style={{ position: "absolute", right: 0, top: 34, background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, padding: "4px 0", zIndex: 10, width: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
                          {[
                            { label: "Öffnen", action: () => { setOpenMenu(null); setActiveProtokoll(p) } },
                            { label: "Als unterzeichnet markieren", action: async () => {
                              const sb = createClient()
                              await sb.from("uebergabeprotokolle").update({ status: "unterzeichnet", unterzeichnet_am: new Date().toISOString() }).eq("id", p.id)
                              setOpenMenu(null); router.refresh()
                            }},
                          ].map(item => (
                            <button key={item.label} onClick={item.action}
                              style={{ width: "100%", textAlign: "left", padding: "8px 14px", fontSize: 13, color: "#101418", cursor: "pointer" }}>
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                    {[
                      { label: "DATUM", val: fmtDate(p.datum) },
                      { label: "RÄUME", val: `${p.protokoll_raeume.length} Räume` },
                      { label: "FOTOS", val: `${p.protokoll_fotos.length} Fotos` },
                      { label: "ZUSTAND", val: gz?.label ?? "—", color: gz?.color },
                    ].map(item => (
                      <div key={item.label} style={{ background: "#F8F7F4", borderRadius: 10, padding: "10px 12px" }}>
                        <p style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{item.label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: item.color ?? "#101418" }}>{item.val}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                    <button onClick={() => setActiveProtokoll(p)}
                      style={{ fontSize: 12, fontWeight: 600, color: "white", background: "#A07830", padding: "7px 16px", borderRadius: 8, cursor: "pointer" }}>
                      Öffnen
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "#6B7280", padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer" }}>
                      <FilePdf size={13} />
                      PDF
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Close menus */}
      {openMenu && <div style={{ position: "fixed", inset: 0, zIndex: 5 }} onClick={() => setOpenMenu(null)} />}

      {/* NEW PROTOCOL MODAL */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50 }}
              onClick={() => setShowModal(false)}
            />
            <motion.div key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 51, width: "min(480px, 95vw)", background: "white", borderRadius: 18, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#101418" }}>Neues Übergabeprotokoll</h2>
                <button onClick={() => setShowModal(false)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={14} color="#6B7280" />
                </button>
              </div>

              {/* Typ selector */}
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 10 }}>PROTOKOLL-TYP</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                {(["einzug", "auszug", "zwischenkontrolle"] as const).map(typ => {
                  const tc = TYP_CONFIG[typ]
                  const icons = { einzug: "📥", auszug: "📤", zwischenkontrolle: "🔍" }
                  return (
                    <button key={typ} onClick={() => setNewTyp(typ)}
                      style={{ padding: "14px 8px", borderRadius: 12, textAlign: "center", cursor: "pointer", border: `2px solid ${newTyp === typ ? tc.color : "rgba(0,0,0,0.1)"}`, background: newTyp === typ ? tc.bg : "white", transition: "all 0.15s" }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{icons[typ]}</div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: newTyp === typ ? tc.color : "#101418" }}>{tc.label}</p>
                    </button>
                  )
                })}
              </div>

              {/* Property */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>OBJEKT *</label>
                <select value={newPropertyId} onChange={e => { setNewPropertyId(e.target.value); setNewTenantId("") }}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, background: "white", outline: "none", boxSizing: "border-box" }}>
                  <option value="">— Objekt wählen —</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Tenant */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>MIETER</label>
                <select value={newTenantId} onChange={e => setNewTenantId(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, background: "white", outline: "none", boxSizing: "border-box" }}>
                  <option value="">— Mieter wählen (optional) —</option>
                  {filteredTenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Datum */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>DATUM</label>
                <input type="date" value={newDatum} onChange={e => setNewDatum(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, boxSizing: "border-box" }} />
              </div>

              {/* Standard rooms toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#F8F7F4", borderRadius: 10, marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#101418" }}>Standardräume hinzufügen</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>Flur, Wohnzimmer, Bad, Küche, ...</p>
                </div>
                <button onClick={() => setUseStandardRaeume(v => !v)}
                  style={{ width: 44, height: 24, borderRadius: 99, position: "relative", background: useStandardRaeume ? "#A07830" : "rgba(0,0,0,0.15)", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}>
                  <span style={{ position: "absolute", top: 3, left: useStandardRaeume ? 23 : 3, width: 18, height: 18, borderRadius: 99, background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                </button>
              </div>

              {/* Preview of property */}
              {selectedProperty && (
                <div style={{ background: "rgba(160,120,48,0.05)", border: "1px solid rgba(160,120,48,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Buildings size={12} color="#A07830" />
                    <p style={{ fontSize: 11, color: "#A07830" }}>{selectedProperty.address}</p>
                  </div>
                  {selectedTenant && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <UsersFour size={12} color="#A07830" />
                      <p style={{ fontSize: 11, color: "#A07830" }}>{selectedTenant.name}</p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={createProtokoll}
                disabled={!newPropertyId || creating}
                style={{ width: "100%", padding: "12px", borderRadius: 10, background: "#A07830", color: "white", fontSize: 14, fontWeight: 600, cursor: !newPropertyId || creating ? "not-allowed" : "pointer", opacity: !newPropertyId ? 0.5 : 1, boxShadow: "0 4px 14px rgba(160,120,48,0.3)" }}
              >
                {creating ? "Erstelle..." : "Protokoll erstellen →"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
