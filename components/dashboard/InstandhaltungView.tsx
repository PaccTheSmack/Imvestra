"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Wrench,
  Flame,
  Lightning,
  House,
  Warning,
  Plant,
  ArrowsVertical,
  Drop,
  FireSimple,
  PaintBrush,
  Check,
  X,
  Plus,
  CalendarBlank,
  CurrencyEur,
  User,
} from "@phosphor-icons/react"
import type { Property } from "@/types"

interface Instandhaltung {
  id: string
  user_id: string
  property_id: string
  titel: string
  beschreibung?: string
  kategorie: string
  intervall?: string
  faellig_am: string
  erledigt_am?: string
  naechste_faelligkeit?: string
  kosten_geschaetzt?: number
  kosten_tatsaechlich?: number
  handwerker?: string
  angebot_eingeholt?: boolean
  status: "offen" | "in_bearbeitung" | "erledigt" | "verschoben"
  prioritaet: "niedrig" | "mittel" | "hoch" | "dringend"
  notizen?: string
  created_at: string
  updated_at: string
}

interface InstandhaltungVorlage {
  id: string
  titel: string
  kategorie: string
  intervall: string
  beschreibung?: string
  kosten_geschaetzt?: number
}

interface InstandhaltungViewProps {
  aufgaben: Instandhaltung[]
  properties: Property[]
  vorlagen: InstandhaltungVorlage[]
}

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(n) + " €"
}

function monthKey(d: string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(key: string) {
  const [y, m] = key.split("-")
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  })
}

function isOverdue(faellig_am: string, status: string) {
  return status !== "erledigt" && new Date(faellig_am) < new Date(new Date().toDateString())
}

function isDueThisWeek(faellig_am: string) {
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const due = new Date(faellig_am)
  return due >= now && due <= weekFromNow
}

// ── kategorie config ──────────────────────────────────────────────────────────

type KategorieConfig = {
  icon: React.ElementType
  bg: string
  color: string
  label: string
}

const KATEGORIE_CONFIG: Record<string, KategorieConfig> = {
  heizung:       { icon: Flame,          bg: "rgba(234,88,12,0.1)",   color: "#EA580C", label: "Heizung" },
  elektrik:      { icon: Lightning,      bg: "rgba(234,179,8,0.1)",   color: "#CA8A04", label: "Elektrik" },
  dach:          { icon: House,          bg: "rgba(59,130,246,0.1)",  color: "#3B82F6", label: "Dach" },
  brandschutz:   { icon: Warning,        bg: "rgba(185,28,28,0.1)",   color: "#B91C1C", label: "Brandschutz" },
  garten:        { icon: Plant,          bg: "rgba(45,106,45,0.1)",   color: "#2D6A2D", label: "Garten" },
  aufzug:        { icon: ArrowsVertical, bg: "rgba(147,51,234,0.1)",  color: "#9333EA", label: "Aufzug" },
  sanitaer:      { icon: Drop,           bg: "rgba(14,165,233,0.1)",  color: "#0EA5E9", label: "Sanitär" },
  schornstein:   { icon: FireSimple,     bg: "rgba(107,114,128,0.1)", color: "#6B7280", label: "Schornstein" },
  malerarbeiten: { icon: PaintBrush,     bg: "rgba(236,72,153,0.1)",  color: "#EC4899", label: "Malerarbeiten" },
  sonstige:      { icon: Wrench,         bg: "rgba(107,114,128,0.08)",color: "#6B7280", label: "Sonstige" },
}

const ALLE_KATEGORIEN = Object.entries(KATEGORIE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))

const INTERVALL_LABELS: Record<string, string> = {
  einmalig:       "Einmalig",
  monatlich:      "Monatlich",
  quartalsweise:  "Quartalsweise",
  halbjaehrlich:  "Halbjährlich",
  jaehrlich:      "Jährlich",
  "2_jahre":      "Alle 2 Jahre",
  "5_jahre":      "Alle 5 Jahre",
  "10_jahre":     "Alle 10 Jahre",
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, red }: { label: string; value: string; sub?: string; red?: boolean }) {
  return (
    <div style={{ background: "white", borderRadius: 14, border: "1px solid #E5E3DC", padding: "16px 20px" }}>
      <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, fontWeight: 500, letterSpacing: "0.03em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: red ? "#B91C1C" : "#101418", lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>{sub}</p>}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function InstandhaltungView({ aufgaben, properties, vorlagen }: InstandhaltungViewProps) {
  const [items, setItems] = useState<Instandhaltung[]>(aufgaben)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProperty, setFilterProperty] = useState("all")
  const [filterKategorie, setFilterKategorie] = useState("all")
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editKosten, setEditKosten] = useState<Record<string, string>>({})
  const [editNotizen, setEditNotizen] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  // Add form state
  const [addForm, setAddForm] = useState({
    titel: "",
    kategorie: "sonstige",
    property_id: properties[0]?.id ?? "",
    faellig_am: "",
    intervall: "einmalig",
    prioritaet: "mittel",
    kosten_geschaetzt: "",
    handwerker: "",
    beschreibung: "",
    status: "offen",
  })
  const [addSaving, setAddSaving] = useState(false)

  // ── derived ──────────────────────────────────────────────────────────────

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const thisYearStart = new Date(now.getFullYear(), 0, 1)
  const thisYearEnd = new Date(now.getFullYear(), 11, 31)

  const diesesMonatFaellig = items.filter(i => {
    const d = new Date(i.faellig_am)
    return i.status !== "erledigt" && d >= thisMonthStart && d <= thisMonthEnd
  }).length

  const ueberfaellig = items.filter(i => isOverdue(i.faellig_am, i.status)).length

  const geplanteKostenJahr = items
    .filter(i => {
      const d = new Date(i.faellig_am)
      return i.status !== "erledigt" && d >= thisYearStart && d <= thisYearEnd
    })
    .reduce((s, i) => s + (i.kosten_geschaetzt ?? 0), 0)

  const erledigtJahr = items.filter(i => {
    if (i.status !== "erledigt" || !i.erledigt_am) return false
    const d = new Date(i.erledigt_am)
    return d >= thisYearStart && d <= thisYearEnd
  }).length

  // ── filter ───────────────────────────────────────────────────────────────

  const filtered = items.filter(i => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false
    if (filterProperty !== "all" && i.property_id !== filterProperty) return false
    if (filterKategorie !== "all" && i.kategorie !== filterKategorie) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!i.titel.toLowerCase().includes(q) && !(i.handwerker ?? "").toLowerCase().includes(q)) return false
    }
    return true
  })

  // ── group by month ────────────────────────────────────────────────────────

  const overdue = filtered.filter(i => isOverdue(i.faellig_am, i.status))
  const notOverdue = filtered.filter(i => !isOverdue(i.faellig_am, i.status))

  const groups: { key: string; label: string; items: Instandhaltung[] }[] = []

  if (overdue.length > 0) {
    groups.push({ key: "__overdue__", label: "Überfällig", items: overdue.sort((a, b) => new Date(a.faellig_am).getTime() - new Date(b.faellig_am).getTime()) })
  }

  const monthMap = new Map<string, Instandhaltung[]>()
  for (const item of notOverdue) {
    const k = monthKey(item.faellig_am)
    if (!monthMap.has(k)) monthMap.set(k, [])
    monthMap.get(k)!.push(item)
  }
  const sortedKeys = Array.from(monthMap.keys()).sort()
  for (const k of sortedKeys) {
    groups.push({ key: k, label: monthLabel(k), items: monthMap.get(k)! })
  }

  // ── actions ───────────────────────────────────────────────────────────────

  async function markErledigt(id: string) {
    const today_str = new Date().toISOString().slice(0, 10)
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: "erledigt", erledigt_am: today_str } : i))
    await fetch(`/api/instandhaltung/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "erledigt", erledigt_am: today_str }),
    })
  }

  async function saveDetails(id: string) {
    setSaving(id)
    const payload: Record<string, unknown> = {}
    if (editKosten[id] !== undefined) payload.kosten_tatsaechlich = parseFloat(editKosten[id]) || null
    if (editNotizen[id] !== undefined) payload.notizen = editNotizen[id]
    setItems(prev => prev.map(i => i.id === id ? {
      ...i,
      kosten_tatsaechlich: payload.kosten_tatsaechlich as number | undefined,
      notizen: payload.notizen as string | undefined,
    } : i))
    await fetch(`/api/instandhaltung/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSaving(null)
  }

  async function handleAdd() {
    if (!addForm.titel.trim() || !addForm.faellig_am || !addForm.property_id) return
    setAddSaving(true)
    const res = await fetch("/api/instandhaltung", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...addForm,
        kosten_geschaetzt: addForm.kosten_geschaetzt ? parseFloat(addForm.kosten_geschaetzt) : null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setItems(prev => [...prev, data])
      setShowAdd(false)
      setAddForm({ titel: "", kategorie: "sonstige", property_id: properties[0]?.id ?? "", faellig_am: "", intervall: "einmalig", prioritaet: "mittel", kosten_geschaetzt: "", handwerker: "", beschreibung: "", status: "offen" })
    }
    setAddSaving(false)
  }

  // ── kostenprojekion data ──────────────────────────────────────────────────

  const projMonths: { label: string; total: number }[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" })
    const total = items
      .filter(item => item.status !== "erledigt" && monthKey(item.faellig_am) === key)
      .reduce((s, item) => s + (item.kosten_geschaetzt ?? 0), 0)
    return { label, total }
  })

  const maxProj = Math.max(...projMonths.map(m => m.total), 1)
  const totalProj = projMonths.reduce((s, m) => s + m.total, 0)
  const avgProj = totalProj / 12

  const propertyName = (id: string) => properties.find(p => p.id === id)?.name ?? "—"

  // ── render ────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #E5E3DC",
    fontSize: 13,
    color: "#101418",
    background: "#F8F7F4",
    outline: "none",
    boxSizing: "border-box",
  }

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(160,120,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wrench size={22} weight="bold" color="#A07830" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#101418", margin: 0 }}>Instandhaltung</h1>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>Wartungsplanung &amp; Reparaturen</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "#A07830", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <Plus size={15} weight="bold" />
          Aufgabe hinzufügen
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Diesen Monat fällig" value={String(diesesMonatFaellig)} />
        <StatCard label="Überfällig" value={String(ueberfaellig)} red={ueberfaellig > 0} sub={ueberfaellig > 0 ? "Sofort handeln" : undefined} />
        <StatCard label="Geplante Kosten (Jahr)" value={fmtCurrency(geplanteKostenJahr)} sub="offene Aufgaben" />
        <StatCard label="Erledigt (Jahr)" value={String(erledigtJahr)} sub="Aufgaben abgeschlossen" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 180px" }}>
          <input
            placeholder="Suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" /></svg>
          </span>
        </div>
        <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)} style={{ ...selectStyle, flex: "1 1 160px" }}>
          <option value="all">Alle Objekte</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterKategorie} onChange={e => setFilterKategorie(e.target.value)} style={{ ...selectStyle, flex: "1 1 160px" }}>
          <option value="all">Alle Kategorien</option>
          {ALLE_KATEGORIEN.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { val: "all", label: "Alle" },
            { val: "offen", label: "Offen" },
            { val: "in_bearbeitung", label: "In Bearbeitung" },
            { val: "erledigt", label: "Erledigt" },
            { val: "verschoben", label: "Verschoben" },
          ].map(s => (
            <button
              key={s.val}
              onClick={() => setFilterStatus(s.val)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                border: "1px solid",
                cursor: "pointer",
                borderColor: filterStatus === s.val ? "#A07830" : "#E5E3DC",
                background: filterStatus === s.val ? "rgba(160,120,48,0.1)" : "white",
                color: filterStatus === s.val ? "#A07830" : "#6B7280",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
          <Wrench size={40} color="#E5E3DC" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 14 }}>Keine Aufgaben gefunden</p>
        </div>
      ) : (
        <div style={{ marginBottom: 32 }}>
          {groups.map(group => {
            const groupCost = group.items.reduce((s, i) => s + (i.kosten_geschaetzt ?? 0), 0)
            const isOverdueGroup = group.key === "__overdue__"
            return (
              <div key={group.key} style={{ marginBottom: 28 }}>
                {/* Month header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isOverdueGroup ? "#B91C1C" : "#101418",
                    letterSpacing: "0.01em",
                  }}>
                    {group.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#9CA3AF", background: "#F3F2EE", borderRadius: 20, padding: "2px 8px" }}>
                    {group.items.length} Aufgabe{group.items.length !== 1 ? "n" : ""}
                  </span>
                  {groupCost > 0 && (
                    <span style={{ fontSize: 11, color: "#A07830", background: "rgba(160,120,48,0.08)", borderRadius: 20, padding: "2px 8px" }}>
                      {fmtCurrency(groupCost)}
                    </span>
                  )}
                  <div style={{ flex: 1, height: 1, background: isOverdueGroup ? "rgba(185,28,28,0.15)" : "#E5E3DC" }} />
                </div>

                {/* Task cards */}
                {group.items.map(item => {
                  const cfg = KATEGORIE_CONFIG[item.kategorie] ?? KATEGORIE_CONFIG.sonstige
                  const Icon = cfg.icon
                  const overdue = isOverdue(item.faellig_am, item.status)
                  const thisWeek = !overdue && isDueThisWeek(item.faellig_am)
                  const expanded = expandedId === item.id

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: "white",
                        border: `1px solid ${overdue ? "rgba(185,28,28,0.2)" : "#E5E3DC"}`,
                        borderRadius: 12,
                        padding: "14px 16px",
                        marginBottom: 8,
                        cursor: "pointer",
                      }}
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        {/* Kategorie icon */}
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: cfg.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <Icon size={18} weight="bold" color={cfg.color} />
                        </div>

                        {/* Middle */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#101418" }}>{item.titel}</span>
                            {item.intervall && item.intervall !== "einmalig" && (
                              <span style={{ fontSize: 9, background: "rgba(160,120,48,0.1)", color: "#A07830", borderRadius: 20, padding: "2px 7px", fontWeight: 600 }}>
                                {INTERVALL_LABELS[item.intervall] ?? item.intervall}
                              </span>
                            )}
                            {(item.prioritaet === "hoch" || item.prioritaet === "dringend") && (
                              <span style={{ fontSize: 9, background: "rgba(185,28,28,0.1)", color: "#B91C1C", borderRadius: 20, padding: "2px 7px", fontWeight: 600 }}>
                                {item.prioritaet === "dringend" ? "Dringend" : "Hoch"}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>{propertyName(item.property_id)}</p>
                          {item.handwerker && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                              <User size={10} color="#9CA3AF" />
                              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{item.handwerker}</span>
                            </div>
                          )}
                        </div>

                        {/* Right */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: overdue ? 700 : 500,
                            color: overdue ? "#B91C1C" : thisWeek ? "#EA580C" : "#9CA3AF",
                          }}>
                            {overdue
                              ? `Überfällig — ${fmtDate(item.faellig_am)}`
                              : fmtDate(item.faellig_am)}
                          </span>
                          {item.kosten_geschaetzt != null && (
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <CurrencyEur size={11} color="#A07830" />
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#A07830" }}>
                                {fmtCurrency(item.kosten_geschaetzt)}
                              </span>
                            </div>
                          )}
                          {item.status === "erledigt" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Check size={13} color="#2D6A2D" weight="bold" />
                              <span style={{ fontSize: 11, color: "#2D6A2D", fontWeight: 600 }}>
                                Erledigt{item.erledigt_am ? ` ${fmtDate(item.erledigt_am)}` : ""}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => markErledigt(item.id)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 600,
                                border: "1px solid #A07830",
                                background: "rgba(160,120,48,0.08)",
                                color: "#A07830",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Check size={11} weight="bold" />
                              Erledigt
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expand */}
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: "hidden" }}
                            onClick={e => e.stopPropagation()}
                          >
                            <div style={{ paddingTop: 14, borderTop: "1px solid #F3F2EE", marginTop: 14 }}>
                              {item.beschreibung && (
                                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>{item.beschreibung}</p>
                              )}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                                <div>
                                  <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>
                                    <CurrencyEur size={10} style={{ marginRight: 3 }} />
                                    Tatsächliche Kosten (€)
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={editKosten[item.id] ?? (item.kosten_tatsaechlich != null ? String(item.kosten_tatsaechlich) : "")}
                                    onChange={e => setEditKosten(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    style={inputStyle}
                                  />
                                </div>
                                {item.naechste_faelligkeit && (
                                  <div>
                                    <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>
                                      <CalendarBlank size={10} style={{ marginRight: 3 }} />
                                      Nächste Fälligkeit
                                    </label>
                                    <div style={{ ...inputStyle, color: "#6B7280" }}>
                                      {fmtDate(item.naechste_faelligkeit)}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Notizen</label>
                                <textarea
                                  rows={2}
                                  placeholder="Notizen…"
                                  value={editNotizen[item.id] ?? (item.notizen ?? "")}
                                  onChange={e => setEditNotizen(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  style={{ ...inputStyle, resize: "vertical" }}
                                />
                              </div>
                              <button
                                onClick={() => saveDetails(item.id)}
                                disabled={saving === item.id}
                                style={{
                                  padding: "7px 16px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: "#A07830",
                                  color: "white",
                                  border: "none",
                                  cursor: "pointer",
                                  opacity: saving === item.id ? 0.6 : 1,
                                }}
                              >
                                {saving === item.id ? "Speichert…" : "Speichern"}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* Kostenprojektion */}
      <div style={{ background: "white", border: "1px solid #E5E3DC", borderRadius: 14, padding: "20px 24px", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#101418", margin: 0 }}>Kostenprojektion nächste 12 Monate</h3>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>
              Steuerlich absetzbar als Werbungskosten (§9 EStG)
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#101418", margin: 0 }}>{fmtCurrency(totalProj)}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Ø {fmtCurrency(Math.round(avgProj))} / Monat</p>
          </div>
        </div>
        <svg viewBox={`0 0 ${projMonths.length * 72} 120`} style={{ width: "100%", height: 120, overflow: "visible" }}>
          {projMonths.map((m, i) => {
            const barH = maxProj > 0 ? Math.max((m.total / maxProj) * 80, m.total > 0 ? 4 : 0) : 0
            const x = i * 72 + 10
            const y = 85 - barH
            return (
              <g key={i}>
                <rect x={x} y={y} width={52} height={barH} rx={4} fill={m.total > 0 ? "rgba(160,120,48,0.7)" : "#F3F2EE"} />
                <text x={x + 26} y={100} textAnchor="middle" fontSize={9} fill="#9CA3AF">{m.label}</text>
                {m.total > 0 && (
                  <text x={x + 26} y={y - 4} textAnchor="middle" fontSize={8} fill="#A07830" fontWeight="600">
                    {fmtCurrency(m.total)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000, padding: 20,
            }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "#F8F7F4",
                borderRadius: 16,
                padding: 28,
                width: "100%",
                maxWidth: 520,
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#101418", margin: 0 }}>Neue Aufgabe</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                  <X size={20} />
                </button>
              </div>

              {/* Vorlagen quick-fill */}
              {vorlagen.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 6 }}>Aus Vorlage</label>
                  <select
                    style={selectStyle}
                    defaultValue=""
                    onChange={e => {
                      const v = vorlagen.find(v => v.id === e.target.value)
                      if (v) setAddForm(prev => ({
                        ...prev,
                        titel: v.titel,
                        kategorie: v.kategorie,
                        intervall: v.intervall,
                        beschreibung: v.beschreibung ?? "",
                        kosten_geschaetzt: v.kosten_geschaetzt != null ? String(v.kosten_geschaetzt) : "",
                      }))
                    }}
                  >
                    <option value="">— Vorlage wählen —</option>
                    {vorlagen.map(v => <option key={v.id} value={v.id}>{v.titel}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Titel *</label>
                  <input style={inputStyle} value={addForm.titel} onChange={e => setAddForm(p => ({ ...p, titel: e.target.value }))} placeholder="z.B. Heizungswartung" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Kategorie</label>
                    <select style={selectStyle} value={addForm.kategorie} onChange={e => setAddForm(p => ({ ...p, kategorie: e.target.value }))}>
                      {ALLE_KATEGORIEN.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Objekt *</label>
                    <select style={selectStyle} value={addForm.property_id} onChange={e => setAddForm(p => ({ ...p, property_id: e.target.value }))}>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Fällig am *</label>
                    <input type="date" style={inputStyle} value={addForm.faellig_am} onChange={e => setAddForm(p => ({ ...p, faellig_am: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Intervall</label>
                    <select style={selectStyle} value={addForm.intervall} onChange={e => setAddForm(p => ({ ...p, intervall: e.target.value }))}>
                      {Object.entries(INTERVALL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Priorität</label>
                    <select style={selectStyle} value={addForm.prioritaet} onChange={e => setAddForm(p => ({ ...p, prioritaet: e.target.value }))}>
                      <option value="niedrig">Niedrig</option>
                      <option value="mittel">Mittel</option>
                      <option value="hoch">Hoch</option>
                      <option value="dringend">Dringend</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>
                      <CurrencyEur size={10} style={{ marginRight: 3 }} />
                      Geplante Kosten (€)
                    </label>
                    <input type="number" style={inputStyle} value={addForm.kosten_geschaetzt} onChange={e => setAddForm(p => ({ ...p, kosten_geschaetzt: e.target.value }))} placeholder="0" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>
                    <User size={10} style={{ marginRight: 3 }} />
                    Handwerker
                  </label>
                  <input style={inputStyle} value={addForm.handwerker} onChange={e => setAddForm(p => ({ ...p, handwerker: e.target.value }))} placeholder="Name oder Firma" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Beschreibung</label>
                  <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={addForm.beschreibung} onChange={e => setAddForm(p => ({ ...p, beschreibung: e.target.value }))} placeholder="Details zur Aufgabe…" />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => setShowAdd(false)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #E5E3DC", background: "white", color: "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAdd}
                  disabled={addSaving || !addForm.titel.trim() || !addForm.faellig_am || !addForm.property_id}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                    background: "#A07830", color: "white", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", opacity: (addSaving || !addForm.titel.trim() || !addForm.faellig_am || !addForm.property_id) ? 0.5 : 1,
                  }}
                >
                  {addSaving ? "Speichert…" : "Speichern"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
