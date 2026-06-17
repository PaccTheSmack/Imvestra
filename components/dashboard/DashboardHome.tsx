"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Calculator,
  Buildings,
  MapPin,
  ArrowUpRight,
  ArrowRight,
  TrendUp,
  TrendDown,
  CurrencyEur,
  ChartLine,
  Warning,
  Bank,
  Sparkle,
  Question,
} from "@phosphor-icons/react";
import type { PortfolioSummary } from "@/lib/portfolio-calculations";
import FadeIn from "@/components/ui/FadeIn";
import HoverCard from "@/components/ui/HoverCard";
import UpgradeBanner from "@/components/dashboard/UpgradeBanner";
import { generateSmartTasks } from "@/lib/smart-tasks";
import { tokens } from "@/lib/tokens";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  ETW:     { bg: "rgba(0,224,215,0.08)",  text: "#00E0D7" },
  MFH:     { bg: "rgba(139,92,246,0.1)",   text: "#A78BFA" },
  EFH:     { bg: "rgba(0,224,215,0.06)",  text: "#00E0D7" },
  DHH:     { bg: "rgba(255,184,0,0.08)",   text: "#FFB800" },
  Gewerbe: { bg: "rgba(255,255,255,0.05)", text: "#888888" },
};

const TYPE_LABEL: Record<string, string> = {
  ETW: "Eigentumswohnung",
  MFH: "Mehrfamilienhaus",
  EFH: "Einfamilienhaus",
  DHH: "Doppelhaushälfte",
  Gewerbe: "Gewerbe",
};

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
  highPriorityTasks?: number;
  userId?: string;
  portfolioSummary?: PortfolioSummary;
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " €";
}
function fmtPercent(n: number) {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n * 100) + " %";
}
function fmtSigned(n: number) {
  const f = fmtCurrency(Math.abs(n));
  return n >= 0 ? "+" + f : "-" + f;
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
  highPriorityTasks = 0,
  userId,
  portfolioSummary,
}: DashboardHomeProps) {
  const router = useRouter();
  const [smartNotifCount, setSmartNotifCount] = useState(0);
  const [showSmartNotif, setShowSmartNotif] = useState(false);

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

  const statCards = [
    {
      label: "Objekte",
      value: String(count),
      sub: "Im Portfolio",
      Icon: Buildings,
      signed: null as number | null,
    },
    {
      label: "Cashflow / Monat",
      value: totalCashflow != null ? fmtSigned(totalCashflow) : "-",
      sub: "Netto gesamt",
      Icon: ChartLine,
      signed: totalCashflow,
    },
    {
      label: "Ø Nettomietrendite",
      value: avgNetYield != null ? fmtPercent(avgNetYield) : "-",
      sub: "Durchschnitt",
      Icon: TrendUp,
      signed: null,
    },
    {
      label: "Gesamtinvestition",
      value: totalInvestment != null ? fmtCurrency(totalInvestment) : "-",
      sub: "Alle Objekte",
      Icon: CurrencyEur,
      signed: null,
    },
  ];

  return (
    <div className="px-6 py-6 w-full">
      {/* Header */}
      <FadeIn delay={0}>
        <div className="mb-8">
          <h1
            className="text-[22px] font-semibold tracking-[-0.02em]"
            style={{ color: tokens.color.text }}
          >
            {(() => {
              const h = new Date().getHours();
              const g = h < 12 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
              return `${g}${firstName ? `, ${firstName}` : ""}.`;
            })()}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: tokens.color.textMuted }}>
            Hier ist deine Übersicht.
          </p>
        </div>
      </FadeIn>

      {/* Stat cards */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, sub, Icon, signed }) => (
            <HoverCard key={label} intensity={3} className="h-full">
              <div
                className="rounded-[12px] px-5 py-4 h-full"
                style={{
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="text-[10px] font-medium uppercase tracking-wider"
                    style={{ color: tokens.color.textSubtle }}
                  >
                    {label}
                  </p>
                  <div
                    className="w-7 h-7 rounded-[7px] flex items-center justify-center"
                    style={{ background: tokens.color.surfaceHover }}
                  >
                    <Icon size={13} color={tokens.color.textSubtle} />
                  </div>
                </div>
                <p
                  className="text-2xl font-semibold tracking-tight"
                  style={{
                    color:
                      signed != null
                        ? signed >= 0
                          ? tokens.color.positive
                          : tokens.color.danger
                        : tokens.color.text,
                  }}
                >
                  {value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: tokens.color.textSubtle }}>
                  {sub}
                </p>
              </div>
            </HoverCard>
          ))}
        </div>
      </FadeIn>

      {/* Portfolio Snapshot */}
      {portfolioSummary && portfolioSummary.anzahl_objekte > 0 && (
        <FadeIn delay={0.08}>
          <p className="text-[10px] text-[#555] uppercase tracking-widest font-semibold mt-6 mb-3">
            Portfolio Snapshot
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {/* CARD 1 – Portfoliowert */}
            <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 hover:border-[rgba(0,224,215,0.15)] transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-2">
                    <p className="text-[10px] text-[#555] uppercase tracking-widest">Portfoliowert</p>
                    <Question size={11} color="#444" />
                  </div>
                  <p className="text-[26px] font-semibold text-white tracking-[-0.02em]">
                    {fmtCurrency(portfolioSummary.total_marktwert)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {portfolioSummary.total_wertentwicklung_eur >= 0 ? (
                      <>
                        <TrendUp size={13} color="#00E0D7" />
                        <span className="text-xs text-[#00E0D7]">{fmtSigned(portfolioSummary.total_wertentwicklung_eur)}</span>
                        <span className="text-[10px] text-[#555]">({fmtPercent(portfolioSummary.total_wertentwicklung_pct)})</span>
                      </>
                    ) : (
                      <>
                        <TrendDown size={13} color="#FF4444" />
                        <span className="text-xs text-[#FF4444]">{fmtSigned(portfolioSummary.total_wertentwicklung_eur)}</span>
                        <span className="text-[10px] text-[#555]">({fmtPercent(portfolioSummary.total_wertentwicklung_pct)})</span>
                      </>
                    )}
                  </div>
                </div>
                {/* Sparkline */}
                {portfolioSummary.wert_verlauf.length > 1 && (() => {
                  const raw = portfolioSummary.wert_verlauf;
                  const step = Math.max(1, Math.floor(raw.length / 6));
                  const data = raw.filter((_, i) => i % step === 0).slice(0, 6);
                  if (data.length < 2) return null;
                  const vals = data.map(d => d.wert);
                  const min = Math.min(...vals);
                  const max = Math.max(...vals);
                  const range = max - min || 1;
                  const pts = vals.map((v, i) => {
                    const x = (i / (vals.length - 1)) * 60;
                    const y = 32 - ((v - min) / range) * 28;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  });
                  const linePath = `M ${pts.join(" L ")}`;
                  const areaPath = `${linePath} L 60,32 L 0,32 Z`;
                  return (
                    <svg width="60" height="32" viewBox="0 0 60 32" fill="none" className="flex-shrink-0 ml-2">
                      <path d={areaPath} fill="rgba(0,224,215,0.08)" />
                      <path d={linePath} stroke="#00E0D7" strokeWidth="1.5" fill="none" />
                    </svg>
                  );
                })()}
              </div>
            </div>

            {/* CARD 2 – Eigenkapital & Schulden */}
            <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 hover:border-[rgba(0,224,215,0.15)] transition-all">
              <div className="flex items-center gap-1 mb-2">
                <p className="text-[10px] text-[#555] uppercase tracking-widest">Eigenkapital</p>
              </div>
              <p className="text-[26px] font-semibold tracking-[-0.02em] text-[#00E0D7]">
                {fmtCurrency(portfolioSummary.total_eigenkapital_aktuell)}
              </p>
              <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)] flex justify-between">
                <div>
                  <p className="text-[10px] text-[#555]">Restschuld</p>
                  <p className="text-sm font-semibold text-[#FF4444]">{fmtCurrency(portfolioSummary.total_restschuld)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#555]">Getilgt</p>
                  <p className="text-sm font-semibold text-[#00E0D7]">{fmtCurrency(portfolioSummary.total_getilgtes_kapital)}</p>
                </div>
              </div>
              {/* LTV bar */}
              <div className="mt-3">
                <p className="text-[10px] text-[#555] mb-1.5">
                  LTV: {fmtPercent(portfolioSummary.total_fremdkapital_quote)}
                </p>
                <div className="bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(portfolioSummary.total_fremdkapital_quote * 100, 100)}%`,
                      background: portfolioSummary.total_fremdkapital_quote > 0.8
                        ? "#FF4444"
                        : portfolioSummary.total_fremdkapital_quote > 0.6
                        ? "#FFB800"
                        : "#00E0D7",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* CARD 3 – Cashflow & Rendite */}
            <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 hover:border-[rgba(0,224,215,0.15)] transition-all flex flex-col">
              <div className="flex items-center gap-1 mb-2">
                <p className="text-[10px] text-[#555] uppercase tracking-widest">Cashflow / Monat</p>
              </div>
              <p
                className="text-[26px] font-semibold tracking-[-0.02em]"
                style={{ color: portfolioSummary.total_cashflow_monthly >= 0 ? "#00E0D7" : "#FF4444" }}
              >
                {fmtSigned(portfolioSummary.total_cashflow_monthly)}
              </p>
              <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)] grid grid-cols-2 gap-2">
                {[
                  {
                    label: "ROE",
                    value: fmtPercent(portfolioSummary.portfolio_roe),
                    color: portfolioSummary.portfolio_roe > 0.06 ? "#00E0D7" : portfolioSummary.portfolio_roe > 0.03 ? "#FFB800" : "#FF4444",
                  },
                  {
                    label: "Brutto",
                    value: fmtPercent(portfolioSummary.portfolio_brutto_rendite),
                    color: "#fff",
                  },
                  {
                    label: "Objekte",
                    value: String(portfolioSummary.anzahl_objekte),
                    color: "#fff",
                  },
                  {
                    label: "Einheiten",
                    value: String(portfolioSummary.anzahl_einheiten),
                    color: "#fff",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#0C0C0C] rounded-[8px] px-3 py-2">
                    <p className="text-[9px] text-[#444] uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={() => router.push("/portfolio")}
                  className="text-xs text-[#00E0D7] flex items-center gap-1 hover:gap-2 transition-all duration-150"
                >
                  Portfolio öffnen →
                </button>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Mini cashflow widget */}
      {monthlyRentSoll > 0 && (
        <FadeIn delay={0.07}>
          <div
            className="rounded-[12px] px-5 py-4 mb-4 flex items-center justify-between"
            style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: "#777" }}>
                Mieteinnahmen{" "}
                {new Date().toLocaleDateString("de-DE", { month: "long" })}
              </p>
              <div className="w-48 rounded-full overflow-hidden" style={{ background: "#1A1A1A", height: 6 }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((monthlyRentIst / monthlyRentSoll) * 100, 100)}%`,
                    background: monthlyRentIst >= monthlyRentSoll ? "#00E0D7" : "#FFB800",
                  }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold" style={{ color: "#00E0D7" }}>{fmtCurrency(monthlyRentIst)}</p>
              <p className="text-[10px]" style={{ color: "#666" }}>von {fmtCurrency(monthlyRentSoll)}</p>
              <Link href="/finanzen" className="text-[10px] mt-1 block" style={{ color: "#00E0D7" }}>
                Details →
              </Link>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Smart tasks notification */}
      <AnimatePresence>
        {showSmartNotif && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-[10px] px-4 py-3 mb-4 flex items-center justify-between"
            style={{ background: "rgba(0,224,215,0.06)", border: "1px solid rgba(0,224,215,0.12)" }}
          >
            <div className="flex items-center gap-2">
              <Sparkle size={14} color="#00E0D7" weight="fill" />
              <span className="text-xs" style={{ color: tokens.color.text }}>
                Imvestra hat {smartNotifCount} neue Aufgabe{smartNotifCount > 1 ? "n" : ""} für dich erstellt
              </span>
            </div>
            <Link href="/aufgaben" className="text-xs font-medium" style={{ color: "#00E0D7" }}>
              Anzeigen →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task alert widget */}
      {(overdueTasks > 0 || highPriorityTasks > 0) && (
        <FadeIn delay={0.09}>
          <div
            className="rounded-[12px] px-5 py-3.5 mb-4 flex items-center justify-between"
            style={{ background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.1)" }}
          >
            <div className="flex items-center gap-3">
              <Warning size={16} color="#FF4444" />
              <div>
                <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
                  {overdueTasks > 0
                    ? `${overdueTasks} überfällige Aufgabe${overdueTasks > 1 ? "n" : ""}`
                    : `${highPriorityTasks} Aufgabe${highPriorityTasks > 1 ? "n" : ""} mit hoher Priorität`
                  }
                </p>
                {overdueTasks > 0 && highPriorityTasks > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: "#777" }}>
                    und {highPriorityTasks} mit hoher Priorität
                  </p>
                )}
              </div>
            </div>
            <Link href="/aufgaben" className="text-xs font-medium" style={{ color: "#FF4444" }}>
              Anzeigen →
            </Link>
          </div>
        </FadeIn>
      )}

      {/* Financing alert banner */}
      {financingAlertCount > 0 && (
        <FadeIn delay={0.08}>
          <div
            className="rounded-[14px] px-5 py-4 mb-6 flex items-center justify-between gap-4"
            style={{ background: "rgba(255,184,0,0.06)", border: "1px solid rgba(255,184,0,0.15)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,184,0,0.1)" }}
              >
                <Bank size={15} color="#FFB800" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                  {financingAlertCount} Zinsbindung{financingAlertCount > 1 ? "en laufen" : " lauft"} bald aus
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#666" }}>
                  Jetzt Anschlussfinanzierung prufen.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/finanzen")}
              className="text-xs font-semibold px-3 py-1.5 rounded-[8px] flex-shrink-0 flex items-center gap-1.5 transition-colors"
              style={{ background: "rgba(255,184,0,0.12)", color: "#FFB800" }}
            >
              <Warning size={12} />
              Ansehen
            </button>
          </div>
        </FadeIn>
      )}

      {/* Feature tiles */}
      <FadeIn delay={0.1}>
        <p className="text-xs font-medium mb-4" style={{ color: tokens.color.textSubtle }}>
          {count === 0 ? "Womit möchtest du starten?" : "Schnellzugriff"}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Rechner */}
          <HoverCard intensity={5} className="h-full">
            <div
              className="group rounded-[16px] p-6 h-full flex flex-col cursor-pointer transition-all duration-200"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = tokens.color.borderAccent;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = tokens.color.border;
              }}
              onClick={() => router.push("/calculator")}
            >
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                  style={{ background: tokens.color.accentMuted }}
                >
                  <Calculator size={20} color={tokens.color.accent} />
                </div>
                <ArrowUpRight size={16} color={tokens.color.textSubtle} className="group-hover:!text-accent transition-colors" />
              </div>
              <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                Renditerechner
              </p>
              <p className="text-sm mt-1.5 leading-relaxed flex-1" style={{ color: tokens.color.textMuted }}>
                Kaufpreis, Miete und Fläche eingeben - sofort Cashflow und Rendite sehen.
              </p>
              <div
                className="mt-5 pt-4"
                style={{ borderTop: `1px solid ${tokens.color.border}` }}
              >
                <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
                  Bruttorendite · Cashflow · Maximalpreis berechnen
                </p>
              </div>
            </div>
          </HoverCard>

          {/* Portfolio */}
          <HoverCard intensity={5} className="h-full">
            <div
              className="group rounded-[16px] p-6 h-full flex flex-col cursor-pointer transition-all duration-200"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = tokens.color.borderAccent;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = tokens.color.border;
              }}
              onClick={() => router.push("/portfolio")}
            >
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                  style={{ background: tokens.color.accentMuted }}
                >
                  <Buildings size={20} color={tokens.color.accent} />
                </div>
                <ArrowUpRight size={16} color={tokens.color.textSubtle} />
              </div>
              <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                Portfolio
              </p>
              <p className="text-sm mt-1.5 leading-relaxed flex-1" style={{ color: tokens.color.textMuted }}>
                Alle gespeicherten Objekte im Überblick mit Gesamtperformance.
              </p>
              <div
                className="mt-5 pt-4"
                style={{ borderTop: `1px solid ${tokens.color.border}` }}
              >
                <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
                  Cashflow · Rendite · Gesamtinvestition
                </p>
              </div>
            </div>
          </HoverCard>

          {/* Standortanalyse */}
          <HoverCard intensity={2} className="h-full">
            <div
              className="rounded-[16px] p-6 h-full flex flex-col cursor-default transition-all duration-200"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                opacity: 0.7,
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                  style={{ background: "rgba(0,224,215,0.08)" }}
                >
                  <MapPin size={20} color={tokens.color.accent} />
                </div>
                <span
                  className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: tokens.color.surfaceHover, color: tokens.color.textSubtle }}
                >
                  Bald
                </span>
              </div>
              <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                Standortanalyse
              </p>
              <p className="text-sm mt-1.5 leading-relaxed flex-1" style={{ color: tokens.color.textMuted }}>
                Marktdaten, Durchschnittsmieten und Kaufpreisfaktoren per PLZ.
              </p>
              <div
                className="mt-5 pt-4"
                style={{ borderTop: `1px solid ${tokens.color.border}` }}
              >
                <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
                  Bald verfügbar
                </p>
              </div>
            </div>
          </HoverCard>
        </div>
      </FadeIn>

      {/* Demo section – empty state */}
      {count === 0 && (
        <FadeIn delay={0.18}>
          <div
            className="rounded-[16px] p-6 mb-8"
            style={{
              background: tokens.color.bgSubtle,
              border: `1px dashed ${tokens.color.borderStrong}`,
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wide"
                style={{ background: tokens.color.surfaceHover, color: tokens.color.textMuted }}
              >
                Beispiel
              </span>
              <button
                onClick={() => router.push("/calculator")}
                className="text-xs font-medium hover:underline"
                style={{ color: tokens.color.accent }}
              >
                Eigenes Objekt berechnen
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Demo property card */}
              <div
                className="rounded-[12px] p-5"
                style={{
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                      Altbauwohnung Goslar
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: tokens.color.textMuted }}>
                      Kaufpreis: 185.000 € · 68 m²
                    </p>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: tokens.color.positiveBg, color: tokens.color.positive }}
                  >
                    Positiver Cashflow
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { label: "BRUTTORENDITE",    value: "5,51 %", positive: true },
                    { label: "CASHFLOW/MO.",     value: "+148 €", positive: true },
                    { label: "NETTOMIETRENDIT.", value: "4,12 %", positive: true },
                    { label: "LTV",              value: "72 %",   positive: false },
                  ].map(({ label, value, positive }) => (
                    <div
                      key={label}
                      className="rounded-[8px] px-3 py-2.5"
                      style={{
                        background: tokens.color.surfaceHover,
                        border: `1px solid ${tokens.color.border}`,
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: tokens.color.textSubtle }}>
                        {label}
                      </p>
                      <p
                        className="text-sm font-semibold mt-0.5"
                        style={{ color: positive ? tokens.color.positive : tokens.color.text }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-4 pt-4 flex flex-col gap-1.5"
                  style={{ borderTop: `1px solid ${tokens.color.border}` }}
                >
                  {[
                    { label: "Gesamtinvestition", value: "203.500 €", positive: false },
                    { label: "Eff. Jahresmiete",  value: "9.720 €",   positive: false },
                    { label: "NOI",               value: "7.596 €",   positive: false },
                    { label: "Cashflow / Jahr",   value: "+1.776 €",  positive: true  },
                  ].map(({ label, value, positive }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span style={{ color: tokens.color.textMuted }}>{label}</span>
                      <span
                        className="font-medium"
                        style={{ color: positive ? tokens.color.positive : tokens.color.text }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div className="flex flex-col justify-center gap-5 pl-2">
                {[
                  { n: 1, title: "Objektdaten eingeben",     body: "Kaufpreis, Wohnfläche, Miete und Finanzierung." },
                  { n: 2, title: "Kennzahlen sofort sehen",  body: "Rendite, Cashflow, ROE und LTV werden live berechnet." },
                  { n: 3, title: "Speichern und exportieren",body: "Objekt ins Portfolio aufnehmen oder als PDF exportieren." },
                ].map(({ n, title, body }) => (
                  <div key={n} className="flex items-start gap-4">
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: tokens.color.accentMuted, border: `1px solid ${tokens.color.borderAccent}` }}
                    >
                      <span className="text-xs font-semibold" style={{ color: tokens.color.accent }}>
                        {n}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                        {title}
                      </p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: tokens.color.textMuted }}>
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Recent objects */}
      {count > 0 && (
        <FadeIn delay={0.18}>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                Zuletzt hinzugefügt
              </h2>
              <button
                onClick={() => router.push("/portfolio")}
                className="text-xs font-medium flex items-center gap-1 transition-colors duration-150"
                style={{ color: tokens.color.accent }}
              >
                Alle ansehen
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {recentProperties.map((p) => {
                const colors = TYPE_COLORS[p.type] ?? TYPE_COLORS.ETW;
                const positive = p.cashflow_monthly >= 0;
                return (
                  <div
                    key={p.id}
                    className="rounded-[12px] px-5 py-4 flex items-center justify-between"
                    style={{
                      background: tokens.color.surface,
                      border: `1px solid ${tokens.color.border}`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
                        style={{ background: colors.bg }}
                      >
                        <Buildings size={16} color={colors.text} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
                          {p.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: tokens.color.textSubtle }}>
                          {TYPE_LABEL[p.type] ?? p.type}
                          {p.sqm > 0 && ` · ${p.sqm} m²`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-right">
                      <div>
                        <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
                          Bruttorendite
                        </p>
                        <p className="text-sm font-semibold" style={{ color: tokens.color.accent }}>
                          {fmtPercent(p.gross_yield)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
                          Cashflow / Mo.
                        </p>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: positive ? tokens.color.positive : tokens.color.danger }}
                        >
                          {fmtSigned(p.cashflow_monthly)}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
                          Kaufpreis
                        </p>
                        <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                          {fmtCurrency(p.purchase_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Upgrade banner */}
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
