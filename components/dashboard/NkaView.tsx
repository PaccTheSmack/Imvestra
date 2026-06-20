"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Receipt,
  Warning,
  Check,
  CheckCircle,
  Plus,
  ArrowLeft,
  ArrowRight,
  X,
  Buildings,
  FilePdf,
  Envelope,
  FolderOpen,
  MagnifyingGlass,
  Pencil,
  Trash,
  CaretRight,
} from "@phosphor-icons/react"
import { BETRKV_POSITIONEN, UMLAGESCHLUESSEL_LABELS } from "@/lib/betrkv"
import { berechneNka, formatNka, formatAnteil, type NkaPosition, type MieterDaten, type ObjektDaten } from "@/lib/nka-berechnung"

// ─── TYPES ───────────────────────────────────────────────

interface Property {
  id: string
  name: string
  address: string
  sqm: number | null
  units: number | null
}

interface Tenant {
  id: string
  name: string
  email: string | null
  property_id: string
  move_in_date: string | null
  move_out_date: string | null
  rent_monthly: number | null
  nk_vorauszahlung: number | null
  wohnflaeche: number | null
  einwohnerzahl: number | null
}

interface Document {
  id: string
  name: string
  category: string
  created_at: string
}

interface MieterAbrechnung {
  id: string
  status: string
  saldo: number | null
  mieter_name: string
}

interface Abrechnung {
  id: string
  property_id: string
  abrechnungsjahr: number
  zeitraum_von: string
  zeitraum_bis: string
  faellig_bis: string | null
  status: "entwurf" | "berechnet" | "versendet" | "abgeschlossen"
  gesamtkosten: number | null
  mieter_anteil_gesamt: number | null
  vorauszahlungen_gesamt: number | null
  saldo_gesamt: number | null
  notizen: string | null
  properties: Property | null
  nka_mieter_abrechnungen: MieterAbrechnung[]
}

interface WizardPosition {
  tempId: string
  kostenart: string
  kostenart_nr: number | null
  bezeichnung: string
  gesamtbetrag: number
  umlageschluessel: "flaeche" | "personen" | "verbrauch" | "einheiten" | "direkt"
  document_id: string | null
  beleg_datum: string
  notizen: string
}

interface WizardTenant extends Tenant {
  included: boolean
  wohnflaeche_edit: number
  einwohnerzahl_edit: number
  vorauszahlung_edit: number
}

interface NkaViewProps {
  abrechnungen: Abrechnung[]
  properties: Property[]
  tenants: Tenant[]
  documents: Document[]
}

// ─── HELPERS ─────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE")
}

const STATUS_CONFIG = {
  entwurf: { label: "Entwurf", bg: "rgba(107,114,128,0.1)", color: "#6B7280" },
  berechnet: { label: "Berechnet", bg: "rgba(160,120,48,0.1)", color: "#A07830" },
  versendet: { label: "Versendet", bg: "rgba(59,130,246,0.1)", color: "#3B82F6" },
  abgeschlossen: { label: "Abgeschlossen", bg: "rgba(45,106,45,0.1)", color: "#2D6A2D" },
}

const STEP_LABELS = ["Objekt", "Zeitraum", "Kosten", "Prüfung", "Fertig"]

function newTempId() {
  return Math.random().toString(36).slice(2)
}

// ─── SUB-COMPONENTS ──────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                style={{
                  width: 32, height: 32, borderRadius: 99,
                  background: done ? "#A07830" : active ? "#A07830" : "rgba(0,0,0,0.08)",
                  border: active ? "2px solid #A07830" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                {done
                  ? <Check size={14} color="white" weight="bold" />
                  : <span style={{ fontSize: 12, fontWeight: 700, color: active ? "white" : "#9CA3AF" }}>{n}</span>
                }
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? "#A07830" : "#9CA3AF", marginTop: 4, whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ width: 48, height: 2, background: done ? "#A07830" : "rgba(0,0,0,0.08)", marginBottom: 20, margin: "0 4px 20px 4px", transition: "background 0.3s" }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── POSITION MODAL ──────────────────────────────────────

interface PositionModalProps {
  onSave: (p: WizardPosition) => void
  onClose: () => void
  editPosition?: WizardPosition | null
  documents: Document[]
}

function PositionModal({ onSave, onClose, editPosition, documents }: PositionModalProps) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<typeof BETRKV_POSITIONEN[0] | null>(null)
  const [step, setStep] = useState<"catalog" | "form">(editPosition ? "form" : "catalog")

  const [form, setForm] = useState<Omit<WizardPosition, "tempId">>({
    kostenart: editPosition?.kostenart ?? "",
    kostenart_nr: editPosition?.kostenart_nr ?? null,
    bezeichnung: editPosition?.bezeichnung ?? "",
    gesamtbetrag: editPosition?.gesamtbetrag ?? 0,
    umlageschluessel: editPosition?.umlageschluessel ?? "flaeche",
    document_id: editPosition?.document_id ?? null,
    beleg_datum: editPosition?.beleg_datum ?? "",
    notizen: editPosition?.notizen ?? "",
  })

  const filteredBetrkv = BETRKV_POSITIONEN.filter(p =>
    p.bezeichnung.toLowerCase().includes(search.toLowerCase()) ||
    String(p.nr).includes(search)
  )

  const selectCatalog = (pos: typeof BETRKV_POSITIONEN[0]) => {
    setSelected(pos)
    setForm(f => ({
      ...f,
      kostenart: pos.kostenart,
      kostenart_nr: pos.nr,
      bezeichnung: pos.bezeichnung,
      umlageschluessel: pos.standard_schluessel,
    }))
    setStep("form")
  }

  const handleSave = () => {
    if (!form.bezeichnung || form.gesamtbetrag <= 0) return
    onSave({ ...form, tempId: editPosition?.tempId ?? newTempId() })
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {/* Modal header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>
              {step === "catalog" ? "Kostenart wählen" : "Kostenposition"}
            </p>
            {selected && step === "form" && (
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>§2 Nr. {selected.nr} BetrKV</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === "form" && !editPosition && (
              <button onClick={() => setStep("catalog")} style={{ fontSize: 12, color: "#9CA3AF", padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(0,0,0,0.1)" }}>
                Zurück
              </button>
            )}
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={13} color="#9CA3AF" />
            </button>
          </div>
        </div>

        {/* Catalog step */}
        {step === "catalog" && (
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8F7F4", borderRadius: 9, padding: "8px 12px" }}>
                <MagnifyingGlass size={14} color="#9CA3AF" />
                <input
                  placeholder="BetrKV-Position suchen..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "#101418" }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
              {filteredBetrkv.map(pos => (
                <button
                  key={pos.nr}
                  onClick={() => selectCatalog(pos)}
                  className="w-full text-left transition-colors hover:bg-[#F8F7F4]"
                  style={{ padding: "10px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(160,120,48,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#A07830", flexShrink: 0 }}>
                    {pos.nr}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#101418" }}>{pos.bezeichnung}</p>
                    <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>Standard: {UMLAGESCHLUESSEL_LABELS[pos.standard_schluessel]}</p>
                  </div>
                  <CaretRight size={12} color="#9CA3AF" />
                </button>
              ))}
              <button
                onClick={() => { setForm(f => ({ ...f, kostenart: "sonstige", kostenart_nr: null })); setStep("form") }}
                className="w-full text-left transition-colors hover:bg-[#F8F7F4]"
                style={{ padding: "10px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 12, marginTop: 4, borderTop: "1px solid rgba(0,0,0,0.05)" }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Plus size={12} color="#6B7280" />
                </span>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#6B7280" }}>Freie Eingabe</p>
              </button>
            </div>
          </div>
        )}

        {/* Form step */}
        {step === "form" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px" }}>
            {/* Heizung warning */}
            {form.kostenart === "heizung" && (
              <div style={{ background: "rgba(160,120,48,0.06)", border: "1px solid rgba(160,120,48,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                <div className="flex items-start gap-2">
                  <Warning size={14} color="#A07830" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11, color: "#A07830", lineHeight: 1.5 }}>
                    <strong>HeizkostenV §7:</strong> Mindestens 50% der Heizkosten müssen verbrauchsabhängig (Zähler) abgerechnet werden.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>Bezeichnung *</label>
                <input
                  value={form.bezeichnung}
                  onChange={e => setForm(f => ({ ...f, bezeichnung: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, background: "white", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>Gesamtbetrag (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.gesamtbetrag || ""}
                  onChange={e => setForm(f => ({ ...f, gesamtbetrag: parseFloat(e.target.value) || 0 }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, background: "white", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>Umlageschlüssel</label>
                <select
                  value={form.umlageschluessel}
                  onChange={e => setForm(f => ({ ...f, umlageschluessel: e.target.value as WizardPosition["umlageschluessel"] }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, background: "white", outline: "none", boxSizing: "border-box" }}
                >
                  {Object.entries(UMLAGESCHLUESSEL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>Beleg verknüpfen</label>
                <select
                  value={form.document_id ?? ""}
                  onChange={e => setForm(f => ({ ...f, document_id: e.target.value || null }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, background: "white", outline: "none", boxSizing: "border-box" }}
                >
                  <option value="">Kein Beleg</option>
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>Belegdatum</label>
                <input
                  type="date"
                  value={form.beleg_datum}
                  onChange={e => setForm(f => ({ ...f, beleg_datum: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, background: "white", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>Notizen</label>
                <textarea
                  value={form.notizen}
                  onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))}
                  rows={2}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, background: "white", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!form.bezeichnung || form.gesamtbetrag <= 0}
              className="w-full mt-6"
              style={{ padding: "11px", borderRadius: 10, background: "#A07830", color: "white", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 12px rgba(160,120,48,0.25)", opacity: (!form.bezeichnung || form.gesamtbetrag <= 0) ? 0.5 : 1, cursor: (!form.bezeichnung || form.gesamtbetrag <= 0) ? "not-allowed" : "pointer" }}
            >
              {editPosition ? "Speichern" : "Hinzufügen"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────

export default function NkaView({ abrechnungen, properties, tenants, documents }: NkaViewProps) {
  const [view, setView] = useState<"list" | "wizard">("list")
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [saving, setSaving] = useState(false)

  // Wizard state
  const [selectedPropertyId, setSelectedPropertyId] = useState("")
  const [wizardTenants, setWizardTenants] = useState<WizardTenant[]>([])
  const [abrechnungsJahr, setAbrechnungsJahr] = useState(new Date().getFullYear() - 1)
  const [zeitraumVon, setZeitraumVon] = useState("")
  const [zeitraumBis, setZeitraumBis] = useState("")
  const [positionen, setPositionen] = useState<WizardPosition[]>([])
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [editPosition, setEditPosition] = useState<WizardPosition | null>(null)
  const [savedAbrechnungId, setSavedAbrechnungId] = useState<string | null>(null)

  const selectedProperty = properties.find(p => p.id === selectedPropertyId) ?? null

  // Deadline warnings
  const baldFaellig = abrechnungen.filter(a => {
    if (!a.faellig_bis || a.status === "abgeschlossen") return false
    const days = (new Date(a.faellig_bis).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days <= 90
  })

  // Select property → init tenants
  const handleSelectProperty = (pid: string) => {
    setSelectedPropertyId(pid)
    const pts = tenants.filter(t => t.property_id === pid)
    setWizardTenants(pts.map(t => ({
      ...t,
      included: true,
      wohnflaeche_edit: t.wohnflaeche ?? 0,
      einwohnerzahl_edit: t.einwohnerzahl ?? 1,
      vorauszahlung_edit: t.nk_vorauszahlung ?? 0,
    })))
  }

  // Year selection
  const handleSelectYear = (year: number) => {
    setAbrechnungsJahr(year)
    setZeitraumVon(`${year}-01-01`)
    setZeitraumBis(`${year}-12-31`)
  }

  // Calc totals
  const gesamtflaeche = wizardTenants.filter(t => t.included).reduce((s, t) => s + (t.wohnflaeche_edit || 0), 0)
  const gesamteinwohner = wizardTenants.filter(t => t.included).reduce((s, t) => s + (t.einwohnerzahl_edit || 1), 0)
  const gesamtkosten = positionen.reduce((s, p) => s + p.gesamtbetrag, 0)

  // Live NKA calculation
  const berechnungResult = useMemo(() => {
    if (!zeitraumVon || !zeitraumBis || positionen.length === 0) return []
    const nkaPositionen: NkaPosition[] = positionen.map(p => ({
      id: p.tempId,
      kostenart: p.kostenart,
      bezeichnung: p.bezeichnung,
      gesamtbetrag: p.gesamtbetrag,
      umlageschluessel: p.umlageschluessel,
    }))
    const mieterDaten: MieterDaten[] = wizardTenants.filter(t => t.included).map(t => ({
      tenant_id: t.id,
      name: t.name,
      wohnflaeche: t.wohnflaeche_edit,
      einwohnerzahl: t.einwohnerzahl_edit,
      einzugsdatum: t.move_in_date ?? zeitraumVon,
      auszugsdatum: t.move_out_date ?? undefined,
      vorauszahlung_monatlich: t.vorauszahlung_edit,
      zeitraum_von: zeitraumVon,
      zeitraum_bis: zeitraumBis,
    }))
    const objekt: ObjektDaten = {
      gesamt_flaeche: gesamtflaeche,
      gesamt_einheiten: wizardTenants.filter(t => t.included).length,
      gesamt_einwohner: gesamteinwohner,
    }
    return berechneNka(nkaPositionen, mieterDaten, objekt, zeitraumVon, zeitraumBis)
  }, [positionen, wizardTenants, zeitraumVon, zeitraumBis, gesamtflaeche, gesamteinwohner])

  // Save to DB
  const handleFinalize = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/nka/erstellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: selectedPropertyId,
          abrechnungsjahr: abrechnungsJahr,
          zeitraum_von: zeitraumVon,
          zeitraum_bis: zeitraumBis,
          positionen,
          mieter: wizardTenants.filter(t => t.included),
          berechnungen: berechnungResult,
        }),
      })
      const data = await res.json()
      if (data.id) {
        setSavedAbrechnungId(data.id)
        setWizardStep(5)
      }
    } finally {
      setSaving(false)
    }
  }

  const resetWizard = () => {
    setView("list")
    setWizardStep(1)
    setSelectedPropertyId("")
    setWizardTenants([])
    setPositionen([])
    setZeitraumVon("")
    setZeitraumBis("")
    setSavedAbrechnungId(null)
  }

  // Fälligkeits-warning
  const faelligBis = zeitraumBis
    ? new Date(new Date(zeitraumBis).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : null

  const faelligDays = faelligBis
    ? Math.floor((new Date(faelligBis).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // ── LIST VIEW ────────────────────────────────────────

  if (view === "list") {
    return (
      <div style={{ background: "#F8F7F4", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ padding: "28px 32px 0" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Receipt size={18} color="#A07830" />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#101418", letterSpacing: "-0.02em" }}>Nebenkostenabrechnung</h1>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{abrechnungen.length} Abrechnung{abrechnungen.length !== 1 ? "en" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {baldFaellig.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.15)", borderRadius: 99, padding: "5px 12px" }}>
                  <Warning size={12} color="#B91C1C" />
                  <span style={{ fontSize: 11, color: "#B91C1C", fontWeight: 500 }}>
                    {baldFaellig.length} Abrechnung{baldFaellig.length !== 1 ? "en" : ""} bald fällig
                  </span>
                </div>
              )}
              <button
                onClick={() => { setView("wizard"); setWizardStep(1) }}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "9px 18px", borderRadius: 10, boxShadow: "0 4px 12px rgba(160,120,48,0.25)", cursor: "pointer" }}
              >
                <Plus size={14} weight="bold" />
                Neue Abrechnung
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 32px 32px" }}>
          {abrechnungen.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 32px", background: "white", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(160,120,48,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Receipt size={26} color="#A07830" />
              </div>
              <p style={{ fontSize: 17, fontWeight: 600, color: "#101418", marginBottom: 6 }}>Noch keine Nebenkostenabrechnung</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>
                Erstelle deine erste Abrechnung für {new Date().getFullYear() - 1}
              </p>
              <button
                onClick={() => { setView("wizard"); setWizardStep(1) }}
                style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "10px 20px", borderRadius: 10, cursor: "pointer" }}
              >
                Abrechnung erstellen
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {abrechnungen.map(a => {
                const sc = STATUS_CONFIG[a.status]
                const isWarn = a.faellig_bis && (new Date(a.faellig_bis).getTime() - Date.now()) < 90 * 24 * 60 * 60 * 1000 && a.status !== "abgeschlossen"
                return (
                  <div
                    key={a.id}
                    style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20, transition: "all 0.2s" }}
                    className="hover:border-[rgba(160,120,48,0.2)] hover:-translate-y-px"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>
                            {a.properties?.name ?? "Objekt"}
                          </p>
                          <span style={{ fontSize: 10, color: "#9CA3AF" }}>Abrechnung {a.abrechnungsjahr}</span>
                          {isWarn && a.faellig_bis && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(185,28,28,0.1)", color: "#B91C1C" }}>
                              Fällig bis {fmtDate(a.faellig_bis)}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                          {fmtDate(a.zeitraum_von)} – {fmtDate(a.zeitraum_bis)}
                        </p>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {[
                        { label: "Gesamtkosten", val: a.gesamtkosten, color: undefined },
                        { label: "Mieter Anteil", val: a.mieter_anteil_gesamt, color: "#A07830" },
                        { label: "Vorauszahlungen", val: a.vorauszahlungen_gesamt, color: undefined },
                        { label: "Saldo", val: a.saldo_gesamt, color: (a.saldo_gesamt ?? 0) > 0 ? "#B91C1C" : "#2D6A2D" },
                      ].map(m => (
                        <div key={m.label} style={{ background: "#F8F7F4", borderRadius: 10, padding: "10px 12px" }}>
                          <p style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</p>
                          <p style={{ fontSize: 15, fontWeight: 700, color: m.color ?? "#101418", fontVariantNumeric: "tabular-nums" }}>
                            {m.val != null ? formatNka(m.val) : "—"}
                          </p>
                          {m.label === "Saldo" && m.val != null && (
                            <p style={{ fontSize: 9, color: m.color ?? "#9CA3AF", marginTop: 2 }}>
                              {(m.val) > 0 ? "Nachzahlung" : (m.val) < 0 ? "Guthaben" : "Ausgeglichen"}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Mieter pills */}
                    {a.nka_mieter_abrechnungen?.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.05)", marginTop: 4 }}>
                        {a.nka_mieter_abrechnungen.map(m => (
                          <span key={m.id} style={{
                            fontSize: 11, padding: "3px 10px", borderRadius: 99,
                            background: "#F8F7F4", border: "1px solid rgba(0,0,0,0.06)",
                            color: (m.saldo ?? 0) > 0 ? "#B91C1C" : (m.saldo ?? 0) < 0 ? "#2D6A2D" : "#6B7280",
                          }}>
                            {m.mieter_name}: {(m.saldo ?? 0) > 0 ? "+" : ""}{formatNka(m.saldo ?? 0)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── WIZARD VIEW ──────────────────────────────────────

  return (
    <div style={{ background: "#F8F7F4", minHeight: "100vh", padding: "28px 32px" }}>
      {/* Back + Progress */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={wizardStep === 1 ? resetWizard : () => setWizardStep(s => Math.max(1, s - 1) as typeof wizardStep)}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B7280", padding: "7px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.1)" }}
        >
          <ArrowLeft size={14} />
          {wizardStep === 1 ? "Abbrechen" : "Zurück"}
        </button>
        <div style={{ flex: 1 }}>
          <StepIndicator step={wizardStep} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: OBJEKT & MIETER ── */}
        {wizardStep === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#101418", marginBottom: 4, letterSpacing: "-0.02em" }}>Für welches Objekt?</h2>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Wähle das Objekt, für das du die Abrechnung erstellen möchtest.</p>

            {/* Property cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {properties.map(p => {
                const ptCount = tenants.filter(t => t.property_id === p.id).length
                const isSelected = p.id === selectedPropertyId
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProperty(p.id)}
                    className="text-left transition-all duration-200"
                    style={{
                      background: "white",
                      border: isSelected ? "2px solid #A07830" : "1px solid rgba(0,0,0,0.07)",
                      borderRadius: 12,
                      padding: 20,
                      cursor: "pointer",
                      boxShadow: isSelected ? "0 0 0 3px rgba(160,120,48,0.1)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Buildings size={16} color={isSelected ? "#A07830" : "#6B7280"} />
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#101418" }}>{p.name}</p>
                    </div>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>{p.address}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                      {p.sqm ? `${p.sqm} m²` : ""}{p.units ? ` · ${p.units} WE` : ""} · {ptCount} Mieter
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Tenant list */}
            {selectedPropertyId && wizardTenants.length > 0 && (
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#F8F7F4" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#101418" }}>Mieter einbeziehen</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Wohnfläche und Vorauszahlung werden für die Berechnung benötigt.</p>
                </div>
                {wizardTenants.map((t, i) => (
                  <div key={t.id} style={{ padding: "12px 20px", borderBottom: i < wizardTenants.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      onClick={() => setWizardTenants(prev => prev.map(wt => wt.id === t.id ? { ...wt, included: !wt.included } : wt))}
                      style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${t.included ? "#A07830" : "rgba(0,0,0,0.15)"}`, background: t.included ? "#A07830" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    >
                      {t.included && <Check size={11} color="white" weight="bold" />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: t.included ? "#101418" : "#9CA3AF" }}>{t.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <p style={{ fontSize: 9, color: "#9CA3AF", marginBottom: 2 }}>Fläche (m²)</p>
                        <input
                          type="number"
                          value={t.wohnflaeche_edit || ""}
                          onChange={e => setWizardTenants(prev => prev.map(wt => wt.id === t.id ? { ...wt, wohnflaeche_edit: parseFloat(e.target.value) || 0 } : wt))}
                          style={{ width: 64, padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(0,0,0,0.12)", fontSize: 12, textAlign: "right" }}
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: 9, color: "#9CA3AF", marginBottom: 2 }}>Personen</p>
                        <input
                          type="number"
                          min="1"
                          value={t.einwohnerzahl_edit || 1}
                          onChange={e => setWizardTenants(prev => prev.map(wt => wt.id === t.id ? { ...wt, einwohnerzahl_edit: parseInt(e.target.value) || 1 } : wt))}
                          style={{ width: 52, padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(0,0,0,0.12)", fontSize: 12, textAlign: "right" }}
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: 9, color: "#9CA3AF", marginBottom: 2 }}>VZ €/Mo</p>
                        <input
                          type="number"
                          step="0.01"
                          value={t.vorauszahlung_edit || ""}
                          onChange={e => setWizardTenants(prev => prev.map(wt => wt.id === t.id ? { ...wt, vorauszahlung_edit: parseFloat(e.target.value) || 0 } : wt))}
                          style={{ width: 72, padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(0,0,0,0.12)", fontSize: 12, textAlign: "right" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "10px 20px", background: "#F8F7F4", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>Gesamtfläche: <strong style={{ color: "#101418" }}>{gesamtflaeche.toFixed(1)} m²</strong></p>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setWizardStep(2)}
                disabled={!selectedPropertyId || wizardTenants.filter(t => t.included).length === 0}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "white", background: "#A07830", padding: "11px 24px", borderRadius: 10, cursor: "pointer", opacity: (!selectedPropertyId || wizardTenants.filter(t => t.included).length === 0) ? 0.4 : 1 }}
              >
                Weiter <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: ZEITRAUM ── */}
        {wizardStep === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#101418", marginBottom: 4, letterSpacing: "-0.02em" }}>Welchen Zeitraum?</h2>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Wähle das Abrechnungsjahr. Die Frist beträgt 12 Monate nach Zeitraumende (§556 BGB).</p>

            {/* Year buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {[new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear()].map(y => (
                <button
                  key={y}
                  onClick={() => handleSelectYear(y)}
                  style={{
                    padding: "10px 24px", borderRadius: 10, fontSize: 15, fontWeight: 600,
                    background: abrechnungsJahr === y && zeitraumVon ? "#A07830" : "white",
                    color: abrechnungsJahr === y && zeitraumVon ? "white" : "#101418",
                    border: abrechnungsJahr === y && zeitraumVon ? "2px solid #A07830" : "1px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                  }}
                >
                  {y}
                </button>
              ))}
            </div>

            {zeitraumVon && zeitraumBis && (
              <>
                <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: 20, marginBottom: 12 }}>
                  <div className="flex items-center gap-4">
                    <div>
                      <p style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Zeitraum</p>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>{fmtDate(zeitraumVon)} – {fmtDate(zeitraumBis)}</p>
                    </div>
                    {faelligBis && (
                      <div>
                        <p style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Gesetzliche Frist</p>
                        <p style={{ fontSize: 15, fontWeight: 600, color: (faelligDays ?? 999) < 90 ? "#B91C1C" : "#101418" }}>{fmtDate(faelligBis)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {faelligDays !== null && faelligDays < 90 && (
                  <div style={{ background: "rgba(185,28,28,0.04)", border: "1px solid rgba(185,28,28,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                    <div className="flex items-center gap-2">
                      <Warning size={14} color="#B91C1C" />
                      <p style={{ fontSize: 12, color: "#B91C1C", fontWeight: 500 }}>
                        Diese Abrechnung ist in {Math.max(0, faelligDays)} Tagen fällig!
                      </p>
                    </div>
                  </div>
                )}

                {/* Vorauszahlungen overview */}
                <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#101418", marginBottom: 12 }}>Erwartete Vorauszahlungen</p>
                  {wizardTenants.filter(t => t.included).map(t => {
                    const monate = 12
                    const gesamt = t.vorauszahlung_edit * monate
                    return (
                      <div key={t.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <p style={{ fontSize: 12, color: "#6B7280" }}>{t.name}</p>
                        <p style={{ fontSize: 12, color: "#101418", fontWeight: 500 }}>
                          {formatNka(t.vorauszahlung_edit)}/Mo × 12 = {formatNka(gesamt)}
                        </p>
                      </div>
                    )
                  })}
                  <div className="flex items-center justify-between pt-3">
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#101418" }}>Vorauszahlungen gesamt</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#A07830" }}>
                      {formatNka(wizardTenants.filter(t => t.included).reduce((s, t) => s + t.vorauszahlung_edit * 12, 0))}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setWizardStep(3)}
                disabled={!zeitraumVon || !zeitraumBis}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "white", background: "#A07830", padding: "11px 24px", borderRadius: 10, cursor: "pointer", opacity: (!zeitraumVon || !zeitraumBis) ? 0.4 : 1 }}
              >
                Weiter <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: KOSTEN ── */}
        {wizardStep === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between mb-2">
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#101418", letterSpacing: "-0.02em" }}>Betriebskosten eingeben</h2>
              <button
                onClick={() => setShowPositionModal(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#A07830", background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.2)", padding: "8px 16px", borderRadius: 9, cursor: "pointer" }}
              >
                <Plus size={13} />
                Kostenposition
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Gib alle umlagefähigen Kosten des Jahres ein (BetrKV §2).</p>

            <div className="grid grid-cols-3 gap-5">
              {/* Positions list */}
              <div className="col-span-2">
                {positionen.length === 0 ? (
                  <div style={{ background: "white", border: "2px dashed rgba(160,120,48,0.2)", borderRadius: 14, padding: "48px 32px", textAlign: "center" }}>
                    <Receipt size={32} color="rgba(160,120,48,0.3)" style={{ margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 14, color: "#9CA3AF" }}>Noch keine Kostenpositionen</p>
                    <button
                      onClick={() => setShowPositionModal(true)}
                      style={{ marginTop: 16, fontSize: 13, fontWeight: 500, color: "#A07830", padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(160,120,48,0.2)" }}
                    >
                      Erste Position hinzufügen
                    </button>
                  </div>
                ) : (
                  <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 60px", padding: "10px 16px", background: "#F8F7F4", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      {["BEZEICHNUNG", "BETRAG", "SCHLÜSSEL", ""].map(h => (
                        <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{h}</span>
                      ))}
                    </div>
                    {positionen.map((pos, i) => (
                      <div key={pos.tempId} style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 60px", padding: "11px 16px", borderBottom: i < positionen.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", alignItems: "center" }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#101418" }}>{pos.bezeichnung}</p>
                          {pos.kostenart_nr && <span style={{ fontSize: 9, color: "#9CA3AF" }}>§2 Nr. {pos.kostenart_nr}</span>}
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#101418", fontVariantNumeric: "tabular-nums" }}>{formatNka(pos.gesamtbetrag)}</p>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(160,120,48,0.08)", color: "#A07830", display: "inline-block" }}>
                          {UMLAGESCHLUESSEL_LABELS[pos.umlageschluessel]}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditPosition(pos); setShowPositionModal(true) }} style={{ padding: 5, borderRadius: 6, color: "#9CA3AF" }}>
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => setPositionen(prev => prev.filter(p => p.tempId !== pos.tempId))} style={{ padding: 5, borderRadius: 6, color: "#B91C1C" }}>
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 60px", padding: "12px 16px", background: "#F8F7F4", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#101418" }}>Gesamtkosten</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#A07830", fontVariantNumeric: "tabular-nums" }}>{formatNka(gesamtkosten)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Live preview */}
              <div>
                <div style={{ background: "white", border: "1px solid rgba(160,120,48,0.15)", borderRadius: 14, padding: 16, position: "sticky", top: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#A07830", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Vorschau</p>
                  {berechnungResult.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>Positionen eingeben für Vorschau</p>
                  ) : (
                    berechnungResult.map(m => (
                      <div key={m.tenant_id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#101418" }}>{m.mieter_name}</p>
                        <div className="flex justify-between mt-1">
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>Kosten</p>
                          <p style={{ fontSize: 11, fontWeight: 500, color: "#101418" }}>{formatNka(m.kosten_gesamt)}</p>
                        </div>
                        <div className="flex justify-between">
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>Vorausz.</p>
                          <p style={{ fontSize: 11, color: "#2D6A2D" }}>− {formatNka(m.vorauszahlungen_gesamt)}</p>
                        </div>
                        <div className="flex justify-between border-t border-[rgba(0,0,0,0.05)] pt-1 mt-1">
                          <p style={{ fontSize: 12, fontWeight: 600, color: m.saldo > 0 ? "#B91C1C" : "#2D6A2D" }}>
                            {m.saldo > 0 ? "Nachzahlung" : "Guthaben"}
                          </p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: m.saldo > 0 ? "#B91C1C" : "#2D6A2D" }}>
                            {m.saldo > 0 ? "+" : ""}{formatNka(m.saldo)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setWizardStep(4)}
                disabled={positionen.length === 0}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "white", background: "#A07830", padding: "11px 24px", borderRadius: 10, cursor: "pointer", opacity: positionen.length === 0 ? 0.4 : 1 }}
              >
                Zur Prüfung <ArrowRight size={14} />
              </button>
            </div>

            <AnimatePresence>
              {showPositionModal && (
                <PositionModal
                  onSave={(pos) => {
                    if (editPosition) {
                      setPositionen(prev => prev.map(p => p.tempId === pos.tempId ? pos : p))
                    } else {
                      setPositionen(prev => [...prev, pos])
                    }
                    setShowPositionModal(false)
                    setEditPosition(null)
                  }}
                  onClose={() => { setShowPositionModal(false); setEditPosition(null) }}
                  editPosition={editPosition}
                  documents={documents}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── STEP 4: PRÜFUNG ── */}
        {wizardStep === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#101418", marginBottom: 4, letterSpacing: "-0.02em" }}>Abrechnung prüfen</h2>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Bitte prüfe alle Angaben vor der Finalisierung.</p>

            {berechnungResult.map(m => (
              <div key={m.tenant_id} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#101418" }}>{m.mieter_name}</p>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {fmtDate(m.zeitraum_von)} – {fmtDate(m.zeitraum_bis)} · {m.tage_anteil} von {m.tage_gesamt} Tagen ({formatAnteil(m.zeitanteil_pct)})
                    </p>
                  </div>
                </div>

                {/* Position table */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 90px", padding: "7px 12px", background: "#F8F7F4", borderRadius: 8, marginBottom: 4 }}>
                    {["KOSTENART", "GESAMT", "ANTEIL", "IHR ANTEIL"].map(h => (
                      <span key={h} style={{ fontSize: 8, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{h}</span>
                    ))}
                  </div>
                  {m.positionen.map(pos => (
                    <div key={pos.position_id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 90px", padding: "7px 12px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <p style={{ fontSize: 12, color: "#101418" }}>{pos.bezeichnung}</p>
                      <p style={{ fontSize: 12, color: "#6B7280", fontVariantNumeric: "tabular-nums" }}>{formatNka(pos.gesamtbetrag)}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF" }}>{formatAnteil(pos.anteil_pct)}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#101418", fontVariantNumeric: "tabular-nums" }}>{formatNka(pos.betrag_mieter)}</p>
                    </div>
                  ))}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 90px", padding: "9px 12px", background: "#F8F7F4", borderRadius: 8, marginTop: 4 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#101418" }}>Betriebskosten gesamt</p>
                    <span />
                    <span />
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#101418", fontVariantNumeric: "tabular-nums" }}>{formatNka(m.kosten_gesamt)}</p>
                  </div>
                </div>

                {/* Vorauszahlungen */}
                <div className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <p style={{ fontSize: 13, color: "#6B7280" }}>Geleistete Vorauszahlungen</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#2D6A2D" }}>− {formatNka(m.vorauszahlungen_gesamt)}</p>
                </div>

                {/* Saldo */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: 16, borderRadius: 10, marginTop: 12,
                  background: m.saldo > 0 ? "rgba(185,28,28,0.04)" : m.saldo < 0 ? "rgba(45,106,45,0.04)" : "rgba(0,0,0,0.03)",
                  border: `1px solid ${m.saldo > 0 ? "rgba(185,28,28,0.12)" : m.saldo < 0 ? "rgba(45,106,45,0.12)" : "rgba(0,0,0,0.06)"}`,
                }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: m.saldo > 0 ? "#B91C1C" : m.saldo < 0 ? "#2D6A2D" : "#101418" }}>
                    {m.saldo > 0 ? "Nachzahlung" : m.saldo < 0 ? "Guthaben" : "Ausgeglichen"}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: m.saldo > 0 ? "#B91C1C" : m.saldo < 0 ? "#2D6A2D" : "#101418", fontVariantNumeric: "tabular-nums" }}>
                    {m.saldo > 0 ? "+" : ""}{formatNka(m.saldo)}
                  </p>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div style={{ background: "rgba(160,120,48,0.04)", border: "1px solid rgba(160,120,48,0.15)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Gesamtkosten", val: berechnungResult.reduce((s, m) => s + m.kosten_gesamt, 0) },
                  { label: "Vorauszahlungen", val: berechnungResult.reduce((s, m) => s + m.vorauszahlungen_gesamt, 0) },
                  { label: "Saldo gesamt", val: berechnungResult.reduce((s, m) => s + m.saldo, 0) },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize: 10, color: "#A07830", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{item.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#101418", fontVariantNumeric: "tabular-nums" }}>{formatNka(item.val)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleFinalize}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "white", background: "#A07830", padding: "12px 28px", borderRadius: 10, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 14px rgba(160,120,48,0.3)" }}
              >
                {saving ? (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                ) : <Check size={14} weight="bold" />}
                Abrechnung finalisieren
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 5: FERTIG ── */}
        {wizardStep === 5 && (
          <motion.div key="step5" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} style={{ textAlign: "center", paddingTop: 32 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 18 }}
              style={{ width: 72, height: 72, borderRadius: 99, background: "rgba(160,120,48,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}
            >
              <CheckCircle size={40} color="#A07830" weight="fill" />
            </motion.div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#101418", marginBottom: 8, letterSpacing: "-0.02em" }}>Abrechnung erstellt!</h2>
            <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 40 }}>
              Nebenkostenabrechnung {abrechnungsJahr} · {selectedProperty?.name}
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
              {[
                { icon: <FilePdf size={22} color="#B91C1C" />, title: "PDF erstellen", desc: "Professionelle Abrechnung als PDF exportieren", btnLabel: "PDF generieren", bg: "rgba(185,28,28,0.06)", border: "rgba(185,28,28,0.12)" },
                { icon: <Envelope size={22} color="#3B82F6" />, title: "Per E-Mail senden", desc: "Direkt an den Mieter versenden", btnLabel: "E-Mail vorbereiten", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.12)" },
                { icon: <FolderOpen size={22} color="#A07830" />, title: "Im DMS speichern", desc: "Als Dokument in der Ablage speichern", btnLabel: "Speichern", bg: "rgba(160,120,48,0.06)", border: "rgba(160,120,48,0.12)" },
              ].map(card => (
                <div key={card.title} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 24, textAlign: "left" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: card.bg, border: `1px solid ${card.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    {card.icon}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#101418", marginBottom: 4 }}>{card.title}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16, lineHeight: 1.5 }}>{card.desc}</p>
                  <button style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)" }}>
                    {card.btnLabel}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4">
              <button onClick={resetWizard} style={{ fontSize: 13, color: "#9CA3AF", padding: "9px 20px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.1)" }}>
                Zur Übersicht
              </button>
              <button
                onClick={() => { resetWizard(); setTimeout(() => { setView("wizard"); setWizardStep(1) }, 50) }}
                style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "9px 20px", borderRadius: 9 }}
              >
                Neue Abrechnung
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* savedAbrechnungId is stored for potential future use */}
      {savedAbrechnungId && null}
    </div>
  )
}
