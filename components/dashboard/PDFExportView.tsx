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
import type { Property, Plan } from "@/types";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  ETW:     { bg: "rgba(160,120,48,0.1)",   text: "#A07830" },
  MFH:     { bg: "rgba(139,92,246,0.1)",   text: "#7C3AED" },
  EFH:     { bg: "rgba(160,120,48,0.08)",  text: "#A07830" },
  DHH:     { bg: "rgba(234,88,12,0.1)",    text: "#EA580C" },
  Gewerbe: { bg: "rgba(0,0,0,0.06)",       text: "#6B7280" },
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
    <div className="px-8 py-7 w-full" style={{ background: "#F8F7F4", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[rgba(160,120,48,0.08)] border border-[rgba(160,120,48,0.12)] rounded-[10px] flex items-center justify-center flex-shrink-0">
          <FilePdf size={18} color="#A07830" />
        </div>
        <div>
          <p className="text-[20px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: "#101418" }}>PDF Bankpräsentation</p>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Professionelle Objektanalyse für dein nächstes Bankgespräch</p>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Property selector */}
        <div
          className="rounded-[14px] overflow-hidden self-start"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-widest px-5 pt-5 pb-3"
            style={{ color: "#9CA3AF" }}
          >
            Objekt auswählen
          </p>

          {properties.length === 0 ? (
            <div className="px-5 pb-8 flex flex-col items-center text-center pt-6">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-[16px] flex items-center justify-center mb-4"
                style={{ background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.12)" }}
              >
                <FilePdf size={28} color="#A07830" />
              </motion.div>
              <p className="text-base font-semibold tracking-[-0.02em] mb-1.5" style={{ color: "#101418" }}>Noch kein Objekt</p>
              <p className="text-xs leading-relaxed mb-5 max-w-[180px]" style={{ color: "#6B7280" }}>
                Berechne zuerst ein Objekt im Rechner, um PDFs zu exportieren.
              </p>
              {/* Ghost property rows */}
              <div className="w-full flex flex-col gap-1 select-none pointer-events-none">
                {[["Musterstraße 12", "ETW", "0.8%"], ["Hafenweg 3", "MFH", "1.2%"]].map(([name, type, yield_], i) => (
                  <div
                    key={name}
                    className="px-3 py-2.5 flex items-center justify-between rounded-[8px]"
                    style={{
                      background: "#F8F7F4",
                      filter: "blur(1.5px)",
                      opacity: i === 0 ? 0.35 : 0.2,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(160,120,48,0.1)", color: "#A07830" }}>{type}</span>
                      <span className="text-xs" style={{ color: "#101418" }}>{name}</span>
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: "#6B7280" }}>{yield_}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/calculator"
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-[8px] transition-all"
                style={{ background: "#F8F7F4", border: "1px solid rgba(0,0,0,0.07)", color: "#A07830" }}
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
                      borderTop: "1px solid rgba(0,0,0,0.07)",
                      background: isSelected ? "rgba(160,120,48,0.06)" : "transparent",
                      outline: isSelected ? "1px solid rgba(160,120,48,0.2)" : "none",
                      outlineOffset: "-1px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "#F8F7F4";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#101418" }}>{p.name}</p>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {p.type}
                      </span>
                    </div>
                    <CaretRight size={14} color="#9CA3AF" />
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
                    background: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.07)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <p className="text-lg font-semibold" style={{ color: "#A07830" }}>Imvestra</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                        Bankpräsentation · Objektanalyse
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: "#101418" }}>{selectedProperty.name}</p>
                      {selectedProperty.address && (
                        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{selectedProperty.address}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "BRUTTORENDITE",
                        value: formatPercent(selectedResult.gross_yield),
                        color: selectedResult.gross_yield >= 0.05 ? "#2D6A2D" : selectedResult.gross_yield >= 0.03 ? "#92400E" : "#B91C1C",
                      },
                      {
                        label: "CASHFLOW / MO.",
                        value: formatCurrencySigned(selectedResult.cashflow_monthly),
                        color: selectedResult.cashflow_monthly >= 0 ? "#2D6A2D" : "#B91C1C",
                      },
                      {
                        label: "NETTOMIETRENDITE",
                        value: formatPercent(selectedResult.net_yield),
                        color: selectedResult.net_yield >= 0.04 ? "#2D6A2D" : selectedResult.net_yield >= 0.02 ? "#92400E" : "#B91C1C",
                      },
                      {
                        label: "GESAMTINVESTITION",
                        value: formatCurrency(selectedResult.total_investment),
                        color: "#101418",
                      },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="rounded-[10px] p-4"
                        style={{
                          background: "#F5F5F5",
                          border: "1px solid rgba(0,0,0,0.07)",
                        }}
                      >
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{label}</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-5 pt-4 flex flex-col gap-1.5"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
                  >
                    {[
                      { label: "Kaufpreis",       value: formatCurrency(selectedProperty.purchase_price) },
                      { label: "NOI",             value: formatCurrency(selectedResult.noi) },
                      {
                        label: "Cashflow / Jahr",
                        value: formatCurrencySigned(selectedResult.cashflow_yearly),
                        color: selectedResult.cashflow_yearly >= 0 ? "#2D6A2D" : "#B91C1C",
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span style={{ color: "#6B7280" }}>{label}</span>
                        <span className="font-semibold" style={{ color: color ?? "#101418" }}>{value}</span>
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
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
                }}
              >
                <motion.div
                  animate={prefersReduced ? {} : { y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-[16px] flex items-center justify-center mb-4"
                  style={{ background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <FilePdf size={28} color="#9CA3AF" />
                </motion.div>
                <p className="text-sm font-semibold" style={{ color: "#101418" }}>
                  {properties.length === 0 ? "Noch kein Objekt im Portfolio" : "Objekt auswählen"}
                </p>
                <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>
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
  );
}
