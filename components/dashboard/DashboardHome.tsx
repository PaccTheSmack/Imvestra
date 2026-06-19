"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Calculator,
  Buildings,
  ArrowRight,
  TrendUp,
  TrendDown,
  Warning,
  Bank,
  Sparkle,
  Tag,
  CheckCircle,
} from "@phosphor-icons/react";
import type { PortfolioSummary } from "@/lib/portfolio-calculations";
import { calculatePortfolioHealth } from "@/lib/portfolio-insights";
import PortfolioInsights from "@/components/dashboard/PortfolioInsights";
import FadeIn from "@/components/ui/FadeIn";
import UpgradeBanner from "@/components/dashboard/UpgradeBanner";
import CountUp from "@/components/ui/CountUp";
import { generateSmartTasks } from "@/lib/smart-tasks";
import { tokens } from "@/lib/tokens";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  ETW:     { bg: "rgba(0,224,215,0.08)",  text: "#00E0D7" },
  MFH:     { bg: "rgba(139,92,246,0.1)",  text: "#A78BFA" },
  EFH:     { bg: "rgba(0,224,215,0.06)",  text: "#00E0D7" },
  DHH:     { bg: "rgba(255,184,0,0.08)",  text: "#FFB800" },
  Gewerbe: { bg: "rgba(255,255,255,0.05)", text: "#888888" },
};

const TYPE_LABEL: Record<string, string> = {
  ETW: "Eigentumswohnung",
  MFH: "Mehrfamilienhaus",
  EFH: "Einfamilienhaus",
  DHH: "Doppelhaushälfte",
  Gewerbe: "Gewerbe",
};

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " €";
}
function fmtCurrencyCountUp(v: number) {
  return new Intl.NumberFormat("de-DE", { style: "decimal", maximumFractionDigits: 0 }).format(Math.round(v)) + " €";
}
function fmtPercent(n: number) {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n * 100) + " %";
}
function fmtPercentCountUp(v: number) {
  return (v * 100).toFixed(2).replace(".", ",") + " %";
}
function fmtSigned(n: number) {
  const f = fmtCurrency(Math.abs(n));
  return n >= 0 ? "+" + f : "−" + f;
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
  userId?: string;
  portfolioSummary?: PortfolioSummary;
}

function getGreeting(firstName: string) {
  const h = new Date().getHours();
  const g = h < 12 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
  return firstName ? `${g}, ${firstName}.` : `${g}.`;
}

function getDateLabel() {
  return new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function DashboardHome({
  firstName,
  isFreePlan,
  count,
  totalCashflow,
  avgNetYield,
  totalInvestment,
  recentProperties,
  financingAlertCount = 0,
  monthlyRentSoll = 0,
  monthlyRentIst = 0,
  overdueTasks = 0,
  userId,
  portfolioSummary,
}: DashboardHomeProps) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [smartNotifCount, setSmartNotifCount] = useState(0);
  const [showSmartNotif, setShowSmartNotif] = useState(false);
  const [ltvMounted, setLtvMounted] = useState(false);
  const [rentMounted, setRentMounted] = useState(false);

  useEffect(() => {
    if (!userId) return;
    generateSmartTasks(userId).then(({ created }) => {
      if (created > 0) {
        setSmartNotifCount(created);
        setShowSmartNotif(true);
        setTimeout(() => setShowSmartNotif(false), 8000);
      }
    });
  }, [userId]);

  // Trigger bar animations after mount
  useEffect(() => {
    const t1 = setTimeout(() => setLtvMounted(true), 400);
    const t2 = setTimeout(() => setRentMounted(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const hasPortfolio = portfolioSummary && portfolioSummary.anzahl_objekte > 0;
  const ltvPct = hasPortfolio
    ? Math.min(portfolioSummary!.total_fremdkapital_quote * 100, 100)
    : 0;
  const ltvColor = hasPortfolio
    ? portfolioSummary!.total_fremdkapital_quote > 0.8
      ? tokens.color.danger
      : portfolioSummary!.total_fremdkapital_quote > 0.6
      ? tokens.color.warning
      : tokens.color.accent
    : tokens.color.accent;

  const rentPct = monthlyRentSoll > 0
    ? Math.min((monthlyRentIst / monthlyRentSoll) * 100, 100)
    : 0;

  return (
    <div className="px-6 py-8 w-full max-w-[1280px]">

      {/* ── Header ── */}
      <FadeIn delay={0}>
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1
              className="text-[30px] font-semibold tracking-[-0.035em] leading-tight"
              style={{ color: tokens.color.text }}
            >
              {getGreeting(firstName)}
            </h1>
            <p className="text-sm mt-1" style={{ color: tokens.color.textSubtle }}>
              {getDateLabel()}
            </p>
          </div>

          {/* Status badge */}
          {financingAlertCount > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(255,184,0,0.1)", border: "1px solid rgba(255,184,0,0.2)", color: tokens.color.warning }}
            >
              <Bank size={12} />
              {financingAlertCount} Zinsbindung{financingAlertCount > 1 ? "en" : ""} läuft aus
            </motion.div>
          ) : overdueTasks > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: tokens.color.dangerBg, border: `1px solid rgba(255,68,68,0.2)`, color: tokens.color.danger }}
            >
              <Warning size={12} />
              {overdueTasks} überfällige Aufgabe{overdueTasks > 1 ? "n" : ""}
            </motion.div>
          ) : count > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: tokens.color.positiveBg, border: "1px solid rgba(34,197,94,0.2)", color: tokens.color.positive }}
            >
              <CheckCircle size={12} weight="fill" />
              Alles im Plan
            </motion.div>
          ) : null}
        </div>
      </FadeIn>

      {/* ── Hero KPI Card ── */}
      <FadeIn delay={0.04}>
        <div
          className="rounded-[18px] px-8 py-7 mb-4"
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3"
                style={{ color: tokens.color.textSubtle }}
              >
                Gesamtinvestition
              </p>
              <div
                className="text-[52px] font-semibold tracking-[-0.04em] leading-none tabular-nums"
                style={{ color: tokens.color.text }}
              >
                {totalInvestment != null ? (
                  <CountUp
                    to={totalInvestment}
                    formatter={fmtCurrencyCountUp}
                    duration={1.6}
                  />
                ) : (
                  <span style={{ color: tokens.color.textSubtle }}>—</span>
                )}
              </div>
            </div>

            {/* Right: sparkline if available */}
            {hasPortfolio && portfolioSummary!.wert_verlauf.length > 1 && (() => {
              const raw = portfolioSummary!.wert_verlauf;
              const step = Math.max(1, Math.floor(raw.length / 8));
              const data = raw.filter((_, i) => i % step === 0).slice(0, 8);
              if (data.length < 2) return null;
              const vals = data.map(d => d.wert);
              const min = Math.min(...vals);
              const max = Math.max(...vals);
              const range = max - min || 1;
              const W = 100; const H = 44;
              const pts = vals.map((v, i) => {
                const x = (i / (vals.length - 1)) * W;
                const y = H - ((v - min) / range) * (H - 8);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              });
              const linePath = `M ${pts.join(" L ")}`;
              const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;
              const isUp = vals[vals.length - 1] >= vals[0];
              const lineColor = isUp ? tokens.color.positive : tokens.color.danger;
              return (
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" className="flex-shrink-0 opacity-80">
                  <path d={areaPath} fill={isUp ? "rgba(34,197,94,0.06)" : "rgba(255,68,68,0.06)"} />
                  <path d={linePath} stroke={lineColor} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              );
            })()}
          </div>

          {/* Sub-metrics */}
          <div
            className="grid grid-cols-3 gap-6 mt-6 pt-6"
            style={{ borderTop: `1px solid ${tokens.color.border}` }}
          >
            {[
              {
                label: "Cashflow / Monat",
                value: totalCashflow,
                render: (v: number) => (
                  <CountUp
                    to={v}
                    formatter={fmtSignedCountUp}
                    duration={1.4}
                    className="text-base font-semibold tabular-nums"
                    style={{ color: v >= 0 ? tokens.color.positive : tokens.color.danger }}
                  />
                ),
                fallback: "—",
                icon: totalCashflow != null && totalCashflow >= 0
                  ? <TrendUp size={13} color={tokens.color.positive} />
                  : <TrendDown size={13} color={tokens.color.danger} />,
              },
              {
                label: "Ø Nettomietrendite",
                value: avgNetYield,
                render: (v: number) => (
                  <CountUp
                    to={v}
                    formatter={fmtPercentCountUp}
                    duration={1.4}
                    className="text-base font-semibold tabular-nums"
                    style={{ color: tokens.color.text }}
                  />
                ),
                fallback: "—",
                icon: null,
              },
              {
                label: "Objekte im Portfolio",
                value: count > 0 ? count : null,
                render: (v: number) => (
                  <CountUp
                    to={v}
                    formatter={(x) => String(Math.round(x))}
                    duration={1.0}
                    className="text-base font-semibold tabular-nums"
                    style={{ color: tokens.color.text }}
                  />
                ),
                fallback: "0",
                icon: null,
              },
            ].map(({ label, value, render, fallback, icon }) => (
              <div key={label}>
                <p className="text-[11px] mb-2" style={{ color: tokens.color.textSubtle }}>{label}</p>
                <div className="flex items-center gap-1.5">
                  {icon}
                  {value != null ? render(value) : (
                    <span className="text-base font-semibold tabular-nums" style={{ color: tokens.color.textSubtle }}>{fallback}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── Portfolio Snapshot (3 cards) ── */}
      {hasPortfolio && (
        <FadeIn delay={0.08}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Card 1: Portfoliowert */}
            <motion.div
              className="rounded-[16px] p-6 cursor-pointer"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
              }}
              whileHover={prefersReduced ? {} : {
                y: -3,
                borderColor: tokens.color.borderAccent,
                boxShadow: tokens.shadow.accent,
              }}
              whileTap={prefersReduced ? {} : { scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => router.push("/portfolio")}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-4" style={{ color: tokens.color.textSubtle }}>
                Portfoliowert
              </p>
              <p className="text-[28px] font-semibold tracking-[-0.03em] leading-none tabular-nums" style={{ color: tokens.color.text }}>
                <CountUp
                  to={portfolioSummary!.total_marktwert}
                  formatter={fmtCurrencyCountUp}
                  duration={1.5}
                />
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                {portfolioSummary!.total_wertentwicklung_eur >= 0 ? (
                  <>
                    <TrendUp size={13} color={tokens.color.accent} />
                    <span className="text-xs tabular-nums" style={{ color: tokens.color.accent }}>
                      {fmtSigned(portfolioSummary!.total_wertentwicklung_eur)}
                    </span>
                    <span className="text-[11px]" style={{ color: tokens.color.textSubtle }}>
                      ({fmtPercent(portfolioSummary!.total_wertentwicklung_pct)})
                    </span>
                  </>
                ) : (
                  <>
                    <TrendDown size={13} color={tokens.color.danger} />
                    <span className="text-xs tabular-nums" style={{ color: tokens.color.danger }}>
                      {fmtSigned(portfolioSummary!.total_wertentwicklung_eur)}
                    </span>
                  </>
                )}
              </div>
            </motion.div>

            {/* Card 2: Eigenkapital + LTV */}
            <motion.div
              className="rounded-[16px] p-6"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
              }}
              whileHover={prefersReduced ? {} : {
                y: -3,
                borderColor: tokens.color.borderAccent,
                boxShadow: tokens.shadow.accent,
              }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >

              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-4" style={{ color: tokens.color.textSubtle }}>
                Eigenkapital
              </p>
              <p className="text-[28px] font-semibold tracking-[-0.03em] leading-none tabular-nums" style={{ color: tokens.color.accent }}>
                <CountUp
                  to={portfolioSummary!.total_eigenkapital_aktuell}
                  formatter={fmtCurrencyCountUp}
                  duration={1.5}
                />
              </p>
              <div
                className="flex justify-between mt-4 pt-4 text-xs"
                style={{ borderTop: `1px solid ${tokens.color.border}` }}
              >
                <div>
                  <p style={{ color: tokens.color.textSubtle }}>Restschuld</p>
                  <p className="font-semibold mt-0.5 tabular-nums" style={{ color: tokens.color.danger }}>
                    {fmtCurrency(portfolioSummary!.total_restschuld)}
                  </p>
                </div>
                <div className="text-right">
                  <p style={{ color: tokens.color.textSubtle }}>Getilgt</p>
                  <p className="font-semibold mt-0.5 tabular-nums" style={{ color: tokens.color.accent }}>
                    {fmtCurrency(portfolioSummary!.total_getilgtes_kapital)}
                  </p>
                </div>
              </div>
              {/* LTV bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span style={{ color: tokens.color.textSubtle }}>LTV</span>
                  <span className="font-medium tabular-nums" style={{ color: ltvColor }}>
                    {fmtPercent(portfolioSummary!.total_fremdkapital_quote)}
                  </span>
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: tokens.color.surfaceActive }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: ltvMounted ? `${ltvPct}%` : 0 }}
                    transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    style={{ background: ltvColor }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Card 3: Cashflow + ROE */}
            <motion.div
              className="rounded-[16px] p-6 cursor-pointer"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
              }}
              whileHover={prefersReduced ? {} : {
                y: -3,
                borderColor: tokens.color.borderAccent,
                boxShadow: tokens.shadow.accent,
              }}
              whileTap={prefersReduced ? {} : { scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => router.push("/finanzen")}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-4" style={{ color: tokens.color.textSubtle }}>
                Cashflow / Monat
              </p>
              <p
                className="text-[28px] font-semibold tracking-[-0.03em] leading-none tabular-nums"
                style={{ color: portfolioSummary!.total_cashflow_monthly >= 0 ? tokens.color.positive : tokens.color.danger }}
              >
                <CountUp
                  to={portfolioSummary!.total_cashflow_monthly}
                  formatter={fmtSignedCountUp}
                  duration={1.5}
                />
              </p>
              <div
                className="grid grid-cols-2 gap-2 mt-4 pt-4"
                style={{ borderTop: `1px solid ${tokens.color.border}` }}
              >
                {[
                  {
                    label: "ROE",
                    value: fmtPercent(portfolioSummary!.portfolio_roe),
                    color: portfolioSummary!.portfolio_roe > 0.06
                      ? tokens.color.accent
                      : portfolioSummary!.portfolio_roe > 0.03
                      ? tokens.color.warning
                      : tokens.color.danger,
                  },
                  {
                    label: "Bruttorend.",
                    value: fmtPercent(portfolioSummary!.portfolio_brutto_rendite),
                    color: tokens.color.text,
                  },
                  {
                    label: "Objekte",
                    value: String(portfolioSummary!.anzahl_objekte),
                    color: tokens.color.text,
                  },
                  {
                    label: "Einheiten",
                    value: String(portfolioSummary!.anzahl_einheiten),
                    color: tokens.color.text,
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-[8px] px-3 py-2.5"
                    style={{ background: tokens.color.surfaceHover }}
                  >
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: tokens.color.textSubtle }}>{label}</p>
                    <p className="text-sm font-semibold mt-0.5 tabular-nums" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </FadeIn>
      )}

      {/* ── Mieteinnahmen-Bar ── */}
      {monthlyRentSoll > 0 && (
        <FadeIn delay={0.1}>
          <div
            className="rounded-[14px] px-6 py-5 mb-4 flex items-center justify-between gap-6"
            style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: tokens.color.textSubtle }}>
                  Mieteinnahmen {new Date().toLocaleDateString("de-DE", { month: "long" })}
                </p>
                <Link href="/finanzen" className="text-[11px] font-medium" style={{ color: tokens.color.accent }}>
                  Details →
                </Link>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: tokens.color.surfaceActive }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: rentMounted ? `${rentPct}%` : 0 }}
                  transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  style={{ background: monthlyRentIst >= monthlyRentSoll ? tokens.color.accent : tokens.color.warning }}
                />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-semibold tabular-nums" style={{ color: tokens.color.accent }}>
                {fmtCurrency(monthlyRentIst)}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: tokens.color.textSubtle }}>
                von {fmtCurrency(monthlyRentSoll)}
              </p>
            </div>
          </div>
        </FadeIn>
      )}

      {/* ── Smart tasks notification ── */}
      <AnimatePresence>
        {showSmartNotif && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden mb-4"
          >
            <div
              className="rounded-[12px] px-5 py-3.5 flex items-center justify-between"
              style={{ background: tokens.color.accentSubtle, border: `1px solid ${tokens.color.accentBorder}` }}
            >
              <div className="flex items-center gap-2.5">
                <Sparkle size={14} color={tokens.color.accent} weight="fill" />
                <span className="text-sm" style={{ color: tokens.color.text }}>
                  Imvestra hat {smartNotifCount} neue Aufgabe{smartNotifCount > 1 ? "n" : ""} für dich erstellt
                </span>
              </div>
              <Link href="/aufgaben" className="text-sm font-semibold" style={{ color: tokens.color.accent }}>
                Ansehen →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Alert card (financing / overdue) ── */}
      {(financingAlertCount > 0 || overdueTasks > 0) && (
        <FadeIn delay={0.11}>
          <motion.div
            className="rounded-[14px] px-5 py-5 mb-4 flex items-center gap-5 cursor-pointer"
            style={financingAlertCount > 0
              ? { background: "rgba(255,184,0,0.05)", border: "1px solid rgba(255,184,0,0.15)" }
              : { background: tokens.color.dangerBg, border: `1px solid rgba(255,68,68,0.15)` }
            }
            whileHover={prefersReduced ? {} : { y: -2 }}
            transition={{ duration: 0.18 }}
            onClick={() => router.push(financingAlertCount > 0 ? "/finanzen" : "/aufgaben")}
          >
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{
                background: financingAlertCount > 0
                  ? "rgba(255,184,0,0.12)"
                  : "rgba(255,68,68,0.12)",
              }}
            >
              {financingAlertCount > 0
                ? <Bank size={16} color={tokens.color.warning} />
                : <Warning size={16} color={tokens.color.danger} />
              }
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                {financingAlertCount > 0
                  ? `${financingAlertCount} Zinsbindung${financingAlertCount > 1 ? "en laufen" : " läuft"} bald aus`
                  : `${overdueTasks} überfällige Aufgabe${overdueTasks > 1 ? "n" : ""}`
                }
              </p>
              <p className="text-xs mt-0.5" style={{ color: tokens.color.textSubtle }}>
                {financingAlertCount > 0
                  ? "Jetzt Anschlussfinanzierung prüfen"
                  : "Aufgaben öffnen und abhaken"
                }
              </p>
            </div>
            <ArrowRight size={16} color={tokens.color.textSubtle} className="flex-shrink-0" />
          </motion.div>
        </FadeIn>
      )}

      {/* ── Quick Actions ── */}
      <FadeIn delay={0.13}>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3"
          style={{ color: tokens.color.textSubtle }}
        >
          {count === 0 ? "Womit möchtest du starten?" : "Schnellzugriff"}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">

          {/* Renditerechner */}
          <motion.div
            className="group rounded-[16px] p-6 h-full flex flex-col cursor-pointer"
            style={{
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
            }}
            whileHover={prefersReduced ? {} : {
              y: -3,
              borderColor: tokens.color.borderAccent,
              boxShadow: tokens.shadow.accent,
            }}
            whileTap={prefersReduced ? {} : { scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => router.push("/calculator")}
          >
            <div className="flex items-center justify-between mb-5">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: tokens.color.accentMuted }}
              >
                <Calculator size={16} color={tokens.color.accent} />
              </div>
              <ArrowRight
                size={15}
                color={tokens.color.accent}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 group-hover:translate-x-0.5"
              />
            </div>
            <p className="text-[14px] font-semibold mb-1.5 leading-tight" style={{ color: tokens.color.text }}>
              Renditerechner
            </p>
            <p className="text-[13px] leading-relaxed flex-1" style={{ color: tokens.color.textMuted }}>
              Kaufpreis, Miete und Fläche eingeben — sofort Cashflow und Rendite sehen.
            </p>
            <div
              className="mt-4 pt-3.5 flex items-center gap-1"
              style={{ borderTop: `1px solid ${tokens.color.border}` }}
            >
              <span className="text-[11px] font-medium" style={{ color: tokens.color.accent }}>Jetzt berechnen</span>
              <ArrowRight size={11} color={tokens.color.accent} className="group-hover:translate-x-0.5 transition-transform duration-150" />
            </div>
          </motion.div>

          {/* Portfolio */}
          <motion.div
            className="group rounded-[16px] p-6 h-full flex flex-col cursor-pointer"
            style={{
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
            }}
            whileHover={prefersReduced ? {} : {
              y: -3,
              borderColor: tokens.color.borderAccent,
              boxShadow: tokens.shadow.accent,
            }}
            whileTap={prefersReduced ? {} : { scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => router.push("/portfolio")}
          >
            <div className="flex items-center justify-between mb-5">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: tokens.color.accentMuted }}
              >
                <Buildings size={16} color={tokens.color.accent} />
              </div>
              <ArrowRight
                size={15}
                color={tokens.color.accent}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              />
            </div>
            <p className="text-[14px] font-semibold mb-1.5 leading-tight" style={{ color: tokens.color.text }}>
              Portfolio
            </p>
            <p className="text-[13px] leading-relaxed flex-1" style={{ color: tokens.color.textMuted }}>
              Alle gespeicherten Objekte im Überblick mit Gesamtperformance.
            </p>
            <div
              className="mt-4 pt-3.5 flex items-center gap-1"
              style={{ borderTop: `1px solid ${tokens.color.border}` }}
            >
              <span className="text-[11px] font-medium" style={{ color: tokens.color.accent }}>Portfolio öffnen</span>
              <ArrowRight size={11} color={tokens.color.accent} className="group-hover:translate-x-0.5 transition-transform duration-150" />
            </div>
          </motion.div>

          {/* Verhandlung */}
          <motion.div
            className="group rounded-[16px] p-6 h-full flex flex-col cursor-pointer"
            style={{
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
            }}
            whileHover={prefersReduced ? {} : {
              y: -3,
              borderColor: "rgba(139,92,246,0.3)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 4px 24px rgba(139,92,246,0.08)",
            }}
            whileTap={prefersReduced ? {} : { scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => router.push("/verhandlung")}
          >
            <div className="flex items-center justify-between mb-5">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: "rgba(139,92,246,0.1)" }}
              >
                <Tag size={16} color="#A78BFA" />
              </div>
              <ArrowRight
                size={15}
                color="#A78BFA"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              />
            </div>
            <p className="text-[14px] font-semibold mb-1.5 leading-tight" style={{ color: tokens.color.text }}>
              Verhandlungsrechner
            </p>
            <p className="text-[13px] leading-relaxed flex-1" style={{ color: tokens.color.textMuted }}>
              Optimalen Kaufpreis ermitteln — basierend auf Rendite und Finanzierungszielen.
            </p>
            <div
              className="mt-4 pt-3.5 flex items-center gap-1"
              style={{ borderTop: `1px solid ${tokens.color.border}` }}
            >
              <span className="text-[11px] font-medium" style={{ color: "#A78BFA" }}>Preis ermitteln</span>
              <ArrowRight size={11} color="#A78BFA" className="group-hover:translate-x-0.5 transition-transform duration-150" />
            </div>
          </motion.div>
        </div>
      </FadeIn>

      {/* ── Empty state demo ── */}
      {count === 0 && (
        <FadeIn delay={0.18}>
          <div
            className="rounded-[16px] p-7 mb-8"
            style={{
              background: tokens.color.bgSubtle,
              border: `1px dashed ${tokens.color.borderStrong}`,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-[0.08em]"
                style={{ background: tokens.color.surfaceHover, color: tokens.color.textMuted }}
              >
                Beispiel
              </span>
              <button
                onClick={() => router.push("/calculator")}
                className="text-sm font-medium"
                style={{ color: tokens.color.accent }}
              >
                Eigenes Objekt berechnen →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className="rounded-[12px] p-5"
                style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
              >
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>Altbauwohnung Goslar</p>
                    <p className="text-xs mt-0.5" style={{ color: tokens.color.textMuted }}>185.000 € · 68 m²</p>
                  </div>
                  <span
                    className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                    style={{ background: tokens.color.positiveBg, color: tokens.color.positive }}
                  >
                    Positiver Cashflow
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "BRUTTORENDITE", value: "5,51 %", color: tokens.color.positive },
                    { label: "CASHFLOW/MO.", value: "+148 €", color: tokens.color.positive },
                    { label: "NETTOMIETRENDIT.", value: "4,12 %", color: tokens.color.positive },
                    { label: "LTV", value: "72 %", color: tokens.color.text },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-[8px] px-3 py-2.5" style={{ background: tokens.color.surfaceHover }}>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: tokens.color.textSubtle }}>{label}</p>
                      <p className="text-sm font-semibold mt-0.5 tabular-nums" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center gap-6 pl-2">
                {[
                  { n: 1, title: "Objektdaten eingeben", body: "Kaufpreis, Wohnfläche, Miete und Finanzierung." },
                  { n: 2, title: "Kennzahlen sofort sehen", body: "Rendite, Cashflow, ROE und LTV werden live berechnet." },
                  { n: 3, title: "Speichern und exportieren", body: "Objekt ins Portfolio aufnehmen oder als PDF exportieren." },
                ].map(({ n, title, body }) => (
                  <div key={n} className="flex items-start gap-4">
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: tokens.color.accentMuted, border: `1px solid ${tokens.color.borderAccent}` }}
                    >
                      <span className="text-xs font-semibold tabular-nums" style={{ color: tokens.color.accent }}>{n}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>{title}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: tokens.color.textMuted }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* ── Recent Properties ── */}
      {count > 0 && recentProperties.length > 0 && (
        <FadeIn delay={0.18}>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: tokens.color.textSubtle }}
              >
                Zuletzt hinzugefügt
              </p>
              <button
                onClick={() => router.push("/portfolio")}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: tokens.color.accent }}
              >
                Alle ansehen <ArrowRight size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {recentProperties.map((p, i) => {
                const colors = TYPE_COLORS[p.type] ?? TYPE_COLORS.ETW;
                const positive = p.cashflow_monthly >= 0;
                return (
                  <motion.div
                    key={p.id}
                    className="group rounded-[12px] px-5 py-4 flex items-center justify-between cursor-pointer"
                    style={{
                      background: tokens.color.surface,
                      border: `1px solid ${tokens.color.border}`,
                    }}
                    initial={prefersReduced ? {} : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    whileHover={prefersReduced ? {} : {
                      borderColor: tokens.color.borderAccent,
                      x: 2,
                    }}
                    whileTap={prefersReduced ? {} : { scale: 0.99 }}
                    onClick={() => router.push("/portfolio")}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                        style={{ background: colors.bg }}
                      >
                        <Buildings size={16} color={colors.text} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: tokens.color.text }}>{p.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: tokens.color.textSubtle }}>
                          {TYPE_LABEL[p.type] ?? p.type}{p.sqm > 0 && ` · ${p.sqm} m²`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-[11px]" style={{ color: tokens.color.textSubtle }}>Bruttorendite</p>
                        <p className="text-[13px] font-semibold tabular-nums" style={{ color: tokens.color.accent }}>
                          {fmtPercent(p.gross_yield)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px]" style={{ color: tokens.color.textSubtle }}>Cashflow / Mo.</p>
                        <p className="text-[13px] font-semibold tabular-nums" style={{ color: positive ? tokens.color.positive : tokens.color.danger }}>
                          {fmtSigned(p.cashflow_monthly)}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[11px]" style={{ color: tokens.color.textSubtle }}>Kaufpreis</p>
                        <p className="text-[13px] font-semibold tabular-nums" style={{ color: tokens.color.text }}>
                          {fmtCurrency(p.purchase_price)}
                        </p>
                      </div>
                      <ArrowRight size={14} color={tokens.color.textSubtle} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* ── Portfolio Intelligence ── */}
      {hasPortfolio && portfolioSummary && (() => {
        const { score, insights } = calculatePortfolioHealth(portfolioSummary, financingAlertCount);
        return (
          <FadeIn delay={0.22}>
            <div className="mb-8">
              <PortfolioInsights score={score} insights={insights} />
            </div>
          </FadeIn>
        );
      })()}

      {/* ── Upgrade Banner ── */}
      {isFreePlan && (
        <FadeIn delay={0.25}>
          <div className="mt-2">
            <UpgradeBanner currentPlan="free" />
          </div>
        </FadeIn>
      )}

    </div>
  );
}
