"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  FilePdf,
  ArrowRight,
  CaretRight,
  CheckCircle,
  ShieldCheck,
} from "@phosphor-icons/react";
import { calculateProperty } from "@/lib/calculations";
import { formatCurrency, formatPercent, formatCurrencySigned } from "@/lib/format";
import DownloadButton from "@/components/pdf/DownloadButton";
import FadeIn from "@/components/ui/FadeIn";
import GateOverlay from "@/components/ui/GateOverlay";
import { tokens } from "@/lib/tokens";
import type { Property, Plan } from "@/types";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  ETW:     { bg: "rgba(29,184,122,0.1)",   text: tokens.color.accent },
  MFH:     { bg: "rgba(139,92,246,0.1)",   text: "#A78BFA" },
  EFH:     { bg: "rgba(29,184,122,0.08)",  text: tokens.color.accent },
  DHH:     { bg: "rgba(251,146,60,0.1)",   text: "#FB923C" },
  Gewerbe: { bg: "rgba(255,255,255,0.06)", text: tokens.color.textMuted },
};

const MOCK_METRICS = [
  { label: "BRUTTORENDITE",  value: "5,51 %", color: tokens.color.positive },
  { label: "CASHFLOW / MO.", value: "+148 €", color: tokens.color.positive },
  { label: "NETTORENDITE",   value: "4,12 %", color: tokens.color.positive },
  { label: "LTV",            value: "72 %",   color: tokens.color.text },
];

const CHECKLIST = [
  "Bruttorendite & Nettorendite",
  "Monatlicher Cashflow nach Kosten",
  "Finanzierungsstruktur & LTV",
  "NOI und Gesamtinvestition",
  "Kaufnebenkosten aufgeschlusselt",
  "Instandhaltungsrucklage",
  "Mietentwicklung & Leerstand",
  "Standortbewertung mit Karte",
];

const BOTTOM_STATS = [
  { value: "A4",    label: "Druckoptimiertes Format" },
  { value: "< 3s",  label: "Generierungszeit" },
  { value: "100 %", label: "Bankkonform" },
];

interface PDFExportViewProps {
  properties: Property[];
  plan: Plan;
}

export default function PDFExportView({ properties, plan }: PDFExportViewProps) {
  const prefersReduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProperty = properties.find((p) => p.id === selectedId) ?? null;
  const selectedResult = selectedProperty ? calculateProperty(selectedProperty) : null;

  if (properties.length === 0) {
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
              style={{ background: tokens.color.dangerBg, color: tokens.color.danger }}
            >
              <FilePdf size={12} />
              PDF Bankprasentation
            </span>

            <h1
              className="text-[40px] font-semibold tracking-[-0.03em] leading-[1.1]"
              style={{ color: tokens.color.text }}
            >
              Professionell.<br />Uberzeugend.
            </h1>

            <p className="mt-4 text-base leading-relaxed max-w-[380px]" style={{ color: tokens.color.textMuted }}>
              Erstelle bankfertige Objektanalysen in Sekunden.
              Perfekt fur dein nachstes Finanzierungsgesprach.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {CHECKLIST.map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle size={15} color={tokens.color.positive} weight="fill" />
                  <span className="text-sm" style={{ color: tokens.color.text }}>{item}</span>
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
                  Objekt berechnen
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

            {/* Main floating PDF card */}
            <motion.div
              animate={prefersReduced ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 rounded-[20px] overflow-hidden w-full max-w-[380px]"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.borderStrong}`,
                boxShadow: tokens.shadow.lg,
              }}
            >
              {/* PDF header */}
              <div
                className="px-5 pt-5 pb-4"
                style={{ background: tokens.color.accentMuted, borderBottom: `1px solid ${tokens.color.borderAccent}` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-base font-bold tracking-tight" style={{ color: tokens.color.text }}>Imvestra</p>
                    <p className="text-[11px] mt-0.5" style={{ color: tokens.color.accent }}>Bankprasentation - Objektanalyse</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold" style={{ color: tokens.color.text }}>Altbauwohnung Goslar</p>
                    <p className="text-[10px] mt-0.5" style={{ color: tokens.color.textMuted }}>Marktstrasse 12, 38640 Goslar</p>
                  </div>
                </div>
              </div>

              {/* Metric grid */}
              <div
                className="grid grid-cols-2 gap-px"
                style={{ background: tokens.color.border }}
              >
                {MOCK_METRICS.map(({ label, value, color }) => (
                  <div key={label} className="px-4 py-3" style={{ background: tokens.color.surface }}>
                    <p className="text-[9px] uppercase tracking-wide" style={{ color: tokens.color.textSubtle }}>{label}</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Detail rows */}
              <div className="px-5 py-4 flex flex-col gap-2">
                {[
                  { label: "Kaufpreis",        value: "185.000 €" },
                  { label: "NOI",              value: "9.120 €/Jahr" },
                  { label: "Gesamtinvestition", value: "203.750 €" },
                  { label: "Cashflow / Jahr",  value: "+1.776 €", color: tokens.color.positive },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span style={{ color: tokens.color.textMuted }}>{label}</span>
                    <span className="font-semibold" style={{ color: color ?? tokens.color.text }}>{value}</span>
                  </div>
                ))}
              </div>

              <div
                className="h-12"
                style={{
                  background: `linear-gradient(to top, ${tokens.color.surface}, transparent)`,
                }}
              />
            </motion.div>

            {/* Secondary floating card */}
            <motion.div
              animate={prefersReduced ? {} : { y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-8 right-4 z-20"
              style={{ transform: "rotate(6deg)" }}
            >
              <div
                className="rounded-[14px] px-4 py-3 w-[160px]"
                style={{
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.borderStrong}`,
                  boxShadow: tokens.shadow.md,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold" style={{ color: tokens.color.text }}>Seite 2 / 3</p>
                  <span className="text-[9px]" style={{ color: tokens.color.textSubtle }}>Standort</span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 rounded-full w-full" style={{ background: tokens.color.surfaceHover }} />
                  <div className="h-2 rounded-full w-[80%]" style={{ background: tokens.color.surfaceHover }} />
                  <div className="h-2 rounded-full w-[60%]" style={{ background: tokens.color.surfaceHover }} />
                </div>
                <div className="mt-2 h-8 rounded-[6px]" style={{ background: tokens.color.accentSubtle }} />
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
            Kein Druck notig - Digital versendbar
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[900px] mx-auto">
      <FadeIn>
        <div className="mb-8">
          <h1
            className="text-[24px] font-semibold tracking-[-0.02em]"
            style={{ color: tokens.color.text }}
          >
            PDF Bankprasentation
          </h1>
          <p className="text-sm mt-1" style={{ color: tokens.color.textMuted }}>
            Professionelle Objektanalyse fur dein nachstes Bankgesprach.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <div className="relative">
          {plan === "free" && (
            <GateOverlay
              feature="PDF Bankprasentation (Pro)"
              description="Erstelle professionelle PDFs fur deine Bankgesprache."
            />
          )}
          <div className={`grid grid-cols-3 gap-6 ${plan === "free" ? "blur-sm pointer-events-none select-none" : ""}`}>
            {/* Property selector */}
            <div
              className="col-span-1 rounded-[14px] overflow-hidden self-start"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest px-4 pt-4 pb-2"
                style={{ color: tokens.color.textSubtle }}
              >
                Objekt auswahlen
              </p>
              <div className="max-h-[400px] overflow-y-auto">
                {properties.map((p) => {
                  const colors = TYPE_COLORS[p.type] ?? TYPE_COLORS.ETW;
                  const isSelected = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between transition-colors"
                      style={{
                        borderBottom: `1px solid ${tokens.color.border}`,
                        background: isSelected ? tokens.color.accentSubtle : "transparent",
                        borderLeft: isSelected ? `2px solid ${tokens.color.accent}` : "2px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = tokens.color.surfaceHover;
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>{p.name}</p>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {p.type}
                        </span>
                      </div>
                      <CaretRight size={14} color={tokens.color.textSubtle} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview + download */}
            <div className="col-span-2">
              {selectedProperty && selectedResult ? (
                <motion.div
                  key={selectedProperty.id}
                  initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: prefersReduced ? 0 : 0.25 }}
                >
                  {/* Preview card */}
                  <div
                    className="rounded-[16px] p-6 mb-4"
                    style={{
                      background: tokens.color.surface,
                      border: `1px solid ${tokens.color.border}`,
                      boxShadow: tokens.shadow.sm,
                    }}
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <p className="text-lg font-semibold" style={{ color: tokens.color.accent }}>Imvestra</p>
                        <p className="text-xs mt-0.5" style={{ color: tokens.color.textSubtle }}>
                          Bankprasentation - Objektanalyse
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>{selectedProperty.name}</p>
                        {selectedProperty.address && (
                          <p className="text-xs mt-0.5" style={{ color: tokens.color.textMuted }}>{selectedProperty.address}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: "BRUTTORENDITE",
                          value: formatPercent(selectedResult.gross_yield),
                          color: selectedResult.gross_yield >= 0.05 ? tokens.color.positive : selectedResult.gross_yield >= 0.03 ? tokens.color.warning : tokens.color.danger,
                        },
                        {
                          label: "CASHFLOW / MO.",
                          value: formatCurrencySigned(selectedResult.cashflow_monthly),
                          color: selectedResult.cashflow_monthly >= 0 ? tokens.color.positive : tokens.color.danger,
                        },
                        {
                          label: "NETTOMIETRENDITE",
                          value: formatPercent(selectedResult.net_yield),
                          color: selectedResult.net_yield >= 0.04 ? tokens.color.positive : selectedResult.net_yield >= 0.02 ? tokens.color.warning : tokens.color.danger,
                        },
                        {
                          label: "GESAMTINVESTITION",
                          value: formatCurrency(selectedResult.total_investment),
                          color: tokens.color.text,
                        },
                      ].map(({ label, value, color }) => (
                        <div
                          key={label}
                          className="rounded-[10px] p-4"
                          style={{
                            background: tokens.color.bgSubtle,
                            border: `1px solid ${tokens.color.border}`,
                          }}
                        >
                          <p className="text-[10px] uppercase tracking-wide" style={{ color: tokens.color.textSubtle }}>{label}</p>
                          <p className="text-sm font-semibold mt-0.5" style={{ color }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div
                      className="mt-5 pt-4 flex flex-col gap-1.5"
                      style={{ borderTop: `1px solid ${tokens.color.border}` }}
                    >
                      {[
                        { label: "Kaufpreis",       value: formatCurrency(selectedProperty.purchase_price) },
                        { label: "NOI",             value: formatCurrency(selectedResult.noi) },
                        {
                          label: "Cashflow / Jahr",
                          value: formatCurrencySigned(selectedResult.cashflow_yearly),
                          color: selectedResult.cashflow_yearly >= 0 ? tokens.color.positive : tokens.color.danger,
                        },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex justify-between text-xs">
                          <span style={{ color: tokens.color.textMuted }}>{label}</span>
                          <span className="font-semibold" style={{ color: color ?? tokens.color.text }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <DownloadButton
                      propertyName={selectedProperty.name}
                      data={{
                        propertyName: selectedProperty.name,
                        address: selectedProperty.address,
                        type: selectedProperty.type,
                        purchase_price: selectedProperty.purchase_price,
                        rent_monthly: selectedProperty.rent_monthly,
                        sqm: selectedProperty.sqm,
                        result: selectedResult,
                      }}
                    />
                  </div>
                </motion.div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center h-48 text-center rounded-[16px]"
                  style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
                >
                  <FilePdf size={28} color={tokens.color.textSubtle} />
                  <p className="text-sm mt-3" style={{ color: tokens.color.textMuted }}>
                    Objekt aus der Liste auswahlen.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
