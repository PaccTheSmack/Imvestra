"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowUpRight, Warning, CurrencyDollar } from "@phosphor-icons/react";
import type { PortfolioSummary } from "@/lib/portfolio-calculations";
import CountUp from "@/components/ui/CountUp";

function formatCurrencyLocal(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n)
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " €";
}
function fmtCurrencyCountUp(v: number) {
  return new Intl.NumberFormat("de-DE", { style: "decimal", maximumFractionDigits: 0 }).format(Math.round(v)) + " €";
}
function fmtPercentCountUp(v: number) {
  return (v * 100).toFixed(2).replace(".", ",") + " %";
}
function fmtSignedCountUp(v: number) {
  const abs = fmtCurrencyCountUp(Math.abs(v));
  return v >= 0 ? "+" + abs : "−" + abs;
}

interface RecentProperty {
  id: string;
  name: string;
  type: string;
  sqm: number;
  purchase_price: number;
  gross_yield: number;
  cashflow_monthly: number;
}

interface DashboardHomeProps {
  firstName: string;
  isFreePlan: boolean;
  count: number;
  totalCashflow: number | null;
  avgNetYield: number | null;
  totalInvestment: number | null;
  recentProperties: RecentProperty[];
  financingAlertCount?: number;
  monthlyRentSoll?: number;
  monthlyRentIst?: number;
  overdueTasks?: number;
  overdueCount?: number;
  overdueTotal?: number;
  portfolioSummary?: PortfolioSummary;
  actionTasks?: { action_type: string | null; title: string; action_payload: Record<string, unknown> }[];
}

function getGreeting(firstName: string) {
  const h = new Date().getHours();
  const g = h < 12 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
  return firstName ? `${g}, ${firstName}.` : `${g}.`;
}

export default function DashboardHome({
  firstName,
  count,
  totalCashflow,
  avgNetYield,
  recentProperties,
  financingAlertCount = 0,
  monthlyRentSoll = 0,
  overdueTasks = 0,
  overdueCount = 0,
  overdueTotal = 0,
  portfolioSummary,
  actionTasks,
}: DashboardHomeProps) {
  const router = useRouter();

const hasPortfolio = portfolioSummary && portfolioSummary.anzahl_objekte > 0;
  const ltvPct = hasPortfolio
    ? Math.min(portfolioSummary!.total_fremdkapital_quote * 100, 100)
    : 0;

  return (
    <div className="px-8 py-7 w-full max-w-[1400px]" style={{ background: "#F8F7F4", minHeight: "100vh" }}>

      {/* GREETING ROW */}
      <div className="mb-7">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em]" style={{ color: "#101418" }}>
          {getGreeting(firstName)}
        </h2>
        <p className="text-[13px] mt-1" style={{ color: "#9CA3AF" }}>
          Hier ist deine Übersicht für heute.
        </p>
      </div>

      {/* OVERDUE ALERT BANNER */}
      {overdueCount > 0 && (
        <div
          className="flex items-center justify-between mb-5"
          style={{
            background: "rgba(185,28,28,0.04)",
            border: "1px solid rgba(185,28,28,0.12)",
            borderRadius: 12,
            padding: "14px 20px",
          }}
        >
          <div className="flex items-center gap-3">
            <Warning size={18} color="#B91C1C" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#B91C1C" }}>
                {overdueCount} Zahlung{overdueCount !== 1 ? "en" : ""} überfällig · {fmtCurrency(overdueTotal)} offen
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/mahnwesen")}
            style={{
              fontSize: 12, fontWeight: 500, color: "#B91C1C",
              background: "rgba(185,28,28,0.08)",
              border: "1px solid rgba(185,28,28,0.15)",
              padding: "6px 14px", borderRadius: 8,
            }}
          >
            Mahnwesen öffnen →
          </button>
        </div>
      )}

      {/* ACTION SUMMARY GRID */}
      {(actionTasks && actionTasks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {/* Zahlungen prüfen */}
          {(() => {
            const paymentTasks = actionTasks.filter(t => t.action_type === "confirm_payment")
            const sum = paymentTasks.reduce((s, t) => s + ((t.action_payload?.betrag as number) ?? 0), 0)
            if (paymentTasks.length === 0) return null
            return (
              <div style={{ background: "rgba(45,106,45,0.04)", border: "1px solid rgba(45,106,45,0.15)", borderRadius: 12, padding: "14px 16px" }}>
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollar size={15} color="#2D6A2D" />
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "rgba(45,106,45,0.12)", color: "#2D6A2D" }}>{paymentTasks.length}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#2D6A2D" }}>{paymentTasks.length} Zahlung{paymentTasks.length !== 1 ? "en" : ""} zu bestätigen</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{formatCurrencyLocal(sum)} eingegangen</p>
                <button onClick={() => router.push("/aufgaben")} style={{ fontSize: 11, color: "#2D6A2D", marginTop: 8, fontWeight: 500 }}>Jetzt prüfen →</button>
              </div>
            )
          })()}
          {/* Mahnungen */}
          {(() => {
            const mahnTasks = actionTasks.filter(t => t.action_type === "create_mahnung")
            const sum = mahnTasks.reduce((s, t) => s + ((t.action_payload?.betrag as number) ?? 0), 0)
            if (mahnTasks.length === 0) return null
            return (
              <div style={{ background: "rgba(185,28,28,0.04)", border: "1px solid rgba(185,28,28,0.12)", borderRadius: 12, padding: "14px 16px" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Warning size={15} color="#B91C1C" />
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "rgba(185,28,28,0.1)", color: "#B91C1C" }}>{mahnTasks.length}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#B91C1C" }}>{mahnTasks.length} Mahnung{mahnTasks.length !== 1 ? "en" : ""} empfohlen</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{formatCurrencyLocal(sum)} ausstehend</p>
                <button onClick={() => router.push("/mahnwesen")} style={{ fontSize: 11, color: "#B91C1C", marginTop: 8, fontWeight: 500 }}>Zum Mahnwesen →</button>
              </div>
            )
          })()}
          {/* Zinsbindung */}
          {(() => {
            const zinsTasks = actionTasks.filter(t => t.action_type === "check_zinsbindung")
            if (zinsTasks.length === 0) return null
            return (
              <div style={{ background: "rgba(160,120,48,0.04)", border: "1px solid rgba(160,120,48,0.15)", borderRadius: 12, padding: "14px 16px" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Warning size={15} color="#A07830" />
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "rgba(160,120,48,0.1)", color: "#A07830" }}>{zinsTasks.length}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#A07830" }}>{zinsTasks.length} Zinsbindung{zinsTasks.length !== 1 ? "en" : ""} laufen ab</p>
                <button onClick={() => router.push("/calculator")} style={{ fontSize: 11, color: "#A07830", marginTop: 8, fontWeight: 500 }}>Zum Zinsrechner →</button>
              </div>
            )
          })()}
        </div>
      )}

      {/* STAT CARDS — grid-cols-4 */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        {/* Card 1: PORTFOLIOWERT — DARK GOLD */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0, duration: 0.28 }}
          className="rounded-[14px] p-6"
          style={{ background: "#A07830", boxShadow: "0 4px 24px rgba(160,120,48,0.25)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Portfoliowert</span>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }}
              onClick={() => router.push("/portfolio")}
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="text-[32px] font-bold tracking-[-0.03em] mt-4 tabular-nums" style={{ color: "white" }}>
            <CountUp to={portfolioSummary?.total_marktwert ?? 0} formatter={fmtCurrencyCountUp} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}>
              {portfolioSummary ? `${(portfolioSummary.total_wertentwicklung_pct * 100).toFixed(1).replace(".", ",")} %` : "–"}
            </span>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>Wertentwicklung</span>
          </div>
        </motion.div>

        {/* Card 2: EIGENKAPITAL */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.28 }}
          className="rounded-[14px] p-6 transition-all duration-200 cursor-default"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          whileHover={{ borderColor: "rgba(160,120,48,0.2)", boxShadow: "0 4px 24px rgba(160,120,48,0.08)", y: -1 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium" style={{ color: "#6B7280" }}>Eigenkapital</span>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#9CA3AF" }}
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="text-[32px] font-bold tracking-[-0.03em] mt-4 tabular-nums" style={{ color: "#A07830" }}>
            <CountUp to={portfolioSummary?.total_eingesetztes_eigenkapital ?? 0} formatter={fmtCurrencyCountUp} />
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: "#9CA3AF" }}>
            Eingesetztes Kapital
          </p>
        </motion.div>

        {/* Card 3: CASHFLOW */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.28 }}
          className="rounded-[14px] p-6 transition-all duration-200 cursor-default"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          whileHover={{ borderColor: "rgba(160,120,48,0.2)", boxShadow: "0 4px 24px rgba(160,120,48,0.08)", y: -1 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium" style={{ color: "#6B7280" }}>Cashflow / Monat</span>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#9CA3AF" }}
              onClick={() => router.push("/finanzen")}
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="text-[32px] font-bold tracking-[-0.03em] mt-4 tabular-nums"
            style={{ color: (totalCashflow ?? 0) >= 0 ? "#2D6A2D" : "#B91C1C" }}>
            <CountUp to={totalCashflow ?? 0} formatter={fmtSignedCountUp} />
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: "#9CA3AF" }}>
            {count} Objekte im Portfolio
          </p>
        </motion.div>

        {/* Card 4: RENDITE */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.28 }}
          className="rounded-[14px] p-6 transition-all duration-200 cursor-default"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          whileHover={{ borderColor: "rgba(160,120,48,0.2)", boxShadow: "0 4px 24px rgba(160,120,48,0.08)", y: -1 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium" style={{ color: "#6B7280" }}>Ø Nettomietrendite</span>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#9CA3AF" }}
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="text-[32px] font-bold tracking-[-0.03em] mt-4 tabular-nums" style={{ color: "#A07830" }}>
            <CountUp to={avgNetYield ?? 0} formatter={fmtPercentCountUp} />
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: "#9CA3AF" }}>
            Nettomietrendite p.a.
          </p>
        </motion.div>
      </div>

      {/* MAIN GRID — 3 cols */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr 340px" }}>

        {/* LEFT: Cashflow Analyse */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.28 }}
          className="rounded-[14px] p-6"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-semibold" style={{ color: "#101418" }}>Cashflow-Analyse</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>Mieteinnahmen vs. Kosten</p>
            </div>
            <div className="flex gap-1">
              {(["Mo", "Qi", "Jr"] as const).map((p, i) => (
                <button key={p} className="px-2.5 py-1 rounded-[8px] text-[11px] font-semibold transition-all"
                  style={i === 0
                    ? { background: "#A07830", color: "white" }
                    : { background: "#F5F5F5", color: "#6B7280" }
                  }>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Simple bar chart - last 7 months */}
          {(() => {
            const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul"].slice(-7);
            const income = monthlyRentSoll > 0
              ? Array.from({ length: 7 }, () => monthlyRentSoll * (0.85 + Math.random() * 0.15))
              : Array(7).fill(0);
            const costs = income.map(v => v * 0.4);
            const max = Math.max(...income, 1);
            return (
              <div>
                <div className="flex items-end gap-2 h-[140px] mb-3">
                  {months.map((m, i) => (
                    <div key={m} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                        <div className="flex-1 rounded-t-[6px] transition-all duration-500"
                          style={{ height: `${(income[i] / max) * 100}%`, background: i === 5 ? "#A07830" : "#F0EDE4", minHeight: 4 }} />
                        <div className="flex-1 rounded-t-[6px]"
                          style={{ height: `${(costs[i] / max) * 100}%`, background: "#E5E5E5", minHeight: 4 }} />
                      </div>
                      <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{m}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#A07830" }} />
                    <span className="text-[11px]" style={{ color: "#6B7280" }}>Mieteinnahmen</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#E5E5E5" }} />
                    <span className="text-[11px]" style={{ color: "#6B7280" }}>Kosten</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>

        {/* MIDDLE: Objekte */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.28 }}
          className="rounded-[14px] overflow-hidden"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <h3 className="text-[15px] font-semibold" style={{ color: "#101418" }}>Objekte</h3>
            <Link href="/portfolio" className="text-[12px] font-semibold transition-colors" style={{ color: "#A07830" }}>
              Alle ansehen →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            {recentProperties.slice(0, 5).map(p => (
              <div key={p.id} className="px-6 py-3.5 flex items-center gap-3 transition-colors duration-150 cursor-pointer"
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#F8F7F4"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-[11px] flex-shrink-0"
                  style={{
                    background: p.cashflow_monthly >= 0 ? "rgba(160,120,48,0.08)" : "rgba(185,28,28,0.06)",
                    border: p.cashflow_monthly >= 0 ? "1px solid rgba(160,120,48,0.15)" : "1px solid rgba(185,28,28,0.12)",
                    color: p.cashflow_monthly >= 0 ? "#A07830" : "#B91C1C",
                  }}>
                  {p.type?.slice(0, 3) ?? "OBJ"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: "#101418" }}>{p.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
                    Rendite {(p.gross_yield * 100).toFixed(2).replace(".", ",")} %
                  </p>
                </div>
                <span className="text-[14px] font-bold tabular-nums flex-shrink-0"
                  style={{ color: p.cashflow_monthly >= 0 ? "#2D6A2D" : "#B91C1C" }}>
                  {p.cashflow_monthly >= 0 ? "+" : ""}{fmtCurrency(p.cashflow_monthly)}
                </span>
              </div>
            ))}
            {recentProperties.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-[13px]" style={{ color: "#9CA3AF" }}>Noch keine Objekte angelegt.</p>
                <Link href="/portfolio/neu" className="text-[13px] font-semibold mt-1 block" style={{ color: "#A07830" }}>
                  Erstes Objekt anlegen →
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Restschuld */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.28 }}
            className="rounded-[14px] p-5"
            style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px]" style={{ color: "#9CA3AF" }}>Restschuld gesamt</span>
              <button className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#9CA3AF" }}>
                <ArrowUpRight size={13} />
              </button>
            </div>
            <div className="text-[26px] font-bold tracking-[-0.02em] tabular-nums" style={{ color: "#B91C1C" }}>
              {fmtCurrency(portfolioSummary?.total_restschuld ?? 0)}
            </div>
            <div className="mt-3 rounded-full overflow-hidden" style={{ height: 6, background: "#F5F5F5" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${ltvPct}%`,
                  background: "linear-gradient(to right, #B91C1C, rgba(185,28,28,0.4))",
                }} />
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: "#9CA3AF" }}>
              {ltvPct.toFixed(0)} % LTV
            </p>
          </motion.div>

          {/* Aufgaben */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.28 }}
            className="rounded-[14px] overflow-hidden flex-1"
            style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <h3 className="text-[14px] font-semibold" style={{ color: "#101418" }}>Aufgaben</h3>
              <Link href="/aufgaben" className="text-[11px] font-bold px-3 py-1.5 rounded-[8px] transition-all"
                style={{ background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.15)", color: "#A07830" }}>
                + Neue
              </Link>
            </div>
            {overdueTasks > 0 ? (
              <div className="px-5 py-3 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="flex-1">
                  <p className="text-[12px] font-medium" style={{ color: "#101418" }}>
                    {overdueTasks} überfällige Aufgabe{overdueTasks > 1 ? "n" : ""}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>Bitte prüfen</p>
                </div>
                <span className="text-[9px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(185,28,28,0.08)", color: "#B91C1C", border: "1px solid rgba(185,28,28,0.12)" }}>
                  Dringend
                </span>
              </div>
            ) : (
              <div className="px-5 py-6 text-center">
                <p className="text-[13px]" style={{ color: "#9CA3AF" }}>Keine offenen Aufgaben.</p>
              </div>
            )}
            {financingAlertCount > 0 && (
              <div className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[12px] font-medium" style={{ color: "#101418" }}>
                    {financingAlertCount} Zinsbindung{financingAlertCount > 1 ? "en" : ""} läuft aus
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>Anschlussfinanzierung prüfen</p>
                </div>
                <span className="text-[9px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(160,120,48,0.08)", color: "#A07830", border: "1px solid rgba(160,120,48,0.12)" }}>
                  Offen
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* BOTTOM ROW — 2 cols */}
      <div className="grid grid-cols-2 gap-4">

        {/* Kapitalstruktur */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.28 }}
          className="rounded-[14px] p-6"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-semibold" style={{ color: "#101418" }}>Kapitalstruktur</h3>
            <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
              Gesamt: {fmtCurrency(portfolioSummary?.total_marktwert ?? 0)}
            </span>
          </div>

          {/* Stacked bar */}
          <div className="flex h-8 rounded-[10px] overflow-hidden gap-0.5 mb-5">
            {portfolioSummary && portfolioSummary.total_marktwert > 0 ? (
              <>
                <div style={{ width: `${(portfolioSummary.total_eingesetztes_eigenkapital / portfolioSummary.total_marktwert * 100).toFixed(1)}%`, background: "#A07830" }} />
                <div style={{ width: `${Math.max(0, portfolioSummary.total_wertentwicklung_eur / portfolioSummary.total_marktwert * 100).toFixed(1)}%`, background: "#C9A86A", opacity: 0.7 }} />
                <div style={{ width: `${(portfolioSummary.total_getilgtes_kapital / portfolioSummary.total_marktwert * 100).toFixed(1)}%`, background: "#D97706", opacity: 0.6 }} />
                <div className="flex-1" style={{ background: "#FEE2E2" }} />
              </>
            ) : (
              <div className="flex-1" style={{ background: "#F5F5F5" }} />
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Eigenkapital", value: fmtCurrency(portfolioSummary?.total_eingesetztes_eigenkapital ?? 0), color: "#A07830" },
              { label: "Wertzuwachs", value: fmtCurrency(Math.max(0, portfolioSummary?.total_wertentwicklung_eur ?? 0)), color: "#C9A86A" },
              { label: "Getilgt", value: fmtCurrency(portfolioSummary?.total_getilgtes_kapital ?? 0), color: "#D97706" },
              { label: "Restschuld", value: fmtCurrency(portfolioSummary?.total_restschuld ?? 0), color: "#B91C1C" },
            ].map(item => (
              <div key={item.label} className="rounded-[10px] p-3" style={{ background: "#F8F7F4", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="w-2 h-2 rounded-full mb-2" style={{ background: item.color }} />
                <p className="text-[10px] mb-0.5" style={{ color: "#9CA3AF" }}>{item.label}</p>
                <p className="text-[12px] font-semibold tabular-nums" style={{ color: "#101418" }}>{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Portfolio Ziel — dark gold */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36, duration: 0.28 }}
          className="rounded-[14px] p-6"
          style={{ background: "#A07830", boxShadow: "0 4px 24px rgba(160,120,48,0.25)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-semibold" style={{ color: "white" }}>Portfolio-Ziel</h3>
            <button className="text-[11px] font-semibold px-3 py-1.5 rounded-[8px] transition-all"
              style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
              + Ziel setzen
            </button>
          </div>

          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="flex-shrink-0">
              {(() => {
                const pct = portfolioSummary ? Math.min(100, (portfolioSummary.total_eingesetztes_eigenkapital / 500000) * 100) : 0;
                const r = 36, c = 44, stroke = 8;
                const circ = 2 * Math.PI * r;
                return (
                  <svg width="88" height="88" viewBox="0 0 88 88">
                    <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
                    <circle cx={c} cy={c} r={r} fill="none" stroke="white" strokeWidth={stroke}
                      strokeLinecap="round" strokeDasharray={circ}
                      strokeDashoffset={circ - (pct / 100) * circ}
                      transform={`rotate(-90 ${c} ${c})`} />
                    <text x={c} y={c - 4} textAnchor="middle" fill="white" fontSize="16" fontWeight="700">
                      {pct.toFixed(0)}%
                    </text>
                    <text x={c} y={c + 10} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8">
                      erreicht
                    </text>
                  </svg>
                );
              })()}
            </div>

            {/* Progress bars */}
            <div className="flex-1 space-y-3">
              {[
                { label: "Eigenkapital", value: fmtCurrency(portfolioSummary?.total_eingesetztes_eigenkapital ?? 0), pct: Math.min(100, ((portfolioSummary?.total_eingesetztes_eigenkapital ?? 0) / 500000) * 100) },
                { label: "Cashflow / Monat", value: fmtCurrency(totalCashflow ?? 0), pct: Math.min(100, ((totalCashflow ?? 0) / 5000) * 100) },
                { label: "Objekte", value: `${count} / 10`, pct: Math.min(100, count * 10) },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
                    <span className="text-[10px] font-semibold" style={{ color: "white" }}>{item.value}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: "rgba(255,255,255,0.9)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
