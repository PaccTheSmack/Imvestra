"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useReducedMotion,
  animate,
} from "motion/react";
import {
  MapPin,
  CheckCircle,
  Warning,
  Info,
} from "@phosphor-icons/react";
import { getStadtData } from "@/lib/standort-data";
import { calculateStandortScore } from "@/lib/standort-scoring";
import type { StadtDaten } from "@/lib/standort-data";
import type { StandortScore } from "@/lib/standort-scoring";

function formatPercent(v: number, decimals = 1) {
  return `${(v * 100).toFixed(decimals)} %`
}

function AnimatedScore({ value, prefersReduced }: { value: number; prefersReduced: boolean | null }) {
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (prefersReduced) { mv.set(value); setDisplay(value); return }
    const ctrl = animate(mv, value, { duration: 0.8, ease: "easeOut" })
    const unsub = mv.on("change", (v) => setDisplay(Math.round(v)))
    return () => { ctrl.stop(); unsub() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, prefersReduced])

  const color = value >= 70 ? "#00E0D7" : value >= 55 ? "#FFB800" : "#FF4444"
  return (
    <span style={{ color, fontSize: 64, fontWeight: 600, letterSpacing: "-0.05em", lineHeight: 1 }}>
      {display}
    </span>
  )
}

const POPULAR_PLZ = [
  { plz: "10115", label: "10115 Berlin" },
  { plz: "80331", label: "80331 München" },
  { plz: "04103", label: "04103 Leipzig" },
  { plz: "20095", label: "20095 Hamburg" },
  { plz: "50667", label: "50667 Köln" },
  { plz: "38640", label: "38640 Goslar" },
]

function StandortContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefersReduced = useReducedMotion()

  const [plz, setPlz] = useState(searchParams.get("plz") ?? "")
  const [stadtDaten, setStadtDaten] = useState<StadtDaten | null>(null)
  const [plzInfo, setPlzInfo] = useState<{ city: string; state: string; region: string } | null>(null)
  const [score, setScore] = useState<StandortScore | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const kaufpreisParam = Number(searchParams.get("kaufpreis")) || undefined
  const mieteParam     = Number(searchParams.get("miete"))     || undefined
  const sqmParam       = Number(searchParams.get("sqm"))       || undefined

  const runSearch = useCallback((value: string) => {
    if (value.length !== 5) { setStadtDaten(null); setPlzInfo(null); setScore(null); setNotFound(false); return }
    const result = getStadtData(value)
    if (!result.stadtDaten) { setNotFound(true); setStadtDaten(null); setPlzInfo(null); setScore(null); return }
    setNotFound(false)
    setStadtDaten(result.stadtDaten)
    setPlzInfo(result.plzInfo)
    setIsFallback(result.isFallback)
    setScore(calculateStandortScore(result.stadtDaten, kaufpreisParam, mieteParam, sqmParam))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kaufpreisParam, mieteParam, sqmParam])

  useEffect(() => { runSearch(plz) }, [plz, runSearch])

  function handlePlzChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 5)
    setPlz(digits)
  }

  const hasObjectData = kaufpreisParam && mieteParam && sqmParam

  return (
    <div className="p-6 max-w-[1100px] mx-auto" style={{ background: "#080808", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(0,224,215,0.08)", border: "1px solid rgba(0,224,215,0.12)" }}
        >
          <MapPin size={18} color="#00E0D7" />
        </div>
        <div>
          <h1 className="text-[20px] font-semibold text-white tracking-[-0.02em]">Standortanalyse</h1>
          <p className="text-sm mt-0.5" style={{ color: "#777" }}>Marktdaten und Investoren-Score per PLZ</p>
        </div>
      </div>

      {/* PLZ Search */}
      <div className="mb-8" style={{ maxWidth: 400 }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#777" }}>
          Postleitzahl eingeben
        </p>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="z.B. 38640"
            value={plz}
            onChange={(e) => handlePlzChange(e.target.value)}
            className="w-full rounded-[10px] px-4 py-3 text-lg tracking-widest focus:outline-none transition-all duration-150"
            style={{
              background: "#141414",
              border: stadtDaten ? "1px solid rgba(0,224,215,0.3)" : notFound ? "1px solid rgba(255,68,68,0.3)" : "1px solid rgba(255,255,255,0.07)",
              color: "#fff",
            }}
          />
          {stadtDaten && plzInfo && (
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium"
              style={{ color: "#00E0D7" }}
            >
              {plzInfo.city}
            </span>
          )}
        </div>
        {notFound && (
          <p className="text-xs mt-2" style={{ color: "#FF4444" }}>
            PLZ nicht gefunden. Bitte prüfen.
          </p>
        )}
        {isFallback && plzInfo && (
          <p className="text-xs mt-2" style={{ color: "#FFB800" }}>
            Keine detaillierten Daten für diese PLZ. Zeige {plzInfo.state}-Durchschnitt.
          </p>
        )}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {stadtDaten && score && plzInfo ? (
          <motion.div
            key={plz}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 gap-6"
            style={{ gridTemplateColumns: "1fr" }}
          >
            <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 320px" }}>
              {/* LEFT COLUMN */}
              <div className="flex flex-col gap-4">
                {/* Market Data Card */}
                <div className="rounded-[14px] overflow-hidden" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {/* Card header */}
                  <div
                    className="px-5 py-4 flex items-center justify-between"
                    style={{ background: "#0C0C0C", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div>
                      <p className="text-base font-semibold text-white">{stadtDaten.city}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#666" }}>
                        {stadtDaten.state} · {
                          plzInfo.region === "grossstadt" ? "Großstadt" :
                          plzInfo.region === "mittelstadt" ? "Mittelstadt" :
                          plzInfo.region === "kleinstadt" ? "Kleinstadt" : "Ländlich"
                        }
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      style={
                        stadtDaten.bevoelkerungstrend === "wachsend"    ? { background: "rgba(0,224,215,0.1)", color: "#00E0D7" } :
                        stadtDaten.bevoelkerungstrend === "schrumpfend" ? { background: "rgba(255,68,68,0.1)", color: "#FF4444" } :
                                                                          { background: "#1A1A1A", color: "#666" }
                      }
                    >
                      {stadtDaten.bevoelkerungstrend === "wachsend" ? "↑ Wachsend" :
                       stadtDaten.bevoelkerungstrend === "schrumpfend" ? "↓ Schrumpfend" : "→ Stabil"}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="px-5 py-4 grid grid-cols-2 gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                    {[
                      { label: "Ø KAUFPREIS ETW", value: `${stadtDaten.kaufpreis_etw_qm.toLocaleString("de-DE")} €/m²` },
                      { label: "Ø KALTMIETE",     value: `${stadtDaten.miete_qm.toFixed(2)} €/m²` },
                      { label: "KAUFPREISFAKTOR",  value: `${stadtDaten.kaufpreisfaktor}x` },
                      {
                        label: "Ø MARKTRENDITE",
                        value: formatPercent(stadtDaten.mietrendite_markt),
                        color: stadtDaten.mietrendite_markt >= 0.05 ? "#00E0D7" :
                               stadtDaten.mietrendite_markt >= 0.035 ? "#FFB800" : "#FF4444",
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: "#666" }}>{label}</p>
                        <p className="text-lg font-semibold mt-1.5" style={{ color: color ?? "#fff" }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Object Comparison */}
                {hasObjectData && (
                  <div className="rounded-[14px] p-5" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#777" }}>
                      Dein Objekt im Vergleich
                    </p>
                    {[
                      {
                        label: "Kaufpreis/m²",
                        markt: stadtDaten.kaufpreis_etw_qm,
                        objekt: kaufpreisParam / sqmParam!,
                        format: (v: number) => `${Math.round(v).toLocaleString("de-DE")} €`,
                      },
                      {
                        label: "Miete/m²",
                        markt: stadtDaten.miete_qm,
                        objekt: mieteParam / sqmParam!,
                        format: (v: number) => `${v.toFixed(2)} €`,
                      },
                    ].map(({ label, markt, objekt, format }) => {
                      const higher = objekt > markt
                      const maxVal = Math.max(markt, objekt)
                      const marktPct = (markt / maxVal) * 100
                      const objektPct = (objekt / maxVal) * 100
                      return (
                        <div key={label} className="flex items-center gap-4 mb-4 last:mb-0">
                          <p className="text-xs w-28 flex-shrink-0" style={{ color: "#777" }}>{label}</p>
                          <div className="flex-1 relative h-1.5 rounded-full overflow-hidden" style={{ background: "#1A1A1A" }}>
                            <div className="absolute h-full rounded-full" style={{ width: `${marktPct}%`, background: "rgba(255,255,255,0.15)" }} />
                            <motion.div
                              className="absolute h-full rounded-full"
                              style={{ background: higher ? "#00E0D7" : "#FF4444" }}
                              initial={{ width: 0 }}
                              animate={{ width: `${objektPct}%` }}
                              transition={{ duration: prefersReduced ? 0 : 0.6, ease: "easeOut" }}
                            />
                          </div>
                          <p className="text-xs text-right w-40 flex-shrink-0" style={{ color: "#777" }}>
                            Markt: {format(markt)} · Objekt: <span style={{ color: "#fff" }}>{format(objekt)}</span>
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Analyse text */}
                <div className="rounded-[14px] px-5 py-4 flex items-start gap-3" style={{ background: "#0C0C0C", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Info size={15} color="#00E0D7" className="mt-0.5 flex-shrink-0" />
                  <p className="text-sm leading-relaxed" style={{ color: "#888" }}>{score.analyse_text}</p>
                </div>

                {/* Strengths + Risks */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[12px] p-4" style={{ background: "rgba(0,224,215,0.04)", border: "1px solid rgba(0,224,215,0.1)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#00E0D7" }}>
                      Stärken
                    </p>
                    {score.staerken.length > 0 ? score.staerken.map((s) => (
                      <div key={s} className="flex items-center gap-2 py-1">
                        <CheckCircle size={12} color="#00E0D7" weight="fill" />
                        <span className="text-xs text-white">{s}</span>
                      </div>
                    )) : (
                      <p className="text-xs" style={{ color: "#666" }}>Keine besonderen Stärken</p>
                    )}
                  </div>
                  <div className="rounded-[12px] p-4" style={{ background: "rgba(255,68,68,0.04)", border: "1px solid rgba(255,68,68,0.1)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#FF4444" }}>
                      Risiken
                    </p>
                    {score.risiken.length > 0 ? score.risiken.map((r) => (
                      <div key={r} className="flex items-center gap-2 py-1">
                        <Warning size={12} color="#FF4444" weight="fill" />
                        <span className="text-xs text-white">{r}</span>
                      </div>
                    )) : (
                      <p className="text-xs" style={{ color: "#666" }}>Keine wesentlichen Risiken</p>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-4" style={{ position: "sticky", top: 32, alignSelf: "start" }}>
                {/* Score Card */}
                <div className="rounded-[14px] p-5" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#777" }}>
                    Investoren-Score
                  </p>

                  {/* Score display */}
                  <div className="text-center mb-5">
                    <div className="flex items-end justify-center gap-1">
                      <AnimatedScore value={score.gesamt} prefersReduced={prefersReduced} />
                      <span className="text-xl mb-2" style={{ color: "#555" }}>/100</span>
                    </div>
                  </div>

                  {/* Empfehlung */}
                  <div className="text-center mb-5">
                    <span
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                      style={
                        score.empfehlung === "kaufen"   ? { background: "rgba(0,224,215,0.1)",   color: "#00E0D7", borderColor: "rgba(0,224,215,0.2)" } :
                        score.empfehlung === "prüfen"   ? { background: "rgba(255,184,0,0.1)",   color: "#FFB800", borderColor: "rgba(255,184,0,0.2)" } :
                        score.empfehlung === "abwarten" ? { background: "#1A1A1A",               color: "#666",    borderColor: "rgba(255,255,255,0.1)" } :
                                                          { background: "rgba(255,68,68,0.1)",   color: "#FF4444", borderColor: "rgba(255,68,68,0.2)" }
                      }
                    >
                      {score.empfehlung_text}
                    </span>
                  </div>

                  {/* Sub-scores */}
                  <div className="flex flex-col gap-3">
                    {[
                      { label: "Rendite",    val: score.rendite },
                      { label: "Nachfrage",  val: score.nachfrage },
                      { label: "Sicherheit", val: score.sicherheit },
                      { label: "Wachstum",   val: score.wachstum },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "#777" }}>{label}</span>
                          <span style={{ color: "#fff" }}>{val}/25</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1A1A1A" }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: "#00E0D7" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(val / 25) * 100}%` }}
                            transition={{ duration: prefersReduced ? 0 : 0.7, ease: "easeOut", delay: 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-[14px] p-4" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#777" }}>
                    Aktionen
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => router.push(`/calculator?plz=${plz}&city=${encodeURIComponent(stadtDaten.city)}`)}
                      className="w-full py-2.5 rounded-[8px] text-sm font-medium transition-all duration-150"
                      style={{ background: "#00E0D7", color: "#080808" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#00c8c0")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#00E0D7")}
                    >
                      Im Rechner analysieren
                    </button>
                    <button
                      onClick={() => router.push(`/verhandlung?plz=${plz}&miete_qm=${stadtDaten.miete_qm}`)}
                      className="w-full py-2.5 rounded-[8px] text-sm font-medium transition-all duration-150"
                      style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)", color: "#888" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,224,215,0.2)"; e.currentTarget.style.color = "#fff" }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#888" }}
                    >
                      Verhandlungsrechner
                    </button>
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] leading-relaxed px-1" style={{ color: "#555" }}>
                  Daten basieren auf öffentlichen Marktberichten (Stand 2026). Keine Gewähr für Richtigkeit. Eigene Recherche empfohlen.
                </p>
              </div>
            </div>
          </motion.div>
        ) : !stadtDaten && !notFound ? (
          /* Empty state */
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-12 text-center"
          >
            <motion.div
              className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto"
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
              animate={prefersReduced ? {} : { y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <MapPin size={28} color="#555" />
            </motion.div>
            <p className="text-base font-semibold text-white mt-6">PLZ eingeben um Marktdaten zu laden</p>
            <p className="text-sm mt-2" style={{ color: "#777" }}>Standortdaten, Investoren-Score und Marktvergleich.</p>

            {/* Popular PLZs */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {POPULAR_PLZ.map(({ plz: p, label }) => (
                <button
                  key={p}
                  onClick={() => setPlz(p)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all duration-150"
                  style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", color: "#777" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,224,215,0.2)"; e.currentTarget.style.color = "#00E0D7" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#777" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default function StandortPage() {
  return (
    <Suspense>
      <StandortContent />
    </Suspense>
  )
}
