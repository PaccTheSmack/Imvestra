"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  FilePdf,
  ArrowRight,
  CaretRight,
} from "@phosphor-icons/react";
import { calculateProperty } from "@/lib/calculations";
import { formatCurrency, formatPercent, formatCurrencySigned } from "@/lib/format";
import DownloadButton from "@/components/pdf/DownloadButton";
import GateOverlay from "@/components/ui/GateOverlay";
import { tokens } from "@/lib/tokens";
import type { Property, Plan } from "@/types";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  ETW:     { bg: "rgba(0,224,215,0.1)",   text: tokens.color.accent },
  MFH:     { bg: "rgba(139,92,246,0.1)",   text: "#A78BFA" },
  EFH:     { bg: "rgba(0,224,215,0.08)",  text: tokens.color.accent },
  DHH:     { bg: "rgba(251,146,60,0.1)",   text: "#FB923C" },
  Gewerbe: { bg: "rgba(255,255,255,0.06)", text: tokens.color.textMuted },
};

interface PDFExportViewProps {
  properties: Property[];
  plan: Plan;
}

export default function PDFExportView({ properties, plan }: PDFExportViewProps) {
  const prefersReduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProperty = properties.find((p) => p.id === selectedId) ?? null;
  const selectedResult = selectedProperty ? calculateProperty(selectedProperty) : null;

  return (
    <div className="min-h-screen" style={{ background: tokens.color.bg }}>
      <div className="p-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[rgba(0,224,215,0.08)] border border-[rgba(0,224,215,0.12)] rounded-[10px] flex items-center justify-center flex-shrink-0">
            <FilePdf size={18} color="#00E0D7" />
          </div>
          <div>
            <p className="text-[20px] font-semibold text-white tracking-[-0.02em] leading-tight">PDF Bankpräsentation</p>
            <p className="text-xs text-[#666] mt-0.5">Professionelle Objektanalyse für dein nächstes Bankgespräch</p>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Property selector */}
          <div
            className="rounded-[14px] overflow-hidden self-start"
            style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest px-5 pt-5 pb-3"
              style={{ color: tokens.color.textSubtle }}
            >
              Objekt auswählen
            </p>

            {properties.length === 0 ? (
              <div className="px-5 pb-8 flex flex-col items-center text-center pt-4">
                <FilePdf size={24} color={tokens.color.textSubtle} />
                <p className="text-sm mt-3" style={{ color: tokens.color.textMuted }}>Noch kein Objekt im Portfolio.</p>
                <p className="text-xs mt-1" style={{ color: tokens.color.textSubtle }}>Berechne zuerst ein Objekt im Rechner.</p>
                <Link
                  href="/calculator"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-[8px] transition-all"
                  style={{ background: tokens.color.surfaceHover, border: `1px solid ${tokens.color.border}`, color: tokens.color.accent }}
                >
                  Zum Rechner
                  <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              <div>
                {properties.map((p) => {
                  const colors = TYPE_COLORS[p.type] ?? TYPE_COLORS.ETW;
                  const isSelected = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between transition-colors"
                      style={{
                        borderTop: `1px solid ${tokens.color.border}`,
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
            )}
          </div>

          {/* Right: Preview + download */}
          <div className="relative">
            {plan === "free" && (
              <GateOverlay
                feature="PDF Bankpräsentation (Pro)"
                description="Erstelle professionelle PDFs für deine Bankgespräche."
              />
            )}
            <div className={plan === "free" ? "blur-sm pointer-events-none select-none" : ""}>
              {selectedProperty && selectedResult ? (
                <motion.div
                  key={selectedProperty.id}
                  initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: prefersReduced ? 0 : 0.25 }}
                >
                  {/* Preview card */}
                  <div
                    className="rounded-[14px] p-6 mb-4"
                    style={{
                      background: tokens.color.surface,
                      border: `1px solid ${tokens.color.border}`,
                    }}
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <p className="text-lg font-semibold" style={{ color: tokens.color.accent }}>Imvestra</p>
                        <p className="text-xs mt-0.5" style={{ color: tokens.color.textSubtle }}>
                          Bankpräsentation · Objektanalyse
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
                  className="rounded-[14px] flex flex-col items-center justify-center py-16 px-8 text-center"
                  style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
                >
                  <motion.div
                    animate={prefersReduced ? {} : { y: [0, -6, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-[16px] flex items-center justify-center mb-4"
                    style={{ background: tokens.color.bgSubtle, border: `1px solid ${tokens.color.border}` }}
                  >
                    <FilePdf size={28} color={tokens.color.textSubtle} />
                  </motion.div>
                  <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                    {properties.length === 0 ? "Noch kein Objekt im Portfolio" : "Objekt auswählen"}
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: tokens.color.textSubtle }}>
                    {properties.length === 0
                      ? "Berechne zuerst ein Objekt im Rechner."
                      : "Wähle ein Objekt aus der Liste."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
