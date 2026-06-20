"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import {
  Warning,
  MagnifyingGlass,
  CheckCircle,
  Crosshair,
  Check,
  X,
  Copy,
  Printer,
} from "@phosphor-icons/react"
import type { Mahnung } from "@/types"
import { type MahnungPreview, generateMahnungText } from "@/lib/mahnwesen"

interface MahnwesenViewProps {
  mahnungen: Mahnung[]
  vermieterName: string
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

// ── Mahnstufe badge
function MahnstufeLabel({ stufe }: { stufe: 1 | 2 | 3 }) {
  if (stufe === 1) return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(217,119,6,0.1)", color: "#D97706", border: "1px solid rgba(217,119,6,0.2)" }}>
      1. Mahnung
    </span>
  )
  if (stufe === 2) return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(185,28,28,0.1)", color: "#B91C1C", border: "1px solid rgba(185,28,28,0.2)" }}>
      2. Mahnung
    </span>
  )
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(185,28,28,0.15)", color: "#B91C1C", border: "1px solid rgba(185,28,28,0.3)" }}>
      ⚠ 3. Mahnung — Letzte
    </span>
  )
}

// ── Status badge
function StatusBadge({ status }: { status: Mahnung["status"] }) {
  const map: Record<Mahnung["status"], { bg: string; color: string; label: string }> = {
    offen: { bg: "rgba(160,120,48,0.1)", color: "#A07830", label: "Offen" },
    bezahlt: { bg: "rgba(45,106,45,0.1)", color: "#2D6A2D", label: "Bezahlt" },
    storniert: { bg: "rgba(0,0,0,0.06)", color: "#6B7280", label: "Storniert" },
    in_bearbeitung: { bg: "rgba(59,130,246,0.1)", color: "#1D4ED8", label: "In Bearbeitung" },
  }
  const cfg = map[status]
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

export default function MahnwesenView({ mahnungen, vermieterName }: MahnwesenViewProps) {
  const router = useRouter()
  const prefersReduced = useReducedMotion()

  const [tab, setTab] = useState<"scanner" | "verlauf">("scanner")
  const [scanning, setScanning] = useState(false)
  const [previews, setPreviews] = useState<MahnungPreview[]>([])
  const [scanned, setScanned] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [versandMethode, setVersandMethode] = useState<"email" | "post" | "beides">("email")
  const [showMahntext, setShowMahntext] = useState<MahnungPreview | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterStufe, setFilterStufe] = useState("all")
  const [sperreModal, setSperreModal] = useState<{ payment_id: string; tenantName: string } | null>(null)
  const [sperreGrund, setSperreGrund] = useState("")
  const [settingSperr, setSettingSperr] = useState(false)
  const [localMahnungen, setLocalMahnungen] = useState<Mahnung[]>(mahnungen)

  // Stats
  const offeneCount = localMahnungen.filter(m => m.status === "offen").length
  const gesamtOffen = localMahnungen.filter(m => m.status === "offen").reduce((s, m) => s + m.gesamtbetrag, 0)
  const mahnstufe3Count = localMahnungen.filter(m => m.mahnstufe === 3 && m.status === "offen").length

  const runScan = useCallback(async () => {
    setScanning(true)
    try {
      const res = await fetch("/api/mahnwesen/scan")
      const data = await res.json()
      setPreviews(data.previews ?? [])
      setScanned(true)
      setSelected([])
    } finally {
      setScanning(false)
    }
  }, [])

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    const selectablePreviews = previews.filter(p => !p.mahnsperre)
    setSelected(selectablePreviews.map(p => p.rent_payment_id))
  }

  const createMahnungen = async () => {
    if (selected.length === 0) return
    setCreating(true)
    try {
      const res = await fetch("/api/mahnwesen/erstellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIds: selected, versand_methode: versandMethode }),
      })
      const data = await res.json()
      if (data.count > 0) {
        setTab("verlauf")
        setSelected([])
        setPreviews([])
        setScanned(false)
        router.refresh()
      }
    } finally {
      setCreating(false)
    }
  }

  const setSperre = async () => {
    if (!sperreModal || !sperreGrund.trim()) return
    setSettingSperr(true)
    await fetch("/api/mahnwesen/sperre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: sperreModal.payment_id, aktiv: true, grund: sperreGrund }),
    })
    setPreviews(prev => prev.map(p =>
      p.rent_payment_id === sperreModal.payment_id ? { ...p, mahnsperre: true } : p
    ))
    setSelected(prev => prev.filter(id => id !== sperreModal.payment_id))
    setSperreModal(null)
    setSperreGrund("")
    setSettingSperr(false)
  }

  const markBezahlt = async (id: string) => {
    await fetch(`/api/mahnwesen/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "bezahlt" }),
    })
    setLocalMahnungen(prev => prev.map(m => m.id === id ? { ...m, status: "bezahlt" as const } : m))
  }

  const stornieren = async (id: string) => {
    await fetch(`/api/mahnwesen/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "storniert" }),
    })
    setLocalMahnungen(prev => prev.map(m => m.id === id ? { ...m, status: "storniert" as const } : m))
  }

  const filteredMahnungen = localMahnungen.filter(m => {
    if (filterStatus !== "all" && m.status !== filterStatus) return false
    if (filterStufe !== "all" && m.mahnstufe !== Number(filterStufe)) return false
    return true
  })

  const copyMahntext = (preview: MahnungPreview) => {
    const text = generateMahnungText(preview, vermieterName)
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="w-full min-h-screen" style={{ background: "#F8F7F4" }}>

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between px-8 pt-7 pb-0 mb-6">
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(185,28,28,0.08)", border: "1px solid rgba(185,28,28,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Warning size={18} color="#B91C1C" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#101418", letterSpacing: "-0.02em" }}>Mahnwesen</h1>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>Automatische Erkennung überfälliger Zahlungen</p>
          </div>
        </div>
        <motion.button
          whileHover={prefersReduced ? {} : { y: -1 }}
          whileTap={prefersReduced ? {} : { scale: 0.97 }}
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2"
          style={{
            fontSize: 13, fontWeight: 600, color: "white",
            background: scanning ? "rgba(160,120,48,0.5)" : "#A07830",
            padding: "10px 18px", borderRadius: 10,
            boxShadow: scanning ? "none" : "0 4px 14px rgba(160,120,48,0.2)",
            cursor: scanning ? "not-allowed" : "pointer",
          }}
        >
          {scanning ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
          ) : (
            <MagnifyingGlass size={14} />
          )}
          {scanning ? "Scanne..." : "Offene Posten scannen"}
        </motion.button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-3 gap-4 px-8 mb-6">
        {/* Gold card */}
        <div style={{ background: "#A07830", borderRadius: 14, padding: "20px 22px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Offene Mahnungen</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>{offeneCount}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>Aktive Mahnungen</p>
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: "20px 22px", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Offener Betrag</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#B91C1C", letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(gesamtOffen)}</p>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>Gesamtforderung offen</p>
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: "20px 22px", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Kritisch (Stufe 3)</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: mahnstufe3Count > 0 ? "#B91C1C" : "#2D6A2D", letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {mahnstufe3Count}
          </p>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>Letzte Mahnung ausgestellt</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 px-8 mb-6" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        {(["scanner", "verlauf"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "#A07830" : "#6B7280",
              padding: "10px 16px",
              borderBottom: tab === t ? "2px solid #A07830" : "2px solid transparent",
              marginBottom: -1,
              transition: "all 0.15s",
            }}
          >
            {t === "scanner" ? "📡 Scanner" : "📋 Verlauf"}
          </button>
        ))}
      </div>

      {/* TAB: SCANNER */}
      {tab === "scanner" && (
        <div>
          {!scanned ? (
            /* Empty / initial state */
            <div className="mx-8">
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: "64px 32px", textAlign: "center" }}>
                <div style={{ width: 72, height: 72, background: "#F0EDE4", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Crosshair size={32} color="#A89A7A" />
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#101418" }}>Offene Posten scannen</p>
                <p style={{ fontSize: 13, color: "#A89A7A", marginTop: 8, maxWidth: 360, margin: "8px auto 24px" }}>
                  Imvestra durchsucht alle Mietkonten nach überfälligen Zahlungen und erstellt Mahnungsvorschläge.
                </p>
                <button
                  onClick={runScan}
                  disabled={scanning}
                  className="flex items-center gap-2 mx-auto"
                  style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "10px 20px", borderRadius: 10, boxShadow: "0 4px 14px rgba(160,120,48,0.2)" }}
                >
                  <MagnifyingGlass size={14} />
                  Scan starten
                </button>
              </div>
            </div>
          ) : previews.length === 0 ? (
            /* No overdue */
            <div className="mx-8">
              <div style={{ background: "white", border: "1px solid rgba(45,106,45,0.12)", borderRadius: 14, padding: "48px 32px", textAlign: "center" }}>
                <CheckCircle size={40} color="#2D6A2D" style={{ margin: "0 auto 16px" }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: "#2D6A2D" }}>Keine überfälligen Zahlungen!</p>
                <p style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>Alle Mieter haben pünktlich gezahlt.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Action bar */}
              <div className="mx-8 mb-4" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: "12px 20px" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#101418" }}>{previews.length} überfällige Zahlung{previews.length !== 1 ? "en" : ""} gefunden</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Wähle aus welche gemahnt werden sollen</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={versandMethode}
                      onChange={e => setVersandMethode(e.target.value as typeof versandMethode)}
                      style={{ background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "#101418", outline: "none" }}
                    >
                      <option value="email">Per E-Mail</option>
                      <option value="post">Per Post</option>
                      <option value="beides">E-Mail + Post</option>
                    </select>
                    <button
                      onClick={selectAll}
                      style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)" }}
                    >
                      Alle auswählen
                    </button>
                    <button
                      onClick={createMahnungen}
                      disabled={selected.length === 0 || creating}
                      className="flex items-center gap-1.5"
                      style={{
                        fontSize: 13, fontWeight: 600,
                        color: selected.length === 0 ? "#9CA3AF" : "white",
                        background: selected.length === 0 ? "rgba(0,0,0,0.06)" : "#A07830",
                        padding: "8px 16px", borderRadius: 9,
                        cursor: selected.length === 0 ? "not-allowed" : "pointer",
                        boxShadow: selected.length === 0 ? "none" : "0 4px 12px rgba(160,120,48,0.2)",
                      }}
                    >
                      {creating ? (
                        <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                      ) : null}
                      Mahnungen erstellen ({selected.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview list */}
              <div className="mx-8 flex flex-col gap-3">
                {previews.map(preview => {
                  const isSelected = selected.includes(preview.rent_payment_id)
                  const isSperrt = preview.mahnsperre
                  return (
                    <motion.div
                      key={preview.rent_payment_id}
                      initial={prefersReduced ? {} : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: "white",
                        border: `1px solid ${isSelected ? "#A07830" : isSperrt ? "rgba(217,119,6,0.2)" : "rgba(0,0,0,0.07)"}`,
                        borderRadius: 14,
                        padding: 20,
                        opacity: isSperrt ? 0.6 : 1,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => !isSperrt && toggleSelect(preview.rent_payment_id)}
                          disabled={isSperrt}
                          style={{
                            width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 2,
                            border: `2px solid ${isSelected ? "#A07830" : "rgba(0,0,0,0.15)"}`,
                            background: isSelected ? "#A07830" : "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: isSperrt ? "not-allowed" : "pointer",
                          }}
                        >
                          {isSelected && <Check size={11} color="white" weight="bold" />}
                        </button>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>{preview.tenantName}</span>
                            <MahnstufeLabel stufe={preview.mahnstufe} />
                            {!isSperrt && (
                              <button
                                onClick={() => setSperreModal({ payment_id: preview.rent_payment_id, tenantName: preview.tenantName })}
                                style={{ fontSize: 10, color: "#9CA3AF", textDecoration: "underline", cursor: "pointer" }}
                              >
                                Sperre setzen
                              </button>
                            )}
                            {isSperrt && (
                              <span style={{ fontSize: 10, fontWeight: 600, color: "#D97706" }}>⛔ Mahnsperre aktiv</span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>
                            {preview.propertyName} · Fällig {formatDate(preview.faellig_seit)}
                          </p>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: "rgba(185,28,28,0.06)", color: "#B91C1C" }}>
                            {preview.tage_ueberfaellig} Tage überfällig
                          </span>
                        </div>

                        {/* Amounts */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Offener Betrag</p>
                          <p style={{ fontSize: 22, fontWeight: 700, color: "#B91C1C", fontVariantNumeric: "tabular-nums" }}>
                            {formatCurrency(preview.betrag_offen)}
                          </p>
                          {preview.mahngebuehr > 0 && (
                            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>+ {preview.mahngebuehr.toFixed(2)}€ Mahngebühr</p>
                          )}
                          {preview.verzugszinsen > 0 && (
                            <p style={{ fontSize: 11, color: "#9CA3AF" }}>+ {preview.verzugszinsen.toFixed(2)}€ Verzugszinsen</p>
                          )}
                          {(preview.mahngebuehr > 0 || preview.verzugszinsen > 0) && (
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#101418", marginTop: 4, paddingTop: 4, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                              Gesamt: {formatCurrency(preview.gesamtbetrag)}
                            </p>
                          )}
                          <button
                            onClick={() => setShowMahntext(preview)}
                            style={{ fontSize: 11, color: "#A07830", marginTop: 6, textDecoration: "underline", cursor: "pointer" }}
                          >
                            Mahntext ansehen
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: VERLAUF */}
      {tab === "verlauf" && (
        <div>
          {/* Filters */}
          <div className="flex items-center gap-3 px-8 mb-4">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#101418", outline: "none" }}
            >
              <option value="all">Alle Status</option>
              <option value="offen">Offen</option>
              <option value="bezahlt">Bezahlt</option>
              <option value="storniert">Storniert</option>
            </select>
            <select
              value={filterStufe}
              onChange={e => setFilterStufe(e.target.value)}
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#101418", outline: "none" }}
            >
              <option value="all">Alle Stufen</option>
              <option value="1">Stufe 1</option>
              <option value="2">Stufe 2</option>
              <option value="3">Stufe 3</option>
            </select>
            <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto" }}>
              {filteredMahnungen.length} Einträge
            </span>
          </div>

          {filteredMahnungen.length === 0 ? (
            <div className="mx-8">
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: "48px 32px", textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>Keine Mahnungen</p>
                <p style={{ fontSize: 13, color: "#A89A7A", marginTop: 6 }}>Noch keine Mahnungen erstellt oder keine passenden Ergebnisse.</p>
              </div>
            </div>
          ) : (
            <div className="mx-8" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, overflow: "hidden" }}>
              {/* Header */}
              <div className="grid px-5 py-3" style={{ gridTemplateColumns: "2fr 1fr 80px 130px 100px 110px 100px", background: "#F8F7F4", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                {["MIETER", "OBJEKT", "STUFE", "BETRAG", "DATUM", "STATUS", ""].map(h => (
                  <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>
              {filteredMahnungen.map((m, i) => (
                <div
                  key={m.id}
                  className="grid px-5 items-center"
                  style={{
                    gridTemplateColumns: "2fr 1fr 80px 130px 100px 110px 100px",
                    paddingTop: 13, paddingBottom: 13,
                    borderBottom: i < filteredMahnungen.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#101418" }}>{m.tenants?.name ?? "—"}</span>
                  <span style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.properties?.name ?? "—"}</span>
                  <MahnstufeLabel stufe={m.mahnstufe} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#B91C1C", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(m.gesamtbetrag)}</span>
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>{formatDate(m.mahndatum)}</span>
                  <StatusBadge status={m.status} />
                  <div className="flex items-center gap-1 justify-end">
                    {m.status === "offen" && (
                      <>
                        <button
                          onClick={() => markBezahlt(m.id)}
                          style={{ fontSize: 11, fontWeight: 500, color: "#2D6A2D", padding: "4px 8px", borderRadius: 6, background: "rgba(45,106,45,0.08)", border: "1px solid rgba(45,106,45,0.15)" }}
                        >
                          Bezahlt
                        </button>
                        <button
                          onClick={() => stornieren(m.id)}
                          style={{ fontSize: 11, fontWeight: 500, color: "#6B7280", padding: "4px 8px", borderRadius: 6, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                        >
                          Storno
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ height: 48 }} />

      {/* MAHNTEXT MODAL */}
      <AnimatePresence>
        {showMahntext && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && setShowMahntext(null)}
          >
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full mx-4"
              style={{ maxWidth: 640, background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.14)" }}
            >
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>Mahnungstext — {showMahntext.mahnstufe}. Mahnung</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{showMahntext.tenantName} · {showMahntext.propertyName}</p>
                </div>
                <button onClick={() => setShowMahntext(null)} style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }} className="hover:bg-gray-100 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5">
                <pre style={{ background: "#F8F7F4", borderRadius: 10, padding: "20px", fontFamily: "monospace", fontSize: 12, color: "#101418", lineHeight: 1.7, minHeight: 300, whiteSpace: "pre-wrap", overflowY: "auto", maxHeight: "50vh" }}>
                  {generateMahnungText(showMahntext, vermieterName)}
                </pre>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                <button onClick={() => setShowMahntext(null)} style={{ fontSize: 13, fontWeight: 500, color: "#6B7280", padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.1)" }}>
                  Schließen
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5"
                  style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.1)" }}
                >
                  <Printer size={14} />
                  Als PDF
                </button>
                <button
                  onClick={() => copyMahntext(showMahntext)}
                  className="flex items-center gap-1.5"
                  style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "8px 16px", borderRadius: 9, boxShadow: "0 4px 12px rgba(160,120,48,0.2)" }}
                >
                  <Copy size={14} />
                  Kopieren
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAHNSPERRE MODAL */}
      <AnimatePresence>
        {sperreModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && setSperreModal(null)}
          >
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full mx-4"
              style={{ maxWidth: 400, background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.14)" }}
            >
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>Mahnsperre setzen</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>Für {sperreModal.tenantName}</p>
                </div>
                <button onClick={() => setSperreModal(null)} style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }} className="hover:bg-gray-100 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                <div style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)", borderRadius: 10, padding: 16 }}>
                  <p style={{ fontSize: 12, color: "#92400E" }}>
                    Eine Mahnsperre verhindert, dass für diese Zahlung Mahnungen erstellt werden.
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 5 }}>Begründung *</label>
                  <input
                    value={sperreGrund}
                    onChange={e => setSperreGrund(e.target.value)}
                    placeholder="z.B. Ratenzahlung vereinbart, Streitfall..."
                    style={{ width: "100%", background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 9, padding: "9px 14px", fontSize: 13, color: "#101418", outline: "none" }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                <button onClick={() => setSperreModal(null)} style={{ fontSize: 13, fontWeight: 500, color: "#6B7280", padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.1)" }}>
                  Abbrechen
                </button>
                <button
                  onClick={setSperre}
                  disabled={!sperreGrund.trim() || settingSperr}
                  style={{
                    fontSize: 13, fontWeight: 600,
                    color: !sperreGrund.trim() ? "#9CA3AF" : "white",
                    background: !sperreGrund.trim() ? "rgba(0,0,0,0.06)" : "#92400E",
                    padding: "8px 16px", borderRadius: 9,
                    cursor: !sperreGrund.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  Sperre setzen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
