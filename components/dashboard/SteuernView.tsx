"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Receipt,
  CaretLeft,
  CaretRight,
  FilePdf,
  Warning,
} from "@phosphor-icons/react";
import { tokens } from "@/lib/tokens";
import { formatCurrency, formatCurrencySigned, formatPercent } from "@/lib/format";
import type { Property, RentPayment, Expense, Financing } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";

type SteuernTab = "uebersicht" | "einnahmen" | "ausgaben" | "afa";

interface SteuernViewProps {
  properties: Property[];
  payments: RentPayment[];
  expenses: Expense[];
  financings: Financing[];
  year: number;
}

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function AnlageVRow({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div
      className="flex justify-between items-center py-2.5"
      style={{
        borderBottom: `1px solid ${tokens.color.border}`,
        background: highlight ? tokens.color.bgSubtle : "transparent",
        marginLeft: highlight ? -20 : 0,
        marginRight: highlight ? -20 : 0,
        paddingLeft: highlight ? 20 : 0,
        paddingRight: highlight ? 20 : 0,
      }}
    >
      <span className="text-xs" style={{ color: highlight ? tokens.color.text : tokens.color.textMuted, fontWeight: highlight ? 600 : 400 }}>
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums" style={{ color: color ?? (highlight ? tokens.color.text : tokens.color.text) }}>
        {value}
      </span>
    </div>
  );
}

export default function SteuernView({ properties, payments, expenses, financings, year }: SteuernViewProps) {
  const [selectedYear, setSelectedYear] = useState(year);
  const [activeTab, setActiveTab] = useState<SteuernTab>("uebersicht");
  const [pdfLoading, setPdfLoading] = useState(false);
  const prefersReduced = useReducedMotion();
  const currentYear = new Date().getFullYear();

  // ─── computed yearly data ──────────────────────────────────────
  const yearPayments = payments.filter(p => {
    const d = new Date(p.due_date);
    return d.getFullYear() === selectedYear && p.status === "paid";
  });

  const yearExpenses = expenses.filter(e =>
    new Date(e.date).getFullYear() === selectedYear
  );

  const mieteinnahmen = yearPayments.reduce((s, p) => s + p.amount, 0);

  const werbungskosten = {
    instandhaltung: yearExpenses
      .filter(e => e.category === "maintenance")
      .reduce((s, e) => s + e.amount, 0),
    verwaltung: yearExpenses
      .filter(e => e.category === "management")
      .reduce((s, e) => s + e.amount, 0),
    versicherung: yearExpenses
      .filter(e => e.category === "insurance")
      .reduce((s, e) => s + e.amount, 0),
    sonstige: yearExpenses
      .filter(e => !["maintenance", "management", "insurance"].includes(e.category))
      .reduce((s, e) => s + e.amount, 0),
  };

  const zinsen = financings.reduce((s, f) => {
    const currentDebt = f.current_debt || f.loan_amount;
    return s + currentDebt * f.interest_rate;
  }, 0);

  const afa_gesamt = properties.reduce((s, p) => {
    const gebaeude = p.purchase_price * 0.8;
    return s + gebaeude * 0.02;
  }, 0);

  const werbungskosten_gesamt =
    Object.values(werbungskosten).reduce((s, v) => s + v, 0) + zinsen + afa_gesamt;

  const ueberschuss = mieteinnahmen - werbungskosten_gesamt;

  // ─── PDF export ────────────────────────────────────────────────
  async function handlePdfExport() {
    setPdfLoading(true);
    try {
      const [{ pdf }, { default: AnlageVReport }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../pdf/AnlageVReport"),
      ]);
      const { createElement } = await import("react");
      const blob = await pdf(
        createElement(AnlageVReport, {
          year: selectedYear,
          properties,
          mieteinnahmen,
          werbungskosten,
          zinsen,
          afa_gesamt,
          werbungskosten_gesamt,
          ueberschuss,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Imvestra-Anlage-V-${selectedYear}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("AnlageV PDF failed:", err);
    }
    setPdfLoading(false);
  }

  const TABS: { id: SteuernTab; label: string }[] = [
    { id: "uebersicht", label: "Übersicht" },
    { id: "einnahmen",  label: "Einnahmen" },
    { id: "ausgaben",   label: "Ausgaben"  },
    { id: "afa",        label: "AfA"       },
  ];

  // ─── Einnahmen: monthly breakdown ─────────────────────────────
  const monthlyAmounts = MONTHS.map((_, mi) =>
    yearPayments
      .filter(p => new Date(p.due_date).getMonth() === mi)
      .reduce((s, p) => s + p.amount, 0)
  );
  const maxMonthAmount = Math.max(...monthlyAmounts, 1);

  // ─── Ausgaben: by category ─────────────────────────────────────
  const expenseByCategory = Object.entries(EXPENSE_CATEGORIES).map(([key, meta]) => ({
    key,
    label: meta.label,
    color: meta.color,
    amount: yearExpenses
      .filter(e => e.category === key)
      .reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.amount > 0);
  const totalExpenses = expenseByCategory.reduce((s, c) => s + c.amount, 0) || 1;

  return (
    <div className="min-h-screen" style={{ background: tokens.color.bg }}>
      <div className="p-6 w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-[10px]"
              style={{ background: "rgba(0,224,215,0.08)", border: "1px solid rgba(0,224,215,0.12)" }}
            >
              <Receipt size={18} color="#00E0D7" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-semibold tracking-[-0.02em]" style={{ color: tokens.color.text }}>
                Steuerübersicht
              </h1>
              <span
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{
                  background: tokens.color.surfaceHover,
                  border: `1px solid ${tokens.color.border}`,
                  color: tokens.color.textSubtle,
                }}
              >
                {selectedYear}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] transition-colors"
                style={{ color: "#666" }}
                onMouseEnter={e => (e.currentTarget.style.background = tokens.color.surfaceHover)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <CaretLeft size={16} />
              </button>
              <button
                onClick={() => setSelectedYear(y => y + 1)}
                disabled={selectedYear >= currentYear}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] transition-colors disabled:opacity-30"
                style={{ color: "#666" }}
                onMouseEnter={e => { if (selectedYear < currentYear) (e.currentTarget.style.background = tokens.color.surfaceHover); }}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <CaretRight size={16} />
              </button>
            </div>
            <button
              onClick={handlePdfExport}
              disabled={pdfLoading}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-[8px] transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: tokens.color.surfaceHover,
                border: `1px solid ${tokens.color.borderStrong}`,
                color: tokens.color.text,
              }}
            >
              <FilePdf size={14} color="#FF4444" />
              {pdfLoading ? "Wird erstellt…" : "PDF Anlage V"}
            </button>
          </div>
        </div>

        {/* Empty state */}
        {properties.length === 0 && (
          <div className="flex flex-col items-center py-16 px-4">
            <motion.div
              animate={prefersReduced ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-[20px] flex items-center justify-center mb-6"
              style={{ background: "rgba(0,224,215,0.08)", border: "1px solid rgba(0,224,215,0.12)" }}
            >
              <Receipt size={36} color="#00E0D7" />
            </motion.div>
            <p className="text-[24px] font-semibold tracking-[-0.02em] mb-2" style={{ color: tokens.color.text }}>
              Noch keine Steuerdaten
            </p>
            <p className="text-sm text-center max-w-[340px] leading-relaxed mb-10" style={{ color: tokens.color.textMuted }}>
              Erfasse Objekte im Portfolio, um Mieteinnahmen, Werbungskosten und AfA automatisch auszuwerten.
            </p>
            {/* Ghost Anlage V rows */}
            <div
              className="w-full max-w-[480px] rounded-[14px] overflow-hidden select-none pointer-events-none"
              style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
            >
              <div className="px-5 py-3" style={{ background: "#0C0C0C", borderBottom: `1px solid ${tokens.color.border}` }}>
                <div className="h-2.5 w-40 rounded-full" style={{ background: "rgba(255,255,255,0.08)", filter: "blur(1.5px)", opacity: 0.4 }} />
              </div>
              <div className="px-5 py-4 flex flex-col gap-3" style={{ filter: "blur(1.5px)", opacity: 0.35 }}>
                {[["Mieteinnahmen (Zeile 9)", "8.400 €"], ["Schuldzinsen (Zeile 35)", "3.120 €"], ["AfA (Zeile 33)", "2.760 €"], ["Überschuss / Verlust (Zeile 53)", "2.520 €"]].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-xs" style={{ color: "#777" }}>{label}</span>
                    <span className="text-xs font-medium tabular-nums" style={{ color: tokens.color.text }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="w-full max-w-[480px] rounded-[14px] mt-3 select-none pointer-events-none"
              style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}`, filter: "blur(1.5px)", opacity: 0.2 }}
            >
              <div className="px-5 py-4 flex flex-col gap-3">
                {[["AfA / Jahr", "2.760 €"], ["Steuerersparnis (42 %)", "1.159 €"]].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center py-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-xs" style={{ color: "#777" }}>{label}</span>
                    <span className="text-xs font-medium tabular-nums" style={{ color: tokens.color.text }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary cards + Tab card */}
        {properties.length > 0 && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "MIETEINNAHMEN",      value: formatCurrency(mieteinnahmen),           color: "#00E0D7" },
            { label: "WERBUNGSKOSTEN",     value: formatCurrency(werbungskosten_gesamt),   color: "#FF4444" },
            { label: "ZINSEN (GESCHÄTZT)", value: formatCurrency(zinsen),                  color: "#FFB800" },
            {
              label: "ÜBERSCHUSS/VERLUST",
              value: formatCurrencySigned(ueberschuss),
              color: ueberschuss >= 0 ? "#00E0D7" : "#FF4444",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-[12px] p-4"
              style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
            >
              <p className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: tokens.color.textSubtle }}>
                {label}
              </p>
              <p className="text-[22px] font-semibold tracking-[-0.03em] leading-none tabular-nums" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Tab card */}

        <div
          className="rounded-[14px] overflow-hidden"
          style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
        >
          {/* Tab bar */}
          <div
            className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ borderBottom: `1px solid ${tokens.color.border}` }}
          >
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex-shrink-0 py-3 px-5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                style={activeTab === id ? {
                  color: tokens.color.accent,
                  borderBottom: `2px solid ${tokens.color.accent}`,
                  marginBottom: -1,
                } : {
                  color: tokens.color.textSubtle,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={prefersReduced ? {} : { opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, x: -6 }}
              transition={{ duration: prefersReduced ? 0 : 0.15 }}
              className="p-5"
            >

              {/* ── ÜBERSICHT ── */}
              {activeTab === "uebersicht" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Anlage V Vorbereitung */}
                  <div
                    className="rounded-[14px] overflow-hidden"
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="px-5 py-3"
                      style={{ background: "#0C0C0C", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <p className="text-[10px] uppercase tracking-widest" style={{ color: "#777" }}>
                        Anlage V – Vorbereitung {selectedYear}
                      </p>
                    </div>

                    <div className="px-5 py-4">
                      <p className="text-[10px] uppercase tracking-wider pt-3 pb-2" style={{ color: "#666" }}>
                        Einnahmen aus Vermietung
                      </p>
                      <AnlageVRow
                        label="Mieteinnahmen (Zeile 9)"
                        value={formatCurrency(mieteinnahmen)}
                        color="#00E0D7"
                        highlight
                      />

                      <p className="text-[10px] uppercase tracking-wider pt-4 pb-2" style={{ color: "#666" }}>
                        Werbungskosten
                      </p>
                      <AnlageVRow label="Schuldzinsen (Zeile 35)"                  value={formatCurrency(zinsen)} />
                      <AnlageVRow label="Absetzung für Abnutzung / AfA (Zeile 33)" value={formatCurrency(afa_gesamt)} />
                      <AnlageVRow label="Erhaltungsaufwendungen (Zeile 40)"         value={formatCurrency(werbungskosten.instandhaltung)} />
                      <AnlageVRow label="Verwaltungskosten (Zeile 41)"              value={formatCurrency(werbungskosten.verwaltung)} />
                      <AnlageVRow label="Versicherungen (Zeile 42)"                 value={formatCurrency(werbungskosten.versicherung)} />
                      <AnlageVRow label="Sonstige Kosten (Zeile 49)"                value={formatCurrency(werbungskosten.sonstige)} />

                      <div className="mt-2">
                        <AnlageVRow
                          label="Überschuss / Verlust (Zeile 53)"
                          value={formatCurrencySigned(ueberschuss)}
                          color={ueberschuss >= 0 ? "#00E0D7" : "#FF4444"}
                          highlight
                        />
                      </div>
                    </div>

                    <div
                      className="px-5 py-3"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <p className="text-[10px] leading-relaxed" style={{ color: "#555" }}>
                        * Näherungswerte. Zeilen beziehen sich auf Anlage V (2024). Bitte mit Steuerberater abstimmen.
                      </p>
                    </div>
                  </div>

                  {/* AfA Steuerersparnis */}
                  <div
                    className="rounded-[14px] p-5"
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: "#777" }}>
                      Steuerersparnis durch AfA
                    </p>

                    {properties.length === 0 ? (
                      <p className="text-sm text-center py-8" style={{ color: tokens.color.textSubtle }}>
                        Keine Objekte vorhanden.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {properties.map((p, i) => {
                          const gebaeude = p.purchase_price * 0.8;
                          const afa = gebaeude * 0.02;
                          const ersparnis = afa * 0.42;
                          return (
                            <div key={p.id}>
                              {i > 0 && <div className="mb-4" style={{ borderTop: `1px solid ${tokens.color.border}` }} />}
                              <p className="text-sm font-semibold mb-2" style={{ color: tokens.color.text }}>{p.name}</p>
                              <div className="flex justify-between text-xs mb-1">
                                <span style={{ color: "#777" }}>AfA / Jahr</span>
                                <span style={{ color: tokens.color.text }}>{formatCurrency(afa)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span style={{ color: "#777" }}>Ersparnis (42% Steuersatz)</span>
                                <span className="font-medium" style={{ color: "#00E0D7" }}>{formatCurrency(ersparnis)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {properties.length > 0 && (
                      <div
                        className="mt-4 pt-4 flex flex-col gap-1.5"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold" style={{ color: tokens.color.text }}>Gesamt AfA</span>
                          <span className="text-sm font-semibold" style={{ color: tokens.color.text }}>{formatCurrency(afa_gesamt)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold" style={{ color: "#00E0D7" }}>Steuerersparnis (42%)</span>
                          <span className="text-sm font-semibold" style={{ color: "#00E0D7" }}>{formatCurrency(afa_gesamt * 0.42)}</span>
                        </div>
                      </div>
                    )}

                    <p className="mt-4 text-[10px] leading-relaxed" style={{ color: "#555" }}>
                      Schätzwert bei 42% Grenzsteuersatz, 80% Gebäudeanteil, 2% AfA.
                    </p>
                  </div>
                </div>
              )}

              {/* ── EINNAHMEN ── */}
              {activeTab === "einnahmen" && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                    {MONTHS.map((month, mi) => {
                      const amount = monthlyAmounts[mi];
                      const count = yearPayments.filter(p => new Date(p.due_date).getMonth() === mi).length;
                      return (
                        <div
                          key={month}
                          className="rounded-[12px] p-4"
                          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                          <p className="text-xs uppercase tracking-wide" style={{ color: "#777" }}>{month}</p>
                          <p className="text-lg font-semibold mt-2 tabular-nums" style={{ color: amount > 0 ? "#00E0D7" : "#555" }}>
                            {formatCurrency(amount)}
                          </p>
                          <p className="text-[10px] mt-1" style={{ color: "#666" }}>
                            {count} Zahlung{count !== 1 ? "en" : ""}
                          </p>
                          <div className="mt-2 rounded-full h-1 overflow-hidden" style={{ background: "#1A1A1A" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(amount / maxMonthAmount) * 100}%`, background: "#00E0D7" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {properties.length > 0 && (
                    <div
                      className="rounded-[12px] overflow-hidden"
                      style={{ border: `1px solid ${tokens.color.border}` }}
                    >
                      <div
                        className="px-4 py-2.5"
                        style={{ background: tokens.color.bgSubtle, borderBottom: `1px solid ${tokens.color.border}` }}
                      >
                        <p className="text-[10px] uppercase tracking-widest" style={{ color: tokens.color.textSubtle }}>
                          Einnahmen je Objekt
                        </p>
                      </div>
                      {properties.map(p => {
                        const total = yearPayments
                          .filter(pay => pay.property_id === p.id)
                          .reduce((s, pay) => s + pay.amount, 0);
                        return (
                          <div
                            key={p.id}
                            className="flex justify-between items-center px-4 py-3"
                            style={{ borderBottom: `1px solid ${tokens.color.border}` }}
                          >
                            <span className="text-sm" style={{ color: tokens.color.textMuted }}>{p.name}</span>
                            <span className="text-sm font-semibold tabular-nums" style={{ color: tokens.color.text }}>
                              {formatCurrency(total)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {yearPayments.length === 0 && (
                    <p className="text-center text-sm py-8" style={{ color: tokens.color.textSubtle }}>
                      Keine Zahlungen für {selectedYear} vorhanden.
                    </p>
                  )}
                </div>
              )}

              {/* ── AUSGABEN ── */}
              {activeTab === "ausgaben" && (
                <div>
                  {expenseByCategory.length > 0 ? (
                    <>
                      {/* Stacked bar */}
                      <div className="mb-3 rounded-full h-3 overflow-hidden flex" style={{ background: "#1A1A1A" }}>
                        {expenseByCategory.map(c => (
                          <div
                            key={c.key}
                            style={{ width: `${(c.amount / totalExpenses) * 100}%`, background: c.color }}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-3 mb-6">
                        {expenseByCategory.map(c => (
                          <div key={c.key} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                            <span className="text-xs" style={{ color: tokens.color.textMuted }}>{c.label}</span>
                            <span className="text-xs font-semibold" style={{ color: tokens.color.text }}>{formatCurrency(c.amount)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Expense rows */}
                      <div
                        className="rounded-[12px] overflow-hidden"
                        style={{ border: `1px solid ${tokens.color.border}` }}
                      >
                        {expenseByCategory.map(c => (
                          <div
                            key={c.key}
                            className="flex justify-between items-center px-4 py-3"
                            style={{ borderBottom: `1px solid ${tokens.color.border}` }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                              <span className="text-sm" style={{ color: tokens.color.textMuted }}>{c.label}</span>
                            </div>
                            <span className="text-sm font-semibold tabular-nums" style={{ color: tokens.color.text }}>
                              {formatCurrency(c.amount)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center px-4 py-3" style={{ background: tokens.color.bgSubtle }}>
                          <span className="text-sm font-semibold" style={{ color: tokens.color.text }}>Gesamt</span>
                          <span className="text-sm font-semibold tabular-nums" style={{ color: tokens.color.text }}>
                            {formatCurrency(totalExpenses)}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-sm py-8" style={{ color: tokens.color.textSubtle }}>
                      Keine Ausgaben für {selectedYear} vorhanden.
                    </p>
                  )}
                </div>
              )}

              {/* ── AfA ── */}
              {activeTab === "afa" && (
                <div>
                  {properties.length === 0 ? (
                    <p className="text-center text-sm py-8" style={{ color: tokens.color.textSubtle }}>
                      Keine Objekte vorhanden.
                    </p>
                  ) : (
                    properties.map(p => {
                      const gebaeude = p.purchase_price * 0.8;
                      const afa_yearly = gebaeude * 0.02;
                      const elapsed = currentYear - (p.build_year || currentYear);
                      const remaining_years = Math.max(0, 50 - elapsed);
                      const abgeschrieben_pct = Math.min(100, ((50 - remaining_years) / 50) * 100);

                      return (
                        <div
                          key={p.id}
                          className="rounded-[14px] p-5 mb-4 last:mb-0"
                          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          <div className="flex justify-between items-center mb-4">
                            <p className="text-base font-semibold" style={{ color: tokens.color.text }}>{p.name}</p>
                            <span
                              className="text-xs px-2.5 py-1 rounded-full"
                              style={{ background: "rgba(0,224,215,0.08)", color: "#00E0D7" }}
                            >
                              2 % · 50 Jahre
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { label: "Gebäudewert (80%)", value: formatCurrency(gebaeude),          color: tokens.color.text },
                              { label: "AfA / Jahr",        value: formatCurrency(afa_yearly),        color: "#00E0D7" },
                              { label: "AfA / Monat",       value: formatCurrency(afa_yearly / 12),   color: tokens.color.text },
                              { label: "Restlaufzeit",      value: `${remaining_years} Jahre`,        color: tokens.color.text },
                            ].map(({ label, value, color }) => (
                              <div
                                key={label}
                                className="rounded-[10px] p-3"
                                style={{ background: "#0C0C0C" }}
                              >
                                <p className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: "#666" }}>{label}</p>
                                <p className="text-sm font-semibold" style={{ color }}>{value}</p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4">
                            <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "#666" }}>
                              <span>Abgeschrieben</span>
                              <span>Verbleibend</span>
                            </div>
                            <div className="rounded-full h-1.5 overflow-hidden" style={{ background: "#1A1A1A" }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${abgeschrieben_pct}%`, background: "#00E0D7" }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] mt-1" style={{ color: "#666" }}>
                              <span>{formatPercent(abgeschrieben_pct / 100, 0)}</span>
                              <span>{formatPercent(remaining_years / 50, 0)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Disclaimer */}
                  <div
                    className="mt-4 rounded-[10px] px-4 py-3 flex items-start gap-2"
                    style={{ background: tokens.color.warningBg, border: "1px solid rgba(255,184,0,0.2)" }}
                  >
                    <Warning size={14} color={tokens.color.warning} className="mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] leading-relaxed" style={{ color: tokens.color.textMuted }}>
                      AfA-Berechnung basiert auf Standardwerten (80% Gebäudeanteil, 2% linearer AfA). Tatsächliche AfA kann abweichen. Bitte mit Steuerberater abstimmen.
                    </p>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
        </>)}
      </div>
    </div>
  );
}
