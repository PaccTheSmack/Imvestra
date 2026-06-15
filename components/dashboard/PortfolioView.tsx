"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  Buildings,
  Calculator,
  ArrowRight,
  ChartLine,
  CurrencyEur,
  FilePdf,
  MapPin,
  TrendUp,
  ShieldCheck,
  UsersFour,
} from "@phosphor-icons/react";
import HoverCard from "@/components/ui/HoverCard";
import GateOverlay from "@/components/ui/GateOverlay";
import { formatCurrency, formatPercent, formatCurrencySigned } from "@/lib/format";
import { tokens } from "@/lib/tokens";
import type { Plan } from "@/types";

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ETW:     { bg: "rgba(0,200,150,0.1)",   text: tokens.color.accent,  border: "rgba(0,200,150,0.2)" },
  MFH:     { bg: "rgba(139,92,246,0.1)",   text: "#A78BFA",            border: "rgba(139,92,246,0.2)" },
  EFH:     { bg: "rgba(0,200,150,0.08)",  text: tokens.color.accent,  border: "rgba(0,200,150,0.15)" },
  DHH:     { bg: "rgba(251,146,60,0.1)",   text: "#FB923C",            border: "rgba(251,146,60,0.2)" },
  Gewerbe: { bg: "rgba(255,255,255,0.06)", text: tokens.color.textMuted, border: tokens.color.border },
};

export interface PortfolioCard {
  id: string;
  name: string;
  address: string;
  type: string;
  sqm: number;
  purchase_price: number;
  gross_yield: number;
  net_yield: number;
  cashflow_monthly: number;
  ltv: number;
  total_investment: number;
}

interface PortfolioViewProps {
  properties: PortfolioCard[];
  totalCashflow: number;
  totalInvestment: number;
  avgGrossYield: number;
  plan: Plan;
  tenantsByProperty?: Record<string, { count: number; totalRent: number }>;
  financingAlertsByProperty?: Record<string, "critical" | "warning">;
}

function Sparkline() {
  return (
    <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
      <polyline
        points="2,13 10,9 20,11 30,5 38,2"
        stroke={tokens.color.positive}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const DEMO_ROWS = [
  { name: "Altbauwohnung Goslar",     type: "ETW", cashflow: "+148 €" },
  { name: "Mehrfamilienhaus Leipzig", type: "MFH", cashflow: "+512 €" },
  { name: "ETW München",              type: "ETW", cashflow: "+232 €" },
];

const FEATURES = [
  { Icon: ChartLine,   title: "Gesamtperformance",  body: "Rendite und Cashflow aller Objekte summiert." },
  { Icon: CurrencyEur, title: "Cashflow-Tracking",  body: "Monatlicher Netto-Cashflow nach allen Kosten." },
  { Icon: Buildings,   title: "Objekt-Vergleich",   body: "Welches Objekt performt am besten?" },
  { Icon: FilePdf,     title: "PDF-Export",         body: "Bankpräsentation für jedes Objekt in Sekunden." },
];

const BOTTOM_STATS = [
  { value: "10 %",    label: "Ø Bruttorendite in Deutschland" },
  { value: "3 %",     label: "Leerstandsrisiko einkalkuliert" },
  { value: "10 €/m²", label: "Instandhaltung pro Jahr" },
];

export default function PortfolioView({
  properties,
  totalCashflow,
  totalInvestment,
  avgGrossYield,
  plan,
  tenantsByProperty = {},
  financingAlertsByProperty = {},
}: PortfolioViewProps) {
  const prefersReduced = useReducedMotion();
  const count = properties.length;

  if (count === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: tokens.color.bg }}>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
          {/* Left */}
          <div
            className="flex flex-col justify-center px-12 py-16"
            style={{
              background: tokens.color.bgSubtle,
              borderRight: `1px solid ${tokens.color.border}`,
            }}
          >
            <span
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6 self-start"
              style={{ background: tokens.color.accentMuted, color: tokens.color.accent }}
            >
              <ChartLine size={12} />
              Portfolio-Ubersicht
            </span>

            <h1
              className="text-[40px] font-semibold tracking-[-0.03em] leading-[1.1]"
              style={{ color: tokens.color.text }}
            >
              Dein Portfolio<br />wartet.
            </h1>

            <p className="mt-4 text-base leading-relaxed max-w-[380px]" style={{ color: tokens.color.textMuted }}>
              Berechne dein erstes Objekt und speichere es hier.
              Alle Kennzahlen auf einen Blick.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              {FEATURES.map(({ Icon, title, body }) => (
                <div key={title} className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
                    style={{ background: tokens.color.surface }}
                  >
                    <Icon size={16} color={tokens.color.textMuted} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>{title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: tokens.color.textSubtle }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link href="/calculator">
                <motion.span
                  whileHover={prefersReduced ? {} : { scale: 1.02 }}
                  whileTap={prefersReduced ? {} : { scale: 0.97 }}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-[10px] transition-all"
                  style={{
                    background: tokens.color.accent,
                    color: tokens.color.bg,
                    boxShadow: tokens.shadow.accent,
                  }}
                >
                  Erstes Objekt berechnen
                  <ArrowRight size={15} />
                </motion.span>
              </Link>
              <p className="text-xs mt-3" style={{ color: tokens.color.textSubtle }}>
                Kostenlos - Keine Kreditkarte notig
              </p>
            </div>
          </div>

          {/* Right */}
          <div
            className="flex items-center justify-center px-12 py-16 relative overflow-hidden"
            style={{ background: tokens.color.bg }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle, ${tokens.color.border} 1px, transparent 1px)`,
                backgroundSize: "24px 24px",
              }}
            />

            {/* Main floating card */}
            <motion.div
              animate={prefersReduced ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 rounded-[20px] overflow-hidden w-full max-w-[400px]"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.borderStrong}`,
                boxShadow: tokens.shadow.lg,
              }}
            >
              <div
                className="px-5 pt-5 pb-4 flex justify-between items-center"
                style={{ borderBottom: `1px solid ${tokens.color.border}` }}
              >
                <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>Mein Portfolio</p>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: tokens.color.accentMuted, color: tokens.color.accent }}
                >
                  3 Objekte
                </span>
              </div>

              <div
                className="grid grid-cols-3 gap-px"
                style={{ background: tokens.color.border }}
              >
                {[
                  { label: "CASHFLOW / MO.", value: "+892 €",  color: tokens.color.positive },
                  { label: "Ø RENDITE",      value: "4,8 %",   color: tokens.color.positive },
                  { label: "INVESTIERT",     value: "612 T€",  color: tokens.color.text },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-4 py-3" style={{ background: tokens.color.surface }}>
                    <p className="text-[9px] uppercase tracking-wide" style={{ color: tokens.color.textSubtle }}>{label}</p>
                    <p className="text-sm font-semibold mt-1" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col" style={{ borderTop: `1px solid ${tokens.color.border}` }}>
                {DEMO_ROWS.map((row, i) => (
                  <div
                    key={row.name}
                    className="px-5 py-3.5 flex items-center justify-between"
                    style={{ borderBottom: i < DEMO_ROWS.length - 1 ? `1px solid ${tokens.color.border}` : undefined }}
                  >
                    <div className="flex items-center">
                      <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>{row.name}</p>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded ml-2"
                        style={{ background: tokens.color.surfaceHover, color: tokens.color.textMuted }}
                      >
                        {row.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold" style={{ color: tokens.color.positive }}>{row.cashflow}</p>
                      <Sparkline />
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  background: tokens.color.bgSubtle,
                  borderTop: `1px solid ${tokens.color.border}`,
                }}
              >
                <p className="text-xs" style={{ color: tokens.color.textMuted }}>Gesamt Cashflow / Monat</p>
                <p className="text-sm font-semibold" style={{ color: tokens.color.positive }}>+892 €</p>
              </div>
            </motion.div>

            {/* Secondary floating card */}
            <motion.div
              animate={prefersReduced ? {} : { y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-8 right-4 z-20"
              style={{ transform: "rotate(3deg)" }}
            >
              <div
                className="rounded-[14px] px-4 py-3 w-[180px]"
                style={{
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.borderStrong}`,
                  boxShadow: tokens.shadow.md,
                }}
              >
                <p className="text-xs font-semibold" style={{ color: tokens.color.text }}>Neue Analyse</p>
                <p className="text-[10px] mt-0.5" style={{ color: tokens.color.textSubtle }}>Renditeobjekt Hannover</p>
                <div
                  className="mt-2 rounded-full h-1 overflow-hidden"
                  style={{ background: tokens.color.surfaceHover }}
                >
                  <div
                    className="w-[70%] h-full rounded-full"
                    style={{ background: tokens.color.accent }}
                  />
                </div>
                <p className="text-[9px] mt-1.5" style={{ color: tokens.color.textSubtle }}>Berechnung lauft...</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="px-12 py-5 flex items-center justify-between flex-shrink-0"
          style={{
            background: tokens.color.bgSubtle,
            borderTop: `1px solid ${tokens.color.border}`,
          }}
        >
          <div className="flex items-center gap-8">
            {BOTTOM_STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-lg font-semibold" style={{ color: tokens.color.text }}>{value}</p>
                <p className="text-xs" style={{ color: tokens.color.textSubtle }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: tokens.color.textSubtle }}>
            <ShieldCheck size={12} color={tokens.color.positive} />
            DSGVO-konform - Daten in Europa
          </div>
        </div>
      </div>
    );
  }

  const isGated = plan === "free" && count > 0;

  return (
    <div className="p-8 max-w-[1200px] relative">
      {isGated && (
        <GateOverlay
          feature="Portfolio (Pro)"
          description="Upgrade auf Pro um dein Portfolio zu sehen."
        />
      )}
      <div className={isGated ? "blur-sm pointer-events-none select-none" : ""}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="text-[22px] font-semibold tracking-[-0.02em]"
              style={{ color: tokens.color.text }}
            >
              Portfolio
            </h1>
            <p className="text-sm mt-0.5" style={{ color: tokens.color.textMuted }}>
              {count} Objekt{count !== 1 ? "e" : ""}
            </p>
          </div>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-[8px] transition-colors"
            style={{
              background: tokens.color.accent,
              color: tokens.color.bg,
            }}
          >
            <Calculator size={14} />
            Objekt hinzufugen
          </Link>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Investiert",    value: formatCurrency(totalInvestment),              color: tokens.color.text },
            { label: "Cashflow / Mo.", value: formatCurrencySigned(totalCashflow),          color: totalCashflow >= 0 ? tokens.color.positive : tokens.color.danger },
            { label: "Ø Bruttorendite", value: formatPercent(avgGrossYield),               color: tokens.color.accent },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-[12px] px-5 py-4"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <p
                className="text-xs font-medium uppercase tracking-wide mb-1"
                style={{ color: tokens.color.textSubtle }}
              >
                {label}
              </p>
              <p className="text-xl font-semibold tracking-tight" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Property grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p, i) => {
            const colors = TYPE_COLORS[p.type] ?? TYPE_COLORS.ETW;
            const positive = p.cashflow_monthly >= 0;

            const financingAlert = financingAlertsByProperty[p.id];

            return (
              <motion.div
                key={p.id}
                initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReduced ? 0 : i * 0.06, duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="h-full"
              >
                <HoverCard intensity={3} className="h-full">
                  <div
                    className="relative rounded-[16px] overflow-hidden h-full transition-all duration-300"
                    style={{
                      background: tokens.color.surface,
                      border: financingAlert
                        ? `1px solid ${financingAlert === "critical" ? "rgba(255,68,68,0.25)" : "rgba(255,184,0,0.2)"}`
                        : `1px solid ${tokens.color.border}`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = tokens.color.borderStrong;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = tokens.color.border;
                    }}
                  >
                    {/* Left accent bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ backgroundColor: positive ? tokens.color.positive : tokens.color.danger }}
                    />

                    <div className="pl-8 pr-6 py-5 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                          style={{ background: colors.bg }}
                        >
                          <Buildings size={18} color={colors.text} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {financingAlert && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: financingAlert === "critical" ? "rgba(255,68,68,0.1)" : "rgba(255,184,0,0.1)",
                                color: financingAlert === "critical" ? "#FF4444" : "#FFB800",
                              }}
                            >
                              Zins bald fallig
                            </span>
                          )}
                          <span
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                          >
                            {p.type}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold leading-snug" style={{ color: tokens.color.text }}>
                        {p.name}
                      </h3>
                      {p.address ? (
                        <p
                          className="flex items-center gap-1 text-xs mt-1 mb-3"
                          style={{ color: tokens.color.textSubtle }}
                        >
                          <MapPin size={11} />
                          {p.address}
                        </p>
                      ) : (
                        <div className="mb-3" />
                      )}

                      <div
                        className="mt-auto pt-4"
                        style={{ borderTop: `1px solid ${tokens.color.border}` }}
                      >
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div>
                            <p
                              className="text-[10px] uppercase tracking-wide font-medium mb-0.5"
                              style={{ color: tokens.color.textSubtle }}
                            >
                              Kaufpreis
                            </p>
                            <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                              {formatCurrency(p.purchase_price)}
                            </p>
                          </div>
                          <div>
                            <p
                              className="text-[10px] uppercase tracking-wide font-medium mb-0.5"
                              style={{ color: tokens.color.textSubtle }}
                            >
                              Flache
                            </p>
                            <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                              {p.sqm > 0 ? `${p.sqm} m²` : "-"}
                            </p>
                          </div>
                          <div>
                            <p
                              className="text-[10px] uppercase tracking-wide font-medium mb-0.5 flex items-center gap-1"
                              style={{ color: tokens.color.textSubtle }}
                            >
                              <TrendUp size={10} />
                              Bruttorendite
                            </p>
                            <p className="text-sm font-semibold" style={{ color: tokens.color.accent }}>
                              {formatPercent(p.gross_yield)}
                            </p>
                          </div>
                          <div>
                            <p
                              className="text-[10px] uppercase tracking-wide font-medium mb-0.5 flex items-center gap-1"
                              style={{ color: tokens.color.textSubtle }}
                            >
                              <ChartLine size={10} />
                              Cashflow / Mo.
                            </p>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: positive ? tokens.color.positive : tokens.color.danger }}
                            >
                              {formatCurrencySigned(p.cashflow_monthly)}
                            </p>
                          </div>
                        </div>

                        <div
                          className="grid grid-cols-2 gap-x-4 pt-3 mt-3"
                          style={{ borderTop: `1px solid ${tokens.color.border}` }}
                        >
                          <div>
                            <p
                              className="text-[10px] uppercase tracking-wide font-medium mb-0.5"
                              style={{ color: tokens.color.textSubtle }}
                            >
                              Nettorendite
                            </p>
                            <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
                              {formatPercent(p.net_yield)}
                            </p>
                          </div>
                          {p.ltv > 0 && (
                            <div>
                              <p
                                className="text-[10px] uppercase tracking-wide font-medium mb-0.5"
                                style={{ color: tokens.color.textSubtle }}
                              >
                                LTV
                              </p>
                              <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
                                {formatPercent(p.ltv, 0)}
                              </p>
                            </div>
                          )}
                        </div>
                        {tenantsByProperty[p.id] && (
                          <div className="flex items-center gap-1.5 mt-2" style={{ color: "#444" }}>
                            <UsersFour size={12} color="#444" />
                            <span className="text-[11px]">
                              {tenantsByProperty[p.id].count} Mieter · {formatCurrency(tenantsByProperty[p.id].totalRent)}/Mo
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </HoverCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
