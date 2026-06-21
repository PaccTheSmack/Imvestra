"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ChatCircle,
  X,
  CheckCircle,
  Clock,
  Wrench,
  Question,
  Warning,
  SmileyMeh,
} from "@phosphor-icons/react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Anfrage {
  id: string
  kategorie: string
  titel: string
  beschreibung: string
  status: "offen" | "in_bearbeitung" | "erledigt"
  antwort: string | null
  answered_at: string | null
  created_at: string
  mieter_accounts: { mieter_name: string } | null
  tenants: { name: string } | null
  properties: { name: string } | null
}

interface AnfragenViewProps {
  anfragen: Anfrage[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

type FilterTab = "alle" | "offen" | "in_bearbeitung" | "erledigt"

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  offen:          { bg: "rgba(146,64,14,0.1)",  text: "#92400E", label: "Offen" },
  in_bearbeitung: { bg: "rgba(14,82,146,0.1)",  text: "#0E52A2", label: "In Bearbeitung" },
  erledigt:       { bg: "rgba(45,106,45,0.1)",  text: "#2D6A2D", label: "Erledigt" },
}

const KATEGORIE_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  reparatur:  { bg: "rgba(194,120,0,0.1)",  text: "#C27800", label: "Reparatur",  icon: <Wrench size={11} /> },
  frage:      { bg: "rgba(14,82,146,0.1)",  text: "#0E52A2", label: "Frage",      icon: <Question size={11} /> },
  beschwerde: { bg: "rgba(185,28,28,0.1)",  text: "#B91C1C", label: "Beschwerde", icon: <Warning size={11} /> },
  sonstige:   { bg: "rgba(107,114,128,0.1)", text: "#6B7280", label: "Sonstige",  icon: <SmileyMeh size={11} /> },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function AnfragenView({ anfragen: initialAnfragen }: AnfragenViewProps) {
  const prefersReduced = useReducedMotion()
  const [anfragen, setAnfragen] = useState<Anfrage[]>(initialAnfragen)
  const [activeTab, setActiveTab] = useState<FilterTab>("alle")
  const [selectedAnfrage, setSelectedAnfrage] = useState<Anfrage | null>(null)
  const [antwortText, setAntwortText] = useState("")
  const [newStatus, setNewStatus] = useState<Anfrage["status"]>("offen")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const openCount = anfragen.filter(a => a.status === "offen").length

  const filtered = anfragen.filter(a => {
    if (activeTab === "alle") return true
    return a.status === activeTab
  })

  function openDetail(a: Anfrage) {
    setSelectedAnfrage(a)
    setAntwortText(a.antwort ?? "")
    setNewStatus(a.status)
  }

  async function sendAntwort() {
    if (!selectedAnfrage) return
    setSaving(true)
    const res = await fetch(`/api/anfragen/${selectedAnfrage.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, antwort: antwortText }),
    })
    setSaving(false)
    if (res.ok) {
      const updated = { ...selectedAnfrage, status: newStatus, antwort: antwortText, answered_at: new Date().toISOString() }
      setAnfragen(prev => prev.map(a => a.id === selectedAnfrage.id ? updated : a))
      setSelectedAnfrage(updated)
      setToast("Antwort gespeichert")
    } else {
      setToast("Fehler beim Speichern")
    }
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "alle", label: "Alle" },
    { key: "offen", label: "Offen" },
    { key: "in_bearbeitung", label: "In Bearbeitung" },
    { key: "erledigt", label: "Erledigt" },
  ]

  return (
    <div className="px-8 py-7 w-full" style={{ background: "#F8F7F4", minHeight: "100vh" }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChatCircle size={18} color="#A07830" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#101418", letterSpacing: "-0.02em" }}>
              Mieteranfragen
            </h1>
            {openCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: "#A07830", color: "white", padding: "2px 9px", borderRadius: 99 }}>
                {openCount}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
            {anfragen.length} {anfragen.length === 1 ? "Anfrage" : "Anfragen"} insgesamt
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        {tabs.map(tab => {
          const active = activeTab === tab.key
          const count = tab.key === "alle" ? anfragen.length : anfragen.filter(a => a.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="text-sm font-medium px-1 mr-6 pb-2 transition-colors duration-150 flex items-center gap-1.5"
              style={{
                color: active ? "#A07830" : "#9CA3AF",
                borderBottom: active ? "2px solid #A07830" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {tab.label}
              {count > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, background: active ? "rgba(160,120,48,0.12)" : "#F0EDE4", color: active ? "#A07830" : "#6B7280", padding: "1px 6px", borderRadius: 99 }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 280 }}>
          <div style={{ width: 52, height: 52, background: "#F0EDE4", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <ChatCircle size={22} color="#A89A7A" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>Keine Anfragen</p>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 5 }}>
            {activeTab === "alle" ? "Noch keine Mieteranfragen eingegangen." : "Keine Anfragen mit diesem Status."}
          </p>
        </div>
      )}

      {/* Anfragen list */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((anfrage, i) => {
            const kat = KATEGORIE_STYLES[anfrage.kategorie] ?? KATEGORIE_STYLES.sonstige
            const st = STATUS_STYLES[anfrage.status] ?? STATUS_STYLES.offen
            const mieterName = anfrage.mieter_accounts?.mieter_name ?? anfrage.tenants?.name ?? "Unbekannt"
            return (
              <motion.div
                key={anfrage.id}
                initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReduced ? 0 : i * 0.04 }}
                onClick={() => openDetail(anfrage)}
                className="cursor-pointer"
                whileHover={prefersReduced ? {} : { y: -1 }}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: 14,
                  padding: "16px 20px",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 600, background: kat.bg, color: kat.text, padding: "2px 8px", borderRadius: 99 }}>
                        {kat.icon}
                        {kat.label}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, background: st.bg, color: st.text, padding: "2px 8px", borderRadius: 99 }}>
                        {st.label}
                      </span>
                    </div>
                    {/* Title */}
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#101418", marginBottom: 4 }}>
                      {anfrage.titel}
                    </p>
                    {/* Meta */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span style={{ fontSize: 11, color: "#6B7280" }}>{mieterName}</span>
                      {anfrage.properties?.name && (
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>· {anfrage.properties.name}</span>
                      )}
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>· {fmtDate(anfrage.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ color: "#9CA3AF", flexShrink: 0 }}>
                    {anfrage.status === "erledigt"
                      ? <CheckCircle size={18} color="#2D6A2D" />
                      : anfrage.status === "in_bearbeitung"
                      ? <Clock size={18} color="#0E52A2" />
                      : <Clock size={18} color="#92400E" />
                    }
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {selectedAnfrage && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
              onClick={() => setSelectedAnfrage(null)}
            />
            {/* Drawer */}
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
              style={{
                width: "min(100vw, 480px)",
                background: "#FFFFFF",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
                borderLeft: "1px solid rgba(0,0,0,0.07)",
              }}
            >
              {/* Drawer header */}
              <div className="px-6 py-5 flex items-start justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#101418" }}>
                    {selectedAnfrage.titel}
                  </p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>
                    {selectedAnfrage.mieter_accounts?.mieter_name ?? selectedAnfrage.tenants?.name ?? "Unbekannt"}
                    {selectedAnfrage.properties?.name ? ` · ${selectedAnfrage.properties.name}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAnfrage(null)}
                  style={{ color: "#9CA3AF", marginLeft: 12, flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#101418")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const kat = KATEGORIE_STYLES[selectedAnfrage.kategorie] ?? KATEGORIE_STYLES.sonstige
                    const st = STATUS_STYLES[selectedAnfrage.status] ?? STATUS_STYLES.offen
                    return (
                      <>
                        <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 600, background: kat.bg, color: kat.text, padding: "3px 10px", borderRadius: 99 }}>
                          {kat.icon}
                          {kat.label}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, background: st.bg, color: st.text, padding: "3px 10px", borderRadius: 99 }}>
                          {st.label}
                        </span>
                        <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 4 }}>
                          {fmtDate(selectedAnfrage.created_at)}
                        </span>
                      </>
                    )
                  })()}
                </div>

                {/* Description */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Nachricht
                  </p>
                  <div style={{ background: "#F8F7F4", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                    {selectedAnfrage.beschreibung}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                    Status ändern
                  </label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as Anfrage["status"])}
                    style={{ width: "100%", background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#101418", outline: "none" }}
                  >
                    <option value="offen">Offen</option>
                    <option value="in_bearbeitung">In Bearbeitung</option>
                    <option value="erledigt">Erledigt</option>
                  </select>
                </div>

                {/* Antwort */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                    Antwort
                  </label>
                  <textarea
                    value={antwortText}
                    onChange={e => setAntwortText(e.target.value)}
                    rows={5}
                    placeholder="Ihre Antwort an den Mieter..."
                    style={{
                      width: "100%",
                      background: "white",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#101418",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                      lineHeight: 1.6,
                    }}
                  />
                  {selectedAnfrage.answered_at && (
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>
                      Zuletzt beantwortet: {fmtDate(selectedAnfrage.answered_at)}
                    </p>
                  )}
                </div>
              </div>

              {/* Drawer footer */}
              <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                <button
                  onClick={() => setSelectedAnfrage(null)}
                  style={{ fontSize: 13, fontWeight: 500, color: "#6B7280", padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)" }}
                  className="transition-colors hover:bg-gray-50"
                >
                  Schließen
                </button>
                <button
                  onClick={sendAntwort}
                  disabled={saving}
                  className="flex items-center gap-2 transition-all"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: saving ? "#9CA3AF" : "white",
                    background: saving ? "rgba(0,0,0,0.06)" : "#A07830",
                    padding: "9px 20px",
                    borderRadius: 10,
                    boxShadow: saving ? "none" : "0 4px 14px rgba(160,120,48,0.2)",
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity=".3"/>
                        <path d="M12 2a10 10 0 0 1 10 10"/>
                      </svg>
                      Speichern...
                    </>
                  ) : "Antwort senden"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]"
            style={{
              background: "#101418",
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              padding: "10px 20px",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              whiteSpace: "nowrap",
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
