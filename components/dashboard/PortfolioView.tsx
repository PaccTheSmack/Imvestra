"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import {
  Buildings, Plus, DotsThree, ArrowUpRight,
  ChartLine, ListBullets, Compass, SquaresFour,
} from "@phosphor-icons/react"
import Tooltip from "@/components/ui/Tooltip"
import { formatCurrency, formatPercent, formatCurrencySigned } from "@/lib/format"
import {
  calculatePortfolioSummary,
  calculatePropertyMetrics,
  type PortfolioSummary,
} from "@/lib/portfolio-calculations"
import type { Property, Financing, RentPayment, Expense } from "@/types"

// ─── helpers ────────────────────────────────────────────────────────────────

function formatShort(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " Mio"
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + "K"
  return n.toFixed(0)
}

function colorByValue(v: number, lo: number, hi: number) {
  if (v >= hi) return "#00E0D7"
  if (v >= lo) return "#FFB800"
  return "#FF4444"
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  ETW:     { bg: "rgba(0,224,215,0.1)",   text: "#00E0D7" },
  MFH:     { bg: "rgba(255,184,0,0.1)",   text: "#FFB800" },
  EFH:     { bg: "rgba(168,85,247,0.1)",  text: "#A855F7" },
  DHH:     { bg: "rgba(59,130,246,0.1)",  text: "#3B82F6" },
  Gewerbe: { bg: "rgba(255,255,255,0.06)", text: "#777" },
  Sonstige:{ bg: "rgba(255,255,255,0.06)", text: "#777" },
}

// ─── props ───────────────────────────────────────────────────────────────────

interface PortfolioViewProps {
  properties: Property[]
  financings: Financing[]
  payments: RentPayment[]
  expenses: Expense[]
}

type ViewMode = "overview" | "chart" | "properties" | "analyse"
type ChartMetric = "wert" | "eigenkapital"
type TimeRange = "1J" | "3J" | "5J" | "Alle"

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ summary }: { summary: PortfolioSummary }) {
  const total = summary.total_marktwert
  if (total <= 0) return null
  const segments = [
    { value: summary.total_eingesetztes_eigenkapital, color: "#00E0D7" },
    { value: Math.max(0, summary.total_wertentwicklung_eur), color: "rgba(0,224,215,0.4)" },
    { value: summary.total_getilgtes_kapital, color: "#FFB800" },
    { value: summary.total_restschuld, color: "#2A2A2A" },
  ]
  const r = 54, cx = 64, cy = 64, stroke = 12
  let cumAngle = -90
  const arcs = segments.map(seg => {
    const pct = Math.max(0, seg.value) / total
    const angle = pct * 360
    const start = cumAngle
    cumAngle += angle
    return { ...seg, pct, startAngle: start, sweepAngle: angle }
  })

  function arc(startDeg: number, sweepDeg: number) {
    if (sweepDeg <= 0) return ""
    const clamp = Math.min(sweepDeg, 359.99)
    const start = (startDeg * Math.PI) / 180
    const end = ((startDeg + clamp) * Math.PI) / 180
    const x1 = cx + r * Math.cos(start)
    const y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy + r * Math.sin(end)
    const large = clamp > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      {arcs.map((seg, i) => (
        <path
          key={i}
          d={arc(seg.startAngle, seg.sweepAngle)}
          fill="none"
          stroke={seg.color}
          strokeWidth={stroke}
          strokeLinecap="butt"
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
        {formatShort(total)}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#444" fontSize="9">
        Marktwert
      </text>
    </svg>
  )
}

// ─── SVG Line Chart ──────────────────────────────────────────────────────────

function LineChart({
  data, metric, timeRange,
}: {
  data: { date: string; wert: number; eigenkapital: number }[]
  metric: ChartMetric
  timeRange: TimeRange
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<{ x: number; y: number; idx: number } | null>(null)
  const [dims, setDims] = useState({ w: 600, h: 280 })

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(e => {
      const r = e[0].contentRect
      setDims({ w: r.width, h: 280 })
    })
    ro.observe(el.parentElement!)
    return () => ro.disconnect()
  }, [])

  const now = new Date()
  const cutoff = timeRange === "1J" ? new Date(now.getFullYear() - 1, now.getMonth())
    : timeRange === "3J" ? new Date(now.getFullYear() - 3, now.getMonth())
    : timeRange === "5J" ? new Date(now.getFullYear() - 5, now.getMonth())
    : null

  const filtered = cutoff
    ? data.filter(d => new Date(d.date) >= cutoff)
    : data

  if (filtered.length < 2) return <div className="h-[280px] flex items-center justify-center text-xs text-[#666]">Nicht genug Daten</div>

  const pad = { t: 20, r: 60, b: 40, l: 20 }
  const W = dims.w, H = dims.h
  const chartW = W - pad.l - pad.r
  const chartH = H - pad.t - pad.b

  const vals1 = filtered.map(d => d[metric === "wert" ? "wert" : "eigenkapital"])
  const vals2 = metric === "wert" ? filtered.map(d => d.eigenkapital) : null
  const allVals = vals2 ? [...vals1, ...vals2] : vals1
  const minV = Math.min(...allVals) * 0.97
  const maxV = Math.max(...allVals) * 1.03

  const xOf = (i: number) => pad.l + (i / (filtered.length - 1)) * chartW
  const yOf = (v: number) => pad.t + chartH - ((v - minV) / (maxV - minV)) * chartH

  function smoothPath(points: [number, number][]) {
    if (points.length < 2) return ""
    let d = `M ${points[0][0]} ${points[0][1]}`
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1]
      const [x1, y1] = points[i]
      const cpx = (x0 + x1) / 2
      d += ` C ${cpx} ${y0} ${cpx} ${y1} ${x1} ${y1}`
    }
    return d
  }

  const pts1 = vals1.map((v, i) => [xOf(i), yOf(v)] as [number, number])
  const pts2 = vals2 ? vals2.map((v, i) => [xOf(i), yOf(v)] as [number, number]) : null

  const line1 = smoothPath(pts1)
  const area1 = line1 + ` L ${pts1[pts1.length - 1][0]} ${pad.t + chartH} L ${pts1[0][0]} ${pad.t + chartH} Z`

  const gridCount = 5
  const gridVals = Array.from({ length: gridCount }, (_, i) =>
    minV + (maxV - minV) * (i / (gridCount - 1))
  )

  const xLabelCount = Math.min(6, filtered.length)
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round((i / (xLabelCount - 1)) * (filtered.length - 1))
    const d = new Date(filtered[idx].date)
    return { x: xOf(idx), label: `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}` }
  })

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left - pad.l
    const ratio = Math.max(0, Math.min(1, mx / chartW))
    const idx = Math.round(ratio * (filtered.length - 1))
    setHover({ x: xOf(idx), y: yOf(vals1[idx]), idx })
  }

  const hd = hover ? filtered[hover.idx] : null

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E0D7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00E0D7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridVals.map((v, i) => (
          <g key={i}>
            <line
              x1={pad.l} y1={yOf(v)} x2={pad.l + chartW} y2={yOf(v)}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1"
            />
            <text x={pad.l + chartW + 8} y={yOf(v) + 4} fill="#444" fontSize="10" textAnchor="start">
              {formatShort(v)}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={H - 8} fill="#444" fontSize="10" textAnchor="middle">
            {l.label}
          </text>
        ))}

        {/* Area fill */}
        <path d={area1} fill="url(#areaGrad)" />

        {/* EK line (dashed) */}
        {pts2 && (
          <path d={smoothPath(pts2)} fill="none" stroke="#FFB800" strokeWidth="1.5" strokeDasharray="4,4" />
        )}

        {/* Main line */}
        <motion.path
          d={line1} fill="none" stroke="#00E0D7" strokeWidth="2"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Hover vertical line */}
        {hover && (
          <line
            x1={hover.x} y1={pad.t} x2={hover.x} y2={pad.t + chartH}
            stroke="rgba(255,255,255,0.12)" strokeWidth="1"
          />
        )}

        {/* Hover dot */}
        {hover && (
          <circle cx={hover.x} cy={hover.y} r="4" fill="#00E0D7" />
        )}
      </svg>

      {/* Hover tooltip */}
      {hover && hd && (
        <div
          className="absolute pointer-events-none bg-[#141414] border border-[rgba(255,255,255,0.12)] rounded-[8px] px-3 py-2 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.6)] -translate-x-1/2"
          style={{ left: hover.x, top: hover.y - 60 }}
        >
          <p className="text-[#666] mb-1">{new Date(hd.date).toLocaleDateString("de-DE", { month: "short", year: "numeric" })}</p>
          <p className="text-white font-semibold">{formatCurrency(hd[metric === "wert" ? "wert" : "eigenkapital"])}</p>
          {metric === "wert" && <p className="text-[#FFB800]">EK: {formatCurrency(hd.eigenkapital)}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data.map(Math.abs), 1)
  return (
    <div className="flex items-end gap-0.5 h-16">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end items-center">
          <motion.div
            className="w-full rounded-[2px]"
            style={{ background: v >= 0 ? "#00E0D7" : "#FF4444" }}
            initial={{ height: 0 }}
            animate={{ height: `${(Math.abs(v) / max) * 100}%` }}
            transition={{ delay: i * 0.03, duration: 0.4 }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const router = useRouter()
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[20px] flex items-center justify-center mx-auto"
      >
        <Buildings size={36} color="#666" />
      </motion.div>

      <h2 className="text-[28px] font-semibold text-white tracking-[-0.02em] mt-8">
        Dein Portfolio wartet
      </h2>
      <p className="text-sm text-[#666] mt-3 max-w-[360px]">
        Lege dein erstes Objekt an und Imvestra berechnet automatisch alle Kennzahlen.
      </p>

      <button
        onClick={() => router.push("/portfolio/neu")}
        className="mt-6 bg-[#00E0D7] text-[#080808] font-bold px-8 py-3.5 rounded-[10px] shadow-[0_0_30px_rgba(0,224,215,0.2)] hover:bg-[#00C7BE] transition-all cursor-pointer text-sm"
      >
        Objekt anlegen
      </button>

      <div className="mt-10 grid grid-cols-3 gap-4 max-w-[500px] opacity-40 select-none pointer-events-none">
        {["Portfoliowert", "Eigenkapital", "Cashflow/Mo"].map(label => (
          <div key={label} className="bg-[#141414] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-4 blur-[2px]">
            <p className="text-[9px] text-[#666] uppercase tracking-widest">{label}</p>
            <p className="text-[18px] font-semibold text-white mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PortfolioView({ properties, financings, payments, expenses }: PortfolioViewProps) {
  const router = useRouter()
  const prefersReduced = useReducedMotion()
  const [viewMode, setViewMode] = useState<ViewMode>("overview")
  const [chartMetric, setChartMetric] = useState<ChartMetric>("wert")
  const [timeRange, setTimeRange] = useState<TimeRange>("Alle")
  const [valueDisplay, setValueDisplay] = useState<"eur" | "pct">("eur")
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [sortCol, setSortCol] = useState<"marktwert" | "cashflow" | "rendite" | "roe" | "ltv">("roe")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const summary = useMemo(
    () => calculatePortfolioSummary(properties, financings, payments, expenses),
    [properties, financings, payments, expenses]
  )

  const propertyMetrics = useMemo(
    () => properties.map(p => calculatePropertyMetrics(p, financings, payments, expenses)),
    [properties, financings, payments, expenses]
  )

  const avgDSCR = propertyMetrics.length > 0
    ? propertyMetrics.reduce((s, m) => s + m.dscr, 0) / propertyMetrics.length : 0
  const avgLTV = propertyMetrics.length > 0
    ? propertyMetrics.reduce((s, m) => s + m.ltv, 0) / propertyMetrics.length : 0

  // ─── Sorted properties for table ─────────────────────────────────────────────
  const sortedPropertyIndices = useMemo(() => {
    return properties
      .map((_, i) => i)
      .sort((a, b) => {
        const ma = propertyMetrics[a]
        const mb = propertyMetrics[b]
        let va = 0, vb = 0
        if (sortCol === "marktwert")  { va = ma.marktwert; vb = mb.marktwert }
        if (sortCol === "cashflow")   { va = ma.cashflow_monthly; vb = mb.cashflow_monthly }
        if (sortCol === "rendite")    { va = ma.brutto_rendite; vb = mb.brutto_rendite }
        if (sortCol === "roe")        { va = ma.eigenkapital_rendite; vb = mb.eigenkapital_rendite }
        if (sortCol === "ltv")        { va = ma.ltv; vb = mb.ltv }
        return sortDir === "desc" ? vb - va : va - vb
      })
  }, [properties, propertyMetrics, sortCol, sortDir])

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortCol(col); setSortDir("desc") }
  }

  if (properties.length === 0) return <EmptyState />

  const totalRate = financings.reduce((s, f) => s + (f.rate_monthly ?? 0), 0)
  const totalHausgeld = properties.reduce((s, p) => s + (p.hausgeld_monthly ?? 0), 0)
  const totalInstandhaltung = properties.reduce((s, p) => s + (p.sqm ?? 0) * (10 / 12), 0)

  const TAB_VIEWS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "overview",    label: "Übersicht",  icon: <SquaresFour size={13} /> },
    { id: "chart",       label: "Chart",      icon: <ChartLine size={13} /> },
    { id: "properties",  label: "Objekte",    icon: <ListBullets size={13} /> },
    { id: "analyse",     label: "Analyse",    icon: <Compass size={13} /> },
  ]

  // ─── Stacked bar widths ──────────────────────────────────────────────────────
  const mv = summary.total_marktwert
  const ekPct    = mv > 0 ? Math.max(0, summary.total_eingesetztes_eigenkapital / mv * 100) : 0
  const wertPct  = mv > 0 ? Math.max(0, summary.total_wertentwicklung_eur / mv * 100) : 0
  const tilgPct  = mv > 0 ? Math.max(0, summary.total_getilgtes_kapital / mv * 100) : 0
  const restPct  = mv > 0 ? Math.max(0, summary.total_restschuld / mv * 100) : 0

  // ─── Allokation by type ──────────────────────────────────────────────────────
  const typeGroups: Record<string, { count: number; marktwert: number }> = {}
  properties.forEach((p, i) => {
    const t = p.type ?? "Sonstige"
    if (!typeGroups[t]) typeGroups[t] = { count: 0, marktwert: 0 }
    typeGroups[t].count += 1
    typeGroups[t].marktwert += propertyMetrics[i].marktwert
  })

  // ─── Scenario impact ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080808]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-[rgba(8,8,8,0.9)] backdrop-blur-md border-b border-[rgba(255,255,255,0.06)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[20px] font-semibold text-white">Portfolio</p>
            <p className="text-xs text-[#666] mt-0.5">
              {summary.anzahl_objekte} Objekte · {summary.gesamt_flaeche.toFixed(0)} m²
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-1 gap-0.5">
              {TAB_VIEWS.map(v => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium cursor-pointer transition-all"
                  style={viewMode === v.id
                    ? { background: "#1A1A1A", color: "#fff" }
                    : { color: "#555" }}
                >
                  {v.icon}
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => router.push("/portfolio/neu")}
              className="flex items-center gap-1.5 bg-[#00E0D7] text-[#080808] text-xs font-bold px-4 py-2 rounded-[8px] hover:bg-[#00C7BE] transition-all cursor-pointer"
            >
              <Plus size={13} weight="bold" />
              Objekt
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero Metrics Bar ─────────────────────────────────────────────────── */}
      <div className="bg-[#0C0C0C] border-b border-[rgba(255,255,255,0.06)] px-6 py-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">

          {/* 1 – Portfoliowert */}
          <div>
            <div className="flex items-center">
              <span className="text-[10px] text-[#666] uppercase tracking-widest">Portfoliowert</span>
              <Tooltip text="Geschätzter Gesamtmarktwert aller Immobilien. Berechnet aus Ertragswert und Vergleichswert." />
            </div>
            <p className="text-[22px] font-semibold tracking-[-0.02em] text-white mt-1.5">{formatCurrency(summary.total_marktwert)}</p>
            <p className="text-[11px] text-[#666] mt-0.5">Gesamtwert</p>
          </div>

          {/* 2 – Eigenkapital */}
          <div>
            <div className="flex items-center">
              <span className="text-[10px] text-[#666] uppercase tracking-widest">Eigenkapital</span>
              <Tooltip text="Aktueller Eigenkapitalwert = Marktwert minus Restschulden. Was dir nach Verkauf und Schuldenrückzahlung bliebe." />
            </div>
            <p className="text-[22px] font-semibold tracking-[-0.02em] mt-1.5" style={{ color: "#00E0D7" }}>
              {formatCurrency(summary.total_eigenkapital_aktuell)}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#00E0D7" }}>
              {formatCurrencySigned(summary.total_eigenkapital_gewinn)} Gewinn
            </p>
          </div>

          {/* 3 – Wertsteigerung */}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#666] uppercase tracking-widest">Wertsteigerung</span>
              <Tooltip text="Differenz zwischen aktuellem Marktwert und ursprünglichem Kaufpreis aller Objekte." />
              <button
                onClick={() => setValueDisplay(v => v === "eur" ? "pct" : "eur")}
                className="text-[9px] px-1.5 py-0.5 rounded-full border border-[rgba(255,255,255,0.1)] text-[#666] hover:text-white cursor-pointer transition-colors"
              >
                {valueDisplay === "eur" ? "%" : "€"}
              </button>
            </div>
            <p
              className="text-[22px] font-semibold tracking-[-0.02em] mt-1.5"
              style={{ color: summary.total_wertentwicklung_eur >= 0 ? "#00E0D7" : "#FF4444" }}
            >
              {valueDisplay === "eur"
                ? formatCurrencySigned(summary.total_wertentwicklung_eur)
                : formatPercent(summary.total_wertentwicklung_pct)}
            </p>
            <p className="text-[11px] text-[#666] mt-0.5">
              {valueDisplay === "eur"
                ? formatPercent(summary.total_wertentwicklung_pct)
                : formatCurrency(summary.total_wertentwicklung_eur)}
            </p>
          </div>

          {/* 4 – Cashflow */}
          <div>
            <div className="flex items-center">
              <span className="text-[10px] text-[#666] uppercase tracking-widest">Cashflow / Mo.</span>
              <Tooltip text="Monatlicher Netto-Cashflow nach Abzug aller Kosten (Zinsen, Tilgung, Hausgeld, Instandhaltung)." />
            </div>
            <p
              className="text-[22px] font-semibold tracking-[-0.02em] mt-1.5"
              style={{ color: summary.total_cashflow_monthly >= 0 ? "#00E0D7" : "#FF4444" }}
            >
              {formatCurrencySigned(summary.total_cashflow_monthly)}
            </p>
            <p className="text-[11px] text-[#666] mt-0.5">{formatCurrency(summary.total_cashflow_yearly)}/Jahr</p>
          </div>

          {/* 5 – ROE */}
          <div>
            <div className="flex items-center">
              <span className="text-[10px] text-[#666] uppercase tracking-widest">EK-Rendite</span>
              <Tooltip text="ROE: Jährlicher Cashflow geteilt durch eingesetztes Eigenkapital. Zeigt wie effizient dein Kapital arbeitet." />
            </div>
            <p
              className="text-[22px] font-semibold tracking-[-0.02em] mt-1.5"
              style={{ color: colorByValue(summary.portfolio_roe, 0.03, 0.06) }}
            >
              {formatPercent(summary.portfolio_roe)}
            </p>
            <p className="text-[11px] text-[#666] mt-0.5">ROE p.a.</p>
          </div>

          {/* 6 – Gesamtrendite */}
          <div>
            <div className="flex items-center">
              <span className="text-[10px] text-[#666] uppercase tracking-widest">Gesamtrendite</span>
              <Tooltip text="Cashflow + Wertsteigerung geteilt durch eingesetztes Eigenkapital. Die wahre Rendite deines Investments." />
            </div>
            <p
              className="text-[22px] font-semibold tracking-[-0.02em] mt-1.5"
              style={{ color: colorByValue(summary.portfolio_gesamtrendite, 0.05, 0.10) }}
            >
              {formatPercent(summary.portfolio_gesamtrendite)}
            </p>
            <p className="text-[11px] text-[#666] mt-0.5">inkl. Wertsteigerung</p>
          </div>

          {/* 7 – Restschuld */}
          <div>
            <div className="flex items-center">
              <span className="text-[10px] text-[#666] uppercase tracking-widest">Restschuld</span>
              <Tooltip text="Gesamte noch ausstehende Darlehensschulden über alle Objekte. Wird monatlich durch Tilgung reduziert." />
            </div>
            <p className="text-[22px] font-semibold tracking-[-0.02em] mt-1.5 text-[#FF4444]">
              {formatCurrency(summary.total_restschuld)}
            </p>
            <p
              className="text-[11px] mt-0.5"
              style={{
                color: summary.total_fremdkapital_quote > 0.8
                  ? "#FF4444"
                  : summary.total_fremdkapital_quote > 0.6
                  ? "#FFB800"
                  : "#555",
              }}
            >
              {formatPercent(summary.total_fremdkapital_quote)} des Portfoliowerts
            </p>
          </div>
        </div>
      </div>

      {/* ── View Content ──────────────────────────────────────────────────────── */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >

            {/* ════════════════ ÜBERSICHT ════════════════ */}
            {viewMode === "overview" && (
              <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

                {/* LEFT */}
                <div>
                  {/* Kapitalstruktur */}
                  <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5 mb-5">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-white">Kapitalstruktur</span>
                        <Tooltip text="Zeigt wie sich dein Gesamtkapital zusammensetzt: Eigenkapital vs. Fremdkapital." />
                      </div>
                    </div>

                    {/* Stacked bar */}
                    <div className="bg-[#1A1A1A] rounded-full h-8 overflow-hidden flex mb-4">
                      {[
                        { pct: ekPct,   color: "#00E0D7",               label: "EK" },
                        { pct: wertPct, color: "rgba(0,224,215,0.4)",   label: "" },
                        { pct: tilgPct, color: "#FFB800",               label: "" },
                        { pct: restPct, color: "rgba(255,68,68,0.4)", label: "" },
                      ].map((seg, i) => (
                        <motion.div
                          key={i}
                          className="h-full flex items-center justify-center overflow-hidden"
                          style={{ background: seg.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${seg.pct}%` }}
                          transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                        >
                          {seg.label && seg.pct > 8 && (
                            <span className="text-[10px] text-[#080808] font-bold">{seg.label}</span>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          color: "#00E0D7", label: "Eingesetztes Eigenkapital",
                          value: formatCurrency(summary.total_eingesetztes_eigenkapital),
                          tip: "Dein eigenes Kapital das du investiert hast (Kaufpreis + Nebenkosten - Darlehen)",
                        },
                        {
                          color: "rgba(0,224,215,0.5)", label: "Wertsteigerung",
                          value: formatCurrency(Math.max(0, summary.total_wertentwicklung_eur)),
                          tip: "Zuwachs des Immobilienwerts seit Kauf",
                        },
                        {
                          color: "#FFB800", label: "Getilgtes Fremdkapital",
                          value: formatCurrency(summary.total_getilgtes_kapital),
                          tip: "Bereits zurückgezahlte Darlehensbeträge. Erhöhen dein Eigenkapital monatlich.",
                        },
                        {
                          color: "rgba(255,68,68,0.5)", label: "Restschuld",
                          value: formatCurrency(summary.total_restschuld),
                          tip: "Noch ausstehende Darlehensschulden",
                        },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <div className="flex items-center min-w-0">
                            <span className="text-xs text-[#666] truncate">{item.label}</span>
                            <Tooltip text={item.tip} />
                          </div>
                          <span className="text-xs font-semibold text-white ml-auto whitespace-nowrap">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cashflow Waterfall */}
                  <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5">
                    <div className="flex items-center mb-5">
                      <span className="text-sm font-semibold text-white">Cashflow-Analyse / Monat</span>
                      <Tooltip text="Zeigt wohin deine Mieteinnahmen fließen und was als Netto-Cashflow verbleibt." />
                    </div>

                    {(() => {
                      const maxV = summary.total_mieteinnahmen_monthly || 1
                      const rows = [
                        { label: "Mieteinnahmen",            value: summary.total_mieteinnahmen_monthly, color: "#00E0D7",               sign: "" },
                        { label: "− Zinsen & Tilgung",       value: -totalRate,                         color: "#FF4444",               sign: "−" },
                        { label: "− Hausgeld",               value: -totalHausgeld,                     color: "rgba(255,68,68,0.6)",   sign: "−" },
                        { label: "− Instandhaltung",         value: -totalInstandhaltung,               color: "rgba(255,184,0,0.6)",   sign: "−" },
                      ]
                      return (
                        <div>
                          {rows.map(row => (
                            <div key={row.label} className="flex items-center gap-3 py-2.5 border-b border-[rgba(255,255,255,0.04)]">
                              <span className="text-xs text-[#666] w-[160px] flex-shrink-0">{row.label}</span>
                              <div className="flex-1 bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ background: row.color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(Math.abs(row.value) / maxV) * 100}%` }}
                                  transition={{ duration: 0.6, ease: "easeOut" }}
                                />
                              </div>
                              <span className="text-xs font-semibold w-[90px] text-right" style={{ color: row.color }}>
                                {row.sign}{formatCurrency(Math.abs(row.value))}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center gap-3 pt-3">
                            <span className="text-sm font-semibold text-white w-[160px] flex-shrink-0">= Netto-Cashflow</span>
                            <div className="flex-1 bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: summary.total_cashflow_monthly >= 0 ? "#00E0D7" : "#FF4444" }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(Math.abs(summary.total_cashflow_monthly) / maxV) * 100}%` }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                              />
                            </div>
                            <span
                              className="text-lg font-semibold w-[90px] text-right"
                              style={{ color: summary.total_cashflow_monthly >= 0 ? "#00E0D7" : "#FF4444" }}
                            >
                              {formatCurrencySigned(summary.total_cashflow_monthly)}
                            </span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* RIGHT */}
                <div>
                  {/* Kennzahlen */}
                  <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5 mb-4">
                    <p className="text-sm font-semibold text-white mb-4">Kennzahlen</p>
                    {[
                      {
                        label: "Investiertes Kapital",
                        tip: "Gesamtes eingesetztes Kapital (Eigenkapital + Fremdkapital)",
                        value: formatCurrency(summary.total_gesamtinvestition),
                        color: "#fff",
                      },
                      {
                        label: "Davon Eigenkapital",
                        tip: "Dein eigener Anteil am Gesamtinvestment",
                        value: formatCurrency(summary.total_eingesetztes_eigenkapital),
                        sub: formatPercent(summary.total_eingesetztes_eigenkapital / (summary.total_gesamtinvestition || 1)),
                        color: "#fff",
                      },
                      {
                        label: "Fremdkapitalquote (LTV)",
                        tip: "Loan-to-Value: Restschuld im Verhältnis zum Marktwert. Banken bevorzugen unter 80%.",
                        value: formatPercent(summary.total_fremdkapital_quote),
                        color: summary.total_fremdkapital_quote > 0.8 ? "#FF4444"
                          : summary.total_fremdkapital_quote > 0.6 ? "#FFB800"
                          : "#00E0D7",
                      },
                      {
                        label: "Bruttorendite Ø",
                        tip: "Jahreskaltmiete / Kaufpreis. Orientierungswert vor Kosten.",
                        value: formatPercent(summary.portfolio_brutto_rendite),
                        color: "#fff",
                      },
                      {
                        label: "Nettorendite Ø",
                        tip: "Cashflow nach allen Kosten / Gesamtinvestition. Reale Rendite.",
                        value: formatPercent(summary.portfolio_netto_rendite),
                        color: colorByValue(summary.portfolio_netto_rendite, 0.02, 0.04),
                      },
                      {
                        label: "Ø DSCR",
                        tip: "Debt Service Coverage Ratio: NOI / Jahresschuldendienst. Banken erwarten mindestens 1,2.",
                        value: avgDSCR > 0 ? avgDSCR.toFixed(2) : "—",
                        color: avgDSCR === 0 ? "#555" : colorByValue(avgDSCR, 1.2, 1.5),
                      },
                      {
                        label: "Ø LTV je Objekt",
                        tip: "Durchschnittlicher Loan-to-Value pro Objekt",
                        value: formatPercent(avgLTV),
                        color: avgLTV > 0.8 ? "#FF4444" : avgLTV > 0.6 ? "#FFB800" : "#00E0D7",
                      },
                      {
                        label: "Ø Cashflow/Objekt",
                        tip: "Durchschnittlicher monatlicher Cashflow pro Objekt",
                        value: formatCurrencySigned(summary.total_cashflow_monthly / (summary.anzahl_objekte || 1)),
                        color: summary.total_cashflow_monthly >= 0 ? "#00E0D7" : "#FF4444",
                      },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                        <div className="flex items-center">
                          <span className="text-xs text-[#666]">{row.label}</span>
                          <Tooltip text={row.tip} />
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold" style={{ color: row.color }}>{row.value}</span>
                          {row.sub && <p className="text-[10px] text-[#666]">{row.sub}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Allokation */}
                  <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5">
                    <p className="text-sm font-semibold text-white mb-4">Allokation nach Objekttyp</p>
                    {Object.entries(typeGroups).map(([type, group]) => {
                      const tc = TYPE_COLORS[type] ?? TYPE_COLORS["Sonstige"]
                      const pct = mv > 0 ? group.marktwert / mv : 0
                      return (
                        <div key={type} className="flex items-center gap-3 py-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: tc.bg, color: tc.text }}>
                            {type}
                          </span>
                          <span className="text-xs text-[#666] flex-shrink-0">{group.count}x</span>
                          <div className="flex-1 bg-[#1A1A1A] rounded-full h-1 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: tc.text }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct * 100}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-white">{formatPercent(pct, 0)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════ CHART ════════════════ */}
            {viewMode === "chart" && (
              <div className="px-6 py-6">
                {/* Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-6">
                    {(["wert", "eigenkapital"] as ChartMetric[]).map(m => (
                      <button
                        key={m}
                        onClick={() => setChartMetric(m)}
                        className="text-sm font-medium pb-2 cursor-pointer transition-all border-b-2"
                        style={chartMetric === m
                          ? { color: "#00E0D7", borderColor: "#00E0D7" }
                          : { color: "#555", borderColor: "transparent" }}
                      >
                        {m === "wert" ? "Portfoliowert" : "Eigenkapital"}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-1">
                    {(["1J", "3J", "5J", "Alle"] as TimeRange[]).map(r => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className="text-xs px-3 py-1.5 rounded-[6px] cursor-pointer transition-all"
                        style={timeRange === r
                          ? { background: "#1A1A1A", color: "#fff" }
                          : { color: "#666" }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main chart */}
                <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5 mb-4">
                  <LineChart data={summary.wert_verlauf} metric={chartMetric} timeRange={timeRange} />
                  <div className="flex gap-6 mt-4 text-xs text-[#666]">
                    <span style={{ color: "#00E0D7" }}>─── {chartMetric === "wert" ? "Portfoliowert" : "Eigenkapital"}</span>
                    {chartMetric === "wert" && <span style={{ color: "#FFB800" }}>- - - Eigenkapital</span>}
                  </div>
                </div>

                {/* Secondary charts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-4">
                    <p className="text-xs text-[#666] mb-3">Cashflow / Monat (simuliert)</p>
                    <MiniBarChart data={summary.wert_verlauf.slice(-12).map((_, i, arr) => {
                      const prog = i / Math.max(arr.length - 1, 1)
                      return summary.total_cashflow_monthly * (0.8 + prog * 0.2)
                    })} />
                    <p className="text-[10px] text-[#666] mt-2 text-center">letzte 12 Datenpunkte</p>
                  </div>

                  <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-4">
                    <p className="text-xs text-[#666] mb-3">Rendite-Breakdown</p>
                    <div className="space-y-2">
                      {[
                        { label: "Brutto", value: summary.portfolio_brutto_rendite, max: 0.1 },
                        { label: "Netto",  value: summary.portfolio_netto_rendite,  max: 0.1 },
                        { label: "ROE",    value: summary.portfolio_roe,            max: 0.15 },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-2">
                          <span className="text-[10px] text-[#666] w-10">{row.label}</span>
                          <div className="flex-1 bg-[#1A1A1A] rounded-full h-1.5">
                            <motion.div
                              className="h-full rounded-full bg-[#00E0D7]"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(row.value / row.max, 1) * 100}%` }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                          <span className="text-[10px] text-white w-12 text-right">{formatPercent(row.value, 1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-4 flex flex-col items-center">
                    <p className="text-xs text-[#666] mb-3 self-start">Kapital-Verteilung</p>
                    <DonutChart summary={summary} />
                    <div className="mt-3 space-y-1 w-full">
                      {[
                        { color: "#00E0D7",               label: "EK eingesetzt" },
                        { color: "rgba(0,224,215,0.4)",   label: "Wertsteigerung" },
                        { color: "#FFB800",               label: "Getilgt" },
                        { color: "rgba(255,68,68,0.5)",   label: "Restschuld" },
                      ].map(i => (
                        <div key={i.label} className="flex items-center gap-2 text-[10px] text-[#666]">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: i.color }} />
                          {i.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════ OBJEKTE ════════════════ */}
            {viewMode === "properties" && (
              <div className="px-6 py-6">
                {/* Table header — sortable */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                  <span className="text-[10px] text-[#666] uppercase tracking-widest">Objekt</span>
                  {([
                    ["marktwert", "Marktwert"],
                    ["ltv",       "Wertsteigerung"],
                    ["cashflow",  "Cashflow/Mo"],
                    ["rendite",   "Rendite"],
                    ["roe",       "EK-Rendite"],
                  ] as [typeof sortCol, string][]).map(([col, label]) => (
                    <button
                      key={label}
                      onClick={() => toggleSort(col)}
                      className="flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors"
                      style={{ color: sortCol === col ? "#00E0D7" : "#666" }}
                    >
                      {label}
                      {sortCol === col && (
                        <span style={{ fontSize: 8 }}>{sortDir === "desc" ? "▼" : "▲"}</span>
                      )}
                    </button>
                  ))}
                  <span />
                </div>

                {/* Rows */}
                {sortedPropertyIndices.map((i) => {
                  const p = properties[i]
                  const m = propertyMetrics[i]
                  const isOpen = selectedProperty === p.id
                  const tc = TYPE_COLORS[p.type ?? "Sonstige"] ?? TYPE_COLORS["Sonstige"]
                  return (
                    <div key={p.id}>
                      <div
                        onClick={() => setSelectedProperty(isOpen ? null : p.id)}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 bg-[#141414] border border-[rgba(255,255,255,0.07)] rounded-[12px] mb-2 px-4 py-3.5 hover:border-[rgba(255,255,255,0.12)] hover:bg-[#1A1A1A] transition-all cursor-pointer items-center"
                        style={isOpen ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-[8px] flex-shrink-0 flex items-center justify-center"
                            style={{ background: tc.bg }}
                          >
                            <span className="text-[9px] font-bold" style={{ color: tc.text }}>{p.type?.slice(0,3) ?? "—"}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                            <p className="text-xs text-[#666] mt-0.5">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mr-1" style={{ background: tc.bg, color: tc.text }}>{p.type}</span>
                              {p.address?.split(",")[1]?.trim() ?? ""}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{formatCurrency(m.marktwert)}</p>
                          <p className="text-[10px] text-[#666]">vs {formatCurrency(m.kaufpreis)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: m.wertentwicklung_eur >= 0 ? "#00E0D7" : "#FF4444" }}>
                            {formatCurrencySigned(m.wertentwicklung_eur)}
                          </p>
                          <p className="text-[10px] text-[#666]">{formatPercent(m.wertentwicklung_pct)}</p>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: m.cashflow_monthly >= 0 ? "#00E0D7" : "#FF4444" }}>
                          {formatCurrencySigned(m.cashflow_monthly)}
                        </p>
                        <div>
                          <p className="text-sm font-semibold text-white">{formatPercent(m.brutto_rendite)}</p>
                          <p className="text-[10px] text-[#666]">Brutto</p>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: colorByValue(m.eigenkapital_rendite, 0.03, 0.06) }}>
                          {formatPercent(m.eigenkapital_rendite)}
                        </p>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedProperty(isOpen ? null : p.id) }}
                          className="flex items-center justify-center cursor-pointer text-[#666] hover:text-white transition-colors"
                        >
                          <DotsThree size={18} weight="bold" />
                        </button>
                      </div>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: "hidden" }}
                            className="mb-2"
                          >
                            <div className="bg-[#0C0C0C] border-x border-b border-[rgba(255,255,255,0.07)] rounded-b-[12px] px-4 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                {[
                                  { label: "Gesamtinvestition", tip: "Kaufpreis + Nebenkosten", value: formatCurrency(m.gesamtinvestition), color: "#fff" },
                                  { label: "Eingesetztes EK",   tip: "Gesamtinvestition minus Darlehen", value: formatCurrency(m.eigenkapital_eingesetzt), color: "#fff" },
                                  { label: "Restschuld",        tip: "Noch ausstehende Darlehensschulden", value: formatCurrency(m.restschuld), color: "#FF4444" },
                                  { label: "Getilgtes Kapital", tip: "Bereits zurückgezahlte Darlehensbeträge", value: formatCurrency(m.getilgtes_kapital), color: "#FFB800" },
                                  { label: "LTV",               tip: "Restschuld / Marktwert", value: formatPercent(m.ltv), color: colorByValue(1 - m.ltv, 0.2, 0.4) },
                                  { label: "DSCR",              tip: "NOI / Jahresschuldendienst", value: m.dscr > 0 ? m.dscr.toFixed(2) : "—", color: m.dscr === 0 ? "#666" : colorByValue(m.dscr, 1.2, 1.5) },
                                  { label: "Aktuelles EK",      tip: "Marktwert minus Restschuld", value: formatCurrency(m.eigenkapital_aktuell), color: "#00E0D7" },
                                  { label: "EK-Gewinn",         tip: "Aktuelles EK minus eingesetztes EK", value: formatCurrencySigned(m.eigenkapital_gewinn), color: m.eigenkapital_gewinn >= 0 ? "#00E0D7" : "#FF4444" },
                                ].map(row => (
                                  <div key={row.label} className="bg-[#141414] rounded-[10px] p-3">
                                    <div className="flex items-center">
                                      <p className="text-[10px] text-[#666]">{row.label}</p>
                                      <Tooltip text={row.tip} />
                                    </div>
                                    <p className="text-sm font-semibold mt-1" style={{ color: row.color }}>{row.value}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => router.push(`/calculator?property=${p.id}`)}
                                  className="text-xs px-3 py-1.5 rounded-[6px] border border-[rgba(255,255,255,0.1)] text-[#888] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <ArrowUpRight size={12} /> Im Rechner öffnen
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}

                {/* Totals row */}
                <div className="sticky bottom-0 bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] rounded-[12px] px-4 py-3 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 items-center mt-2">
                  <p className="text-xs font-bold text-white">Gesamt</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(summary.total_marktwert)}</p>
                  <p className="text-sm font-bold" style={{ color: summary.total_wertentwicklung_eur >= 0 ? "#00E0D7" : "#FF4444" }}>
                    {formatCurrencySigned(summary.total_wertentwicklung_eur)}
                  </p>
                  <p className="text-sm font-bold" style={{ color: summary.total_cashflow_monthly >= 0 ? "#00E0D7" : "#FF4444" }}>
                    {formatCurrencySigned(summary.total_cashflow_monthly)}
                  </p>
                  <p className="text-sm font-bold text-white">{formatPercent(summary.portfolio_brutto_rendite)}</p>
                  <p className="text-sm font-bold" style={{ color: colorByValue(summary.portfolio_roe, 0.03, 0.06) }}>
                    {formatPercent(summary.portfolio_roe)}
                  </p>
                  <span />
                </div>
              </div>
            )}

            {/* ════════════════ ANALYSE ════════════════ */}
            {viewMode === "analyse" && (
              <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Rendite-Analyse */}
                <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5">
                  <p className="text-sm font-semibold text-white mb-5">Rendite-Analyse</p>
                  <div className="space-y-4">
                    {[
                      { label: "Bruttorendite Ø",                value: summary.portfolio_brutto_rendite },
                      { label: "Nettorendite Ø",                 value: summary.portfolio_netto_rendite },
                      { label: "Eigenkapitalrendite Ø",          value: summary.portfolio_roe },
                      { label: "Gesamtrendite (inkl. Wertsteig.)", value: summary.portfolio_gesamtrendite },
                    ].map(row => (
                      <div key={row.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#666]">{row.label}</span>
                          <span className="font-semibold" style={{ color: colorByValue(row.value, 0.03, 0.06) }}>
                            {formatPercent(row.value)}
                          </span>
                        </div>
                        <div className="relative bg-[#1A1A1A] rounded-full h-2">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: colorByValue(row.value, 0.03, 0.06) }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(row.value / 0.20, 1) * 100}%` }}
                            transition={{ duration: 0.6 }}
                          />
                          {/* Tagesgeld 3% */}
                          <div className="absolute top-0 bottom-0 w-px bg-[#444]" style={{ left: `${(0.03 / 0.20) * 100}%` }} />
                          {/* DAX 8% */}
                          <div className="absolute top-0 bottom-0 w-px bg-[#666]" style={{ left: `${(0.08 / 0.20) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-4 text-[10px] text-[#666] pt-1">
                      <span>│ Tagesgeld ~3%</span>
                      <span>│ DAX Ø ~8%</span>
                    </div>
                  </div>
                </div>

                {/* Risiko-Analyse */}
                <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5">
                  <p className="text-sm font-semibold text-white mb-5">Risikoprofil</p>
                  <div className="space-y-0">
                    {[
                      {
                        label: "Fremdkapitalquote",
                        tip: "Restschuld / Marktwert. Unter 60% gilt als solide.",
                        value: formatPercent(summary.total_fremdkapital_quote),
                        risk: summary.total_fremdkapital_quote < 0.6 ? "low" : summary.total_fremdkapital_quote < 0.8 ? "mid" : "high",
                      },
                      {
                        label: "Ø DSCR",
                        tip: "Debt Service Coverage Ratio. Über 1,5 gilt als gut.",
                        value: avgDSCR > 0 ? avgDSCR.toFixed(2) : "—",
                        risk: avgDSCR === 0 ? "mid" : avgDSCR >= 1.5 ? "low" : avgDSCR >= 1.2 ? "mid" : "high",
                      },
                      {
                        label: "Leerstandsrisiko",
                        tip: "Aktuelle Leerstandsquote im Portfolio.",
                        value: formatPercent(summary.leerstandsquote),
                        risk: "low" as const,
                      },
                      {
                        label: "Zinsbindungs-Risiko",
                        tip: "Wie viele Finanzierungen laufen innerhalb von 12 Monaten aus.",
                        value: `${financings.filter(f => {
                          if (!f.fixed_until) return false
                          const days = (new Date(f.fixed_until).getTime() - Date.now()) / 86400000
                          return days < 365
                        }).length} Objekte`,
                        risk: "mid" as const,
                      },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                        <div className="flex items-center">
                          <span className="text-xs text-[#666]">{row.label}</span>
                          <Tooltip text={row.tip} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{row.value}</span>
                          <div className="w-2 h-2 rounded-full" style={{
                            background: row.risk === "low" ? "#00E0D7" : row.risk === "mid" ? "#FFB800" : "#FF4444"
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Ranking */}
                <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5">
                  <p className="text-sm font-semibold text-white mb-1">Performance Ranking</p>
                  <p className="text-xs text-[#666] mb-5">Objekte nach Eigenkapitalrendite</p>
                  <div className="space-y-0">
                    {[...propertyMetrics]
                      .sort((a, b) => b.eigenkapital_rendite - a.eigenkapital_rendite)
                      .map((m, rank) => {
                        const prop = properties.find(p => p.id === m.property_id)!
                        const maxROE = propertyMetrics.reduce((mx, pm) => Math.max(mx, pm.eigenkapital_rendite), 0.001)
                        const isTop = rank === 0
                        const isBot = rank === propertyMetrics.length - 1
                        return (
                          <div key={m.property_id} className="flex items-center gap-3 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                            <span className="text-[10px] font-bold w-4 flex-shrink-0" style={{
                              color: isTop ? "#00E0D7" : isBot ? "#FF4444" : "#555"
                            }}>#{rank + 1}</span>
                            <span className="text-xs text-white flex-1 min-w-0 truncate">{prop.name}</span>
                            <div className="w-24 bg-[#1A1A1A] rounded-full h-1.5 flex-shrink-0">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: isTop ? "#00E0D7" : isBot ? "#FF4444" : "#FFB800" }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(m.eigenkapital_rendite / maxROE) * 100}%` }}
                                transition={{ delay: rank * 0.1, duration: 0.5 }}
                              />
                            </div>
                            <span className="text-xs font-semibold w-14 text-right flex-shrink-0"
                              style={{ color: isTop ? "#00E0D7" : isBot ? "#FF4444" : "#fff" }}>
                              {formatPercent(m.eigenkapital_rendite)}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
