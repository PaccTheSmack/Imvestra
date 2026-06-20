"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  UserPlus, Users, X, Check, Copy, CheckCircle,
  Buildings, Envelope, Phone,
  Warning, ArrowRight, ListBullets, SquaresFour,
  DotsThreeVertical, MagnifyingGlass,
} from "@phosphor-icons/react"
import { berechneScore, getScoreColor, getScoreBg, getEmpfehlungLabel } from "@/lib/bewerber-scoring"

// ─── TYPES ────────────────────────────────────────────────────────

interface Property { id: string; name: string; address: string; type: string | null }
interface Inserat { id: string; property_id: string; titel: string; kaltmiete: number; status: string }

interface Selbstauskunft {
  id: string; ausgefuellt_am: string | null; zugangscode: string
  nettoeinkommen: number | null; beschaeftigungsart: string | null
  schufa_sauber: boolean | null; insolvenz: boolean | null
  mietschulden: boolean | null; haustiere: boolean | null
  raucher: boolean | null; arbeitgeber: string | null
  aktuelle_adresse: string | null; einverstaendnis_datenschutz: boolean | null
  anzahl_personen: number | null; vorname: string | null; nachname: string | null
  geburtsdatum: string | null; beruf: string | null; beschaeftigt_seit: string | null
  warum_diese_wohnung: string | null
}

interface Bewerber {
  id: string; user_id: string; property_id: string; inserat_id: string | null
  name: string; email: string; telefon: string | null
  status: "neu" | "selbstauskunft_angefordert" | "selbstauskunft_ausgefuellt" | "besichtigung" | "in_pruefung" | "zusage" | "absage" | "mietvertrag"
  quelle: string | null; notizen: string | null
  besichtigung_datum: string | null
  score: number | null; score_details: Record<string, unknown> | null
  dsgvo_loeschdatum: string | null
  created_at: string; updated_at: string
  properties: { name: string; address: string } | null
  inserate: { titel: string; kaltmiete: number } | null
  selbstauskuenfte: Selbstauskunft[]
}

interface BewerberViewProps {
  bewerber: Bewerber[]
  properties: Property[]
  inserate: Inserat[]
  vermieterName: string
}

// ─── CONSTANTS ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Bewerber["status"], { label: string; color: string; bg: string; col: string }> = {
  neu:                         { label: "Neu",            color: "#6B7280", bg: "rgba(107,114,128,0.08)", col: "neu" },
  selbstauskunft_angefordert:  { label: "Auskunft",       color: "#A07830", bg: "rgba(160,120,48,0.08)",  col: "selbstauskunft" },
  selbstauskunft_ausgefuellt:  { label: "Auskunft",       color: "#A07830", bg: "rgba(160,120,48,0.08)",  col: "selbstauskunft" },
  besichtigung:                { label: "Besichtigung",   color: "#1D4ED8", bg: "rgba(29,78,216,0.08)",   col: "besichtigung" },
  in_pruefung:                 { label: "In Prüfung",     color: "#7C3AED", bg: "rgba(124,58,237,0.08)",  col: "in_pruefung" },
  zusage:                      { label: "Zusage",         color: "#2D6A2D", bg: "rgba(45,106,45,0.08)",   col: "zusage" },
  absage:                      { label: "Absage",         color: "#B91C1C", bg: "rgba(185,28,28,0.08)",   col: "absage" },
  mietvertrag:                 { label: "Mietvertrag",    color: "#059669", bg: "rgba(5,150,105,0.08)",   col: "mietvertrag" },
}

const KANBAN_COLS = [
  { key: "neu",           label: "Neu",          statuses: ["neu"] },
  { key: "selbstauskunft",label: "Selbstauskunft", statuses: ["selbstauskunft_angefordert", "selbstauskunft_ausgefuellt"] },
  { key: "besichtigung",  label: "Besichtigung", statuses: ["besichtigung"] },
  { key: "in_pruefung",   label: "In Prüfung",   statuses: ["in_pruefung"] },
  { key: "zusage",        label: "Zusage",       statuses: ["zusage"] },
  { key: "absage",        label: "Absage",       statuses: ["absage", "mietvertrag"] },
]

const QUELLE_OPTIONS = ["ImmoScout24", "Kleinanzeigen", "Empfehlung", "Sonstige"]

// ─── HELPERS ──────────────────────────────────────────────────────

function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("de-DE") }

function StatusBadge({ status }: { status: Bewerber["status"] }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, color: cfg.color, background: cfg.bg, whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  )
}

function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = getScoreColor(score)
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s ease" }} />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size / 3.2, fontWeight: 700, color }}>{score}</span>
    </div>
  )
}

// ─── BEWERBER CARD ────────────────────────────────────────────────

function BewerberCard({ b, onClick }: { b: Bewerber; onClick: () => void }) {
  const auskunft = b.selbstauskuenfte?.[0]
  const hasScore = b.score !== null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      style={{
        background: "white", border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: 12, padding: "14px 14px 12px", marginBottom: 8,
        cursor: "pointer", transition: "all 0.12s",
      }}
      whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: hasScore ? 10 : 0 }}>
        <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#101418", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</p>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.email}</p>
          {b.properties && <p style={{ fontSize: 10, color: "#C4C4C4", margin: 0 }}>{b.properties.name}</p>}
        </div>
        {hasScore && <ScoreRing score={b.score!} />}
      </div>

      {hasScore && auskunft && (
        <div style={{ background: getScoreBg(b.score!), borderRadius: 7, padding: "4px 8px", display: "inline-block" }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: getScoreColor(b.score!) }}>
            {getEmpfehlungLabel(
              b.score! >= 80 ? "stark" : b.score! >= 60 ? "gut" : b.score! >= 40 ? "pruefen" : "ablehnen"
            ).label}
          </span>
        </div>
      )}

      {!hasScore && auskunft && !auskunft.ausgefuellt_am && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: "#A07830" }} />
          <span style={{ fontSize: 10, color: "#A07830" }}>Auskunft ausstehend</span>
        </div>
      )}
    </motion.div>
  )
}

// ─── ADD BEWERBER MODAL ───────────────────────────────────────────

function AddBewerberModal({
  properties, inserate, onClose, onAdded
}: {
  properties: Property[]
  inserate: Inserat[]
  onClose: () => void
  onAdded: (b: Bewerber) => void
}) {
  const [form, setForm] = useState({
    property_id: properties[0]?.id ?? "",
    inserat_id: "",
    name: "", email: "", telefon: "", quelle: "ImmoScout24", notizen: "",
    selbstauskunft_sofort: false,
  })
  const [saving, setSaving] = useState(false)

  const filteredInserate = inserate.filter(i => i.property_id === form.property_id)

  async function save() {
    if (!form.name || !form.email || !form.property_id) return
    setSaving(true)
    const res = await fetch("/api/bewerber", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) { onAdded(data); onClose() }
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 9,
    border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, outline: "none",
    color: "#101418", background: "white", boxSizing: "border-box",
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#101418", margin: 0 }}>Neuen Bewerber erfassen</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}><X size={18} color="#6B7280" /></button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>OBJEKT *</label>
          <select style={inputStyle} value={form.property_id} onChange={e => setForm(p => ({ ...p, property_id: e.target.value, inserat_id: "" }))}>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {filteredInserate.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>INSERAT (optional)</label>
            <select style={inputStyle} value={form.inserat_id} onChange={e => setForm(p => ({ ...p, inserat_id: e.target.value }))}>
              <option value="">Ohne Inserat</option>
              {filteredInserate.map(i => <option key={i.id} value={i.id}>{i.titel} · {i.kaltmiete}€</option>)}
            </select>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[
            { key: "name", label: "NAME *", placeholder: "Max Mustermann" },
            { key: "email", label: "E-MAIL *", placeholder: "max@email.de" },
            { key: "telefon", label: "TELEFON", placeholder: "+49 170 123456" },
          ].map(f => (
            <div key={f.key} style={{ gridColumn: f.key === "name" ? "span 2" : "span 1" }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>{f.label}</label>
              <input style={inputStyle} placeholder={f.placeholder} value={form[f.key as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>QUELLE</label>
          <select style={inputStyle} value={form.quelle} onChange={e => setForm(p => ({ ...p, quelle: e.target.value }))}>
            {QUELLE_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>NOTIZEN</label>
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} placeholder="Interne Notizen..." value={form.notizen} onChange={e => setForm(p => ({ ...p, notizen: e.target.value }))} />
        </div>

        <div
          onClick={() => setForm(p => ({ ...p, selbstauskunft_sofort: !p.selbstauskunft_sofort }))}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: `1.5px solid ${form.selbstauskunft_sofort ? "#A07830" : "rgba(0,0,0,0.1)"}`, borderRadius: 10, cursor: "pointer", background: form.selbstauskunft_sofort ? "rgba(160,120,48,0.04)" : "white", marginBottom: 20, transition: "all 0.12s" }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${form.selbstauskunft_sofort ? "#A07830" : "rgba(0,0,0,0.2)"}`, background: form.selbstauskunft_sofort ? "#A07830" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.12s" }}>
            {form.selbstauskunft_sofort && <Check size={10} color="white" weight="bold" />}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", margin: "0 0 1px" }}>Selbstauskunft sofort anfordern</p>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Link wird nach dem Anlegen generiert</p>
          </div>
        </div>

        <button
          onClick={save}
          disabled={!form.name || !form.email || !form.property_id || saving}
          style={{ width: "100%", padding: "12px 0", background: form.name && form.email ? "#A07830" : "rgba(0,0,0,0.08)", color: form.name && form.email ? "white" : "#9CA3AF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: form.name && form.email ? "pointer" : "not-allowed" }}
        >
          {saving ? "Wird gespeichert..." : "Bewerber anlegen"}
        </button>
      </motion.div>
    </div>
  )
}

// ─── BEWERBER DRAWER ──────────────────────────────────────────────

function BewerberDrawer({
  bewerber: b, inserate, onClose
}: {
  bewerber: Bewerber
  inserate: Inserat[]
  onClose: () => void
}) {
  const router = useRouter()
  const [tab, setTab] = useState<"uebersicht" | "selbstauskunft" | "notizen">("uebersicht")
  const [notizen, setNotizen] = useState(b.notizen ?? "")
  const [linkCopied, setLinkCopied] = useState(false)
  const [loadingAction, setLoadingAction] = useState("")

  const auskunft = b.selbstauskuenfte?.[0]
  const kaltmiete = b.inserate?.kaltmiete ?? inserate.find(i => i.property_id === b.property_id)?.kaltmiete ?? 1000

  const score = auskunft?.ausgefuellt_am
    ? berechneScore({
        nettoeinkommen: auskunft.nettoeinkommen,
        beschaeftigungsart: auskunft.beschaeftigungsart,
        beschaeftigt_seit: auskunft.beschaeftigt_seit,
        arbeitgeber: auskunft.arbeitgeber,
        aktuelle_adresse: auskunft.aktuelle_adresse,
        schufa_sauber: auskunft.schufa_sauber,
        insolvenz: auskunft.insolvenz,
        mietschulden: auskunft.mietschulden,
        haustiere: auskunft.haustiere,
        raucher: auskunft.raucher,
        einverstaendnis_datenschutz: auskunft.einverstaendnis_datenschutz,
      }, kaltmiete)
    : null

  const empf = score ? getEmpfehlungLabel(score.empfehlung) : null

  async function action(path: string, method = "POST") {
    setLoadingAction(path)
    await fetch(path, { method })
    setLoadingAction("")
    router.refresh()
    onClose()
  }

  async function requestSelbstauskunft() {
    setLoadingAction("selbstauskunft")
    const res = await fetch("/api/bewerber/selbstauskunft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bewerber_id: b.id }),
    })
    const { link } = await res.json()
    await navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
    setLoadingAction("")
    router.refresh()
  }

  async function saveNotizen() {
    await fetch(`/api/bewerber/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notizen }),
    })
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 40 }} onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 560, background: "white", zIndex: 41, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 0", borderBottom: "1px solid rgba(0,0,0,0.07)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#101418", margin: 0 }}>{b.name}</h2>
                <StatusBadge status={b.status} />
              </div>
              {b.properties && <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{b.properties.name}</p>}
            </div>
            <button onClick={onClose} style={{ border: "none", background: "rgba(0,0,0,0.04)", borderRadius: 8, padding: 6, cursor: "pointer" }}>
              <X size={16} color="#6B7280" />
            </button>
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {(["uebersicht", "selbstauskunft", "notizen"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "10px 16px", border: "none", background: "none", cursor: "pointer",
                borderBottom: `2px solid ${t === tab ? "#A07830" : "transparent"}`,
                fontSize: 12, fontWeight: t === tab ? 600 : 400,
                color: t === tab ? "#A07830" : "#9CA3AF",
              }}>
                {t === "uebersicht" ? "Übersicht" : t === "selbstauskunft" ? "Selbstauskunft" : "Notizen"}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {tab === "uebersicht" && (
            <div>
              {/* Contact */}
              <div style={{ background: "#F8F7F4", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                {b.email && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Envelope size={13} color="#9CA3AF" /><span style={{ fontSize: 13, color: "#374151" }}>{b.email}</span></div>}
                {b.telefon && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Phone size={13} color="#9CA3AF" /><span style={{ fontSize: 13, color: "#374151" }}>{b.telefon}</span></div>}
                {b.quelle && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Buildings size={13} color="#9CA3AF" /><span style={{ fontSize: 13, color: "#374151" }}>Quelle: {b.quelle}</span></div>}
              </div>

              {/* Score */}
              {score && empf && (
                <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <ScoreRing score={score.gesamt} size={64} />
                    <div>
                      <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 4px" }}>Gesamt-Score</p>
                      <div style={{ background: empf.bg, borderRadius: 8, padding: "4px 10px", display: "inline-block" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: empf.color }}>{empf.label}</span>
                      </div>
                    </div>
                  </div>

                  {[
                    { key: "einkommen", label: "Einkommen", max: 35 },
                    { key: "beschaeftigung", label: "Beschäftigung", max: 25 },
                    { key: "schufa", label: "Schufa", max: 25 },
                    { key: "haushalt", label: "Haushalt", max: 10 },
                    { key: "vollstaendigkeit", label: "Vollständigkeit", max: 5 },
                  ].map(cat => {
                    const val = score.details[cat.key as keyof typeof score.details]
                    const pct = (val / cat.max) * 100
                    return (
                      <div key={cat.key} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: "#6B7280" }}>{cat.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{val}/{cat.max}</span>
                        </div>
                        <div style={{ height: 5, background: "rgba(0,0,0,0.06)", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: getScoreColor(score.gesamt), borderRadius: 3, transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    )
                  })}

                  {score.hinweise.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      {score.hinweise.map((h, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <Warning size={12} color="#D97706" />
                          <span style={{ fontSize: 11, color: "#92400E" }}>{h}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 10 }}>VERLAUF</p>
                {[
                  { label: "Bewerbung eingegangen", date: b.created_at, always: true },
                  { label: "Selbstauskunft angefordert", date: b.updated_at, show: ["selbstauskunft_angefordert", "selbstauskunft_ausgefuellt", "besichtigung", "in_pruefung", "zusage", "absage", "mietvertrag"].includes(b.status) },
                  { label: "Selbstauskunft ausgefüllt", date: auskunft?.ausgefuellt_am ?? "", show: !!auskunft?.ausgefuellt_am },
                  { label: "Besichtigung", date: b.besichtigung_datum ?? "", show: !!b.besichtigung_datum },
                ].filter(e => e.always || e.show).map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 7, height: 7, borderRadius: 4, background: "#A07830", flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "#374151", margin: 0 }}>{e.label}</p>
                      {e.date && <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0 }}>{fmtDate(e.date)}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {b.status === "neu" && (
                  <button
                    onClick={requestSelbstauskunft}
                    disabled={loadingAction === "selbstauskunft"}
                    style={{ width: "100%", padding: "11px 0", background: "#A07830", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {linkCopied ? <><CheckCircle size={15} /> Link kopiert!</> : <>{loadingAction === "selbstauskunft" ? "..." : "Selbstauskunft anfordern"}</>}
                  </button>
                )}

                {(b.status === "selbstauskunft_angefordert") && (
                  <button
                    onClick={requestSelbstauskunft}
                    style={{ width: "100%", padding: "11px 0", background: "white", color: "#A07830", border: "1px solid rgba(160,120,48,0.3)", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <Copy size={14} /> {linkCopied ? "Kopiert!" : "Link erneut kopieren"}
                  </button>
                )}

                {b.status === "selbstauskunft_ausgefuellt" && (
                  <>
                    <button onClick={() => action(`/api/bewerber/${b.id}`, "PATCH")} style={{ width: "100%", padding: "11px 0", background: "#1D4ED8", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Zur Besichtigung einladen
                    </button>
                    <button onClick={() => action(`/api/bewerber/${b.id}/absage`)} style={{ width: "100%", padding: "11px 0", background: "white", color: "#B91C1C", border: "1px solid rgba(185,28,28,0.2)", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>
                      Absage erteilen
                    </button>
                  </>
                )}

                {b.status === "besichtigung" && (
                  <>
                    <button onClick={() => action(`/api/bewerber/${b.id}/zusage`)} style={{ width: "100%", padding: "11px 0", background: "#2D6A2D", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Zusage erteilen
                    </button>
                    <button onClick={() => action(`/api/bewerber/${b.id}/absage`)} style={{ width: "100%", padding: "11px 0", background: "white", color: "#B91C1C", border: "1px solid rgba(185,28,28,0.2)", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>
                      Absage erteilen
                    </button>
                  </>
                )}

                {b.status === "zusage" && (
                  <button
                    onClick={() => router.push(`/mietvertraege?bewerber_id=${b.id}`)}
                    style={{ width: "100%", padding: "11px 0", background: "#A07830", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    Mietvertrag erstellen <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === "selbstauskunft" && (
            <div>
              {!auskunft ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
                  <Users size={32} color="#D1D5DB" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 13 }}>Noch keine Selbstauskunft angefordert</p>
                </div>
              ) : !auskunft.ausgefuellt_am ? (
                <div>
                  <div style={{ background: "rgba(160,120,48,0.06)", border: "1px solid rgba(160,120,48,0.15)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <p style={{ fontSize: 12, color: "#92400E", margin: "0 0 10px" }}>Link wurde versendet — wartet auf Ausfüllen</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/selbstauskunft/${auskunft.zugangscode}`}
                        style={{ flex: 1, padding: "7px 10px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontSize: 11, color: "#6B7280", background: "white" }}
                      />
                      <button onClick={requestSelbstauskunft} style={{ padding: "7px 12px", background: "#A07830", color: "white", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        <Copy size={12} /> {linkCopied ? "Kopiert" : "Kopieren"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { title: "Persönliche Daten", fields: [
                      ["Name", `${auskunft.vorname ?? ""} ${auskunft.nachname ?? ""}`.trim()],
                      ["Geburtsdatum", auskunft.geburtsdatum ? fmtDate(auskunft.geburtsdatum) : ""],
                      ["Adresse", auskunft.aktuelle_adresse],
                    ]},
                    { title: "Beruf & Einkommen", fields: [
                      ["Beschäftigung", auskunft.beschaeftigungsart],
                      ["Arbeitgeber", auskunft.arbeitgeber],
                      ["Beschäftigt seit", auskunft.beschaeftigt_seit ? fmtDate(auskunft.beschaeftigt_seit) : ""],
                      ["Nettoeinkommen", auskunft.nettoeinkommen ? `${auskunft.nettoeinkommen.toLocaleString("de-DE")} €/Monat` : ""],
                    ]},
                    { title: "Haushalt", fields: [
                      ["Personen", String(auskunft.anzahl_personen ?? 1)],
                      ["Haustiere", auskunft.haustiere ? "Ja" : "Nein"],
                      ["Raucher", auskunft.raucher ? "Ja" : "Nein"],
                    ]},
                    { title: "Finanzen", fields: [
                      ["Schufa", auskunft.schufa_sauber === true ? "Sauber" : auskunft.schufa_sauber === false ? "Einträge vorhanden" : "Keine Auskunft"],
                      ["Insolvenz", auskunft.insolvenz ? "Ja" : "Nein"],
                      ["Mietschulden", auskunft.mietschulden ? "Ja" : "Nein"],
                    ]},
                  ].map(section => (
                    <div key={section.title} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", margin: "0 0 10px" }}>{section.title.toUpperCase()}</p>
                      {section.fields.filter(([, v]) => v).map(([label, value]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>{label}</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ))}

                  {auskunft.warum_diese_wohnung && (
                    <div style={{ background: "rgba(160,120,48,0.04)", borderRadius: 12, padding: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", margin: "0 0 6px" }}>MOTIVATION</p>
                      <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>{auskunft.warum_diese_wohnung}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "notizen" && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 8 }}>INTERNE NOTIZEN</p>
              <textarea
                value={notizen}
                onChange={e => setNotizen(e.target.value)}
                onBlur={saveNotizen}
                placeholder="Notizen zum Bewerber..."
                style={{ width: "100%", minHeight: 200, padding: "12px 14px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, fontSize: 13, color: "#374151", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
              <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 6 }}>Wird automatisch gespeichert beim Verlassen des Feldes</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ─── MAIN VIEW ────────────────────────────────────────────────────

export default function BewerberView({ bewerber: initialBewerber, properties, inserate }: BewerberViewProps) {
  const [bewerber, setBewerber] = useState(initialBewerber)
  const [filterProperty, setFilterProperty] = useState("all")
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Bewerber | null>(null)
  const [search, setSearch] = useState("")

  const filtered = bewerber.filter(b => {
    if (filterProperty !== "all" && b.property_id !== filterProperty) return false
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    neu: bewerber.filter(b => b.status === "neu" || b.status === "selbstauskunft_angefordert").length,
    ausgefuellt: bewerber.filter(b => b.status === "selbstauskunft_ausgefuellt").length,
    besichtigung: bewerber.filter(b => b.status === "besichtigung").length,
  }

  const handleAdded = useCallback((b: Bewerber) => setBewerber(p => [b, ...p]), [])

  return (
    <div style={{ padding: "32px 40px", background: "#F8F7F4", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(160,120,48,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={20} color="#A07830" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#101418", margin: 0 }}>Bewerbermanagement</h1>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>{bewerber.length} Bewerber · {bewerber.filter(b => !["absage", "mietvertrag"].includes(b.status)).length} aktiv</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 9, overflow: "hidden" }}>
            {(["kanban", "list"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "7px 12px", border: "none", background: v === view ? "rgba(160,120,48,0.1)" : "transparent", color: v === view ? "#A07830" : "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                {v === "kanban" ? <SquaresFour size={14} /> : <ListBullets size={14} />}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", background: "#101418", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <UserPlus size={15} /> Bewerber hinzufügen
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Neue Bewerber", value: counts.neu, color: "#A07830", bg: "rgba(160,120,48,0.08)" },
          { label: "Auskunft erhalten", value: counts.ausgefuellt, color: "#2D6A2D", bg: "rgba(45,106,45,0.08)" },
          { label: "Besichtigungen", value: counts.besichtigung, color: "#1D4ED8", bg: "rgba(29,78,216,0.08)" },
          { label: "Offene Stellen", value: properties.length, color: "#B91C1C", bg: "rgba(185,28,28,0.08)" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: "16px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", margin: "0 0 6px" }}>{stat.label.toUpperCase()}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 9, padding: "7px 12px", flex: 1, maxWidth: 240 }}>
          <MagnifyingGlass size={13} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..." style={{ border: "none", outline: "none", fontSize: 12, color: "#374151", background: "transparent", width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {[{ id: "all", name: "Alle Objekte" }, ...properties].map(p => (
            <button key={p.id} onClick={() => setFilterProperty(p.id)} style={{
              padding: "7px 14px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
              background: filterProperty === p.id ? "#A07830" : "white",
              color: filterProperty === p.id ? "white" : "#6B7280",
            }}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban */}
      {view === "kanban" && (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
          {KANBAN_COLS.map(col => {
            const colItems = filtered.filter(b => col.statuses.includes(b.status))
            return (
              <div key={col.key} style={{ width: 264, flexShrink: 0 }}>
                <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{col.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", background: "rgba(0,0,0,0.05)", borderRadius: 99, padding: "1px 7px" }}>{colItems.length}</span>
                </div>
                <div>
                  {colItems.map(b => (
                    <BewerberCard key={b.id} b={b} onClick={() => setSelected(b)} />
                  ))}
                  {colItems.length === 0 && (
                    <div style={{ border: "1.5px dashed rgba(0,0,0,0.08)", borderRadius: 10, padding: "20px 0", textAlign: "center" }}>
                      <span style={{ fontSize: 11, color: "#D1D5DB" }}>Leer</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List */}
      {view === "list" && (
        <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 80px 100px 80px", padding: "10px 20px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            {["Name", "Objekt", "Status", "Score", "Datum", ""].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF" }}>{h}</span>
            ))}
          </div>
          {filtered.map(b => (
            <div key={b.id} onClick={() => setSelected(b)} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 80px 100px 80px", padding: "12px 20px", borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer", transition: "background 0.1s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#101418", margin: "0 0 1px" }}>{b.name}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{b.email}</p>
              </div>
              <span style={{ fontSize: 12, color: "#6B7280", alignSelf: "center" }}>{b.properties?.name ?? "—"}</span>
              <div style={{ alignSelf: "center" }}><StatusBadge status={b.status} /></div>
              <div style={{ alignSelf: "center" }}>
                {b.score !== null ? <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(b.score) }}>{b.score}</span> : <span style={{ color: "#D1D5DB" }}>—</span>}
              </div>
              <span style={{ fontSize: 11, color: "#9CA3AF", alignSelf: "center" }}>{fmtDate(b.created_at)}</span>
              <button style={{ border: "none", background: "none", cursor: "pointer", alignSelf: "center" }}><DotsThreeVertical size={16} color="#9CA3AF" /></button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#9CA3AF" }}>
              <Users size={28} color="#D1D5DB" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>Keine Bewerber gefunden</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <AddBewerberModal
            properties={properties}
            inserate={inserate}
            onClose={() => setShowAdd(false)}
            onAdded={handleAdded}
          />
        )}
        {selected && (
          <BewerberDrawer
            bewerber={selected}
            inserate={inserate}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
