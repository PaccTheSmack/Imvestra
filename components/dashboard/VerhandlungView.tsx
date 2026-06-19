"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, animate } from "motion/react";
import { Tag, PiggyBank, House } from "@phosphor-icons/react";
import { tokens } from "@/lib/tokens";
import { formatCurrency, formatPercent } from "@/lib/format";
import { calculateMaxKaufpreis, compareWithAskingPrice } from "@/lib/calculations";
import type { Property } from "@/types";

const INPUT =
  "w-full bg-white border border-[rgba(16,20,24,0.1)] rounded-[8px] px-3 py-2.5 text-sm text-[#101418] placeholder:text-[#A89A7A] focus:outline-none focus:border-[rgba(160,120,48,0.4)] focus:ring-2 focus:ring-[rgba(160,120,48,0.2)] focus:bg-white transition-all duration-150";
const LABEL = "block text-xs font-medium text-[#A89A7A] mb-1.5";
const SECTION_LABEL =
  "text-[11px] font-semibold text-[#A89A7A] uppercase tracking-[0.08em] mb-4";

function SuffixInput({ suffix, children }: { suffix: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
        style={{ color: tokens.color.textSubtle }}
      >
        {suffix}
      </span>
    </div>
  );
}

function MetricValue({
  value,
  formatter,
  className,
  style,
}: {
  value: number;
  formatter: (v: number) => string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const prefersReduced = useReducedMotion();
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(() => formatter(0));

  useEffect(() => {
    if (prefersReduced) {
      mv.set(value);
      setDisplay(formatter(value));
      return;
    }
    const ctrl = animate(mv, value, { duration: 0.6, ease: "easeOut" });
    const unsub = mv.on("change", (v) => setDisplay(formatter(v)));
    return () => { ctrl.stop(); unsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, prefersReduced]);

  return <span className={className} style={style}>{display}</span>;
}

interface VerhandlungViewProps {
  properties: Property[];
}

export default function VerhandlungView({ properties }: VerhandlungViewProps) {
  const [rentMonthly, setRentMonthly] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [sqm, setSqm] = useState("");
  const [targetYield, setTargetYield] = useState(0.05);
  const [customYield, setCustomYield] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const prefersReduced = useReducedMotion();

  const rent = Number(rentMonthly) || 0;
  const pp   = Number(askingPrice)  || 0;
  const hasData = rent > 0;

  const verhandlungsResult = hasData
    ? calculateMaxKaufpreis(rent, targetYield)
    : null;

  function handlePropertySelect(id: string) {
    setSelectedPropertyId(id);
    if (!id) return;
    const p = properties.find((x) => x.id === id);
    if (!p) return;
    setRentMonthly(String(p.rent_monthly));
    setAskingPrice(String(p.purchase_price));
    if (p.sqm) setSqm(String(p.sqm));
  }

  function handleCustomYield(val: string) {
    setCustomYield(val);
    const n = parseFloat(val.replace(",", "."));
    if (!isNaN(n) && n > 0 && n <= 30) {
      setTargetYield(n / 100);
    }
  }

  function handleQuickYield(y: number) {
    setTargetYield(y);
    setCustomYield("");
  }

  const QUICK_YIELDS = [0.04, 0.05, 0.06, 0.07, 0.08] as const;

  return (
    <div className="min-h-screen" style={{ background: tokens.color.bg }}>
      <div className="p-6 w-full">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 flex items-center justify-center rounded-[10px] flex-shrink-0"
            style={{ background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.18)" }}
          >
            <Tag size={18} color="#A07830" />
          </div>
          <div>
            <h1
              className="text-[20px] font-semibold tracking-[-0.02em]"
              style={{ color: tokens.color.text }}
            >
              Kaufpreis-Verhandlung
            </h1>
            <p className="text-sm mt-0.5" style={{ color: tokens.color.textMuted }}>
              Was darf die Immobilie maximal kosten?
            </p>
          </div>
        </div>

        {/* Two column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT – Inputs ── */}
          <div
            className="rounded-[14px] p-6 flex flex-col gap-6"
            style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
          >
            {/* Pre-fill from portfolio */}
            {properties.length > 0 && (
              <div>
                <label className={LABEL}>
                  <House size={11} className="inline mr-1 opacity-60" />
                  Aus Portfolio übernehmen
                </label>
                <select
                  className={INPUT}
                  value={selectedPropertyId}
                  onChange={(e) => handlePropertySelect(e.target.value)}
                >
                  <option value="">— Objekt wählen —</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Objekt inputs */}
            <div>
              <p className={SECTION_LABEL}>Objekt</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className={LABEL}>Kaltmiete / Monat</label>
                  <SuffixInput suffix="€">
                    <input
                      type="number"
                      className={`${INPUT} pr-8`}
                      placeholder="850"
                      value={rentMonthly}
                      onChange={(e) => { setRentMonthly(e.target.value); setSelectedPropertyId(""); }}
                    />
                  </SuffixInput>
                </div>
                <div>
                  <label className={LABEL}>Kaufpreis des Verkäufers</label>
                  <SuffixInput suffix="€">
                    <input
                      type="number"
                      className={`${INPUT} pr-8`}
                      placeholder="250000"
                      value={askingPrice}
                      onChange={(e) => { setAskingPrice(e.target.value); setSelectedPropertyId(""); }}
                    />
                  </SuffixInput>
                  <p className="text-[10px] mt-1" style={{ color: tokens.color.textSubtle }}>
                    Optional – für Vergleich
                  </p>
                </div>
                <div>
                  <label className={LABEL}>Wohnfläche</label>
                  <SuffixInput suffix="m²">
                    <input
                      type="number"
                      className={`${INPUT} pr-10`}
                      placeholder="75"
                      value={sqm}
                      onChange={(e) => setSqm(e.target.value)}
                    />
                  </SuffixInput>
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${tokens.color.border}` }} />

            {/* Zielrendite */}
            <div>
              <p className={SECTION_LABEL}>Zielrendite (Brutto)</p>
              <div className="flex gap-2 mb-3">
                {QUICK_YIELDS.map((y) => (
                  <button
                    key={y}
                    onClick={() => handleQuickYield(y)}
                    className="flex-1 py-2 rounded-[8px] text-xs font-semibold transition-all"
                    style={
                      targetYield === y && customYield === ""
                        ? { background: tokens.color.accent, color: tokens.color.bg }
                        : { background: tokens.color.surfaceHover, color: tokens.color.textMuted }
                    }
                  >
                    {formatPercent(y, 0)}
                  </button>
                ))}
              </div>
              <div>
                <label className={LABEL}>Eigener Wert</label>
                <SuffixInput suffix="%">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    step={0.1}
                    className={`${INPUT} pr-8`}
                    placeholder="z.B. 5.5"
                    value={customYield}
                    onChange={(e) => handleCustomYield(e.target.value)}
                  />
                </SuffixInput>
              </div>
            </div>
          </div>

          {/* ── RIGHT – Results ── */}
          <div>
            {!hasData ? (
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
                  <Tag size={28} color={tokens.color.textSubtle} />
                </motion.div>
                <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                  Kaltmiete eingeben
                </p>
                <p className="text-xs mt-1.5" style={{ color: tokens.color.textSubtle }}>
                  Ergebnisse erscheinen sofort.
                </p>
              </div>
            ) : verhandlungsResult && (
              <div className="flex flex-col gap-4">

                {/* Hero max Kaufpreis */}
                <div
                  className="rounded-[14px] px-6 py-6 text-center"
                  style={{
                    background: tokens.color.positiveBg,
                    border: `1px solid ${tokens.color.accentBorder}`,
                  }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                    style={{ color: tokens.color.positiveText }}
                  >
                    Max. Kaufpreis
                  </p>
                  <MetricValue
                    value={verhandlungsResult.max_kaufpreis}
                    formatter={(v) => formatCurrency(Math.round(v))}
                    className="text-[36px] font-semibold tracking-[-0.03em]"
                    style={{ color: tokens.color.positive }}
                  />
                  <p className="text-[11px] mt-2" style={{ color: tokens.color.textSubtle }}>
                    Gesamtinvestition inkl. 10% NK:{" "}
                    <span className="font-medium" style={{ color: tokens.color.textMuted }}>
                      {formatCurrency(Math.round(verhandlungsResult.max_kaufpreis_mit_nk))}
                    </span>
                  </p>
                  {Number(sqm) > 0 && (
                    <p className="text-[11px] mt-1" style={{ color: tokens.color.textSubtle }}>
                      Kaufpreis / m²:{" "}
                      <span className="font-medium" style={{ color: tokens.color.textMuted }}>
                        {formatCurrency(Math.round(verhandlungsResult.max_kaufpreis / Number(sqm)))}
                      </span>
                    </p>
                  )}
                </div>

                {/* Comparison with asking price */}
                {pp > 0 && (() => {
                  const cmp = compareWithAskingPrice(verhandlungsResult.max_kaufpreis, pp);
                  const verdictColor =
                    cmp.verdict === "angemessen"       ? tokens.color.positive
                    : cmp.verdict === "verhandlungsbedarf" ? tokens.color.warning
                    : tokens.color.danger;
                  const verdictBg =
                    cmp.verdict === "angemessen"       ? tokens.color.positiveBg
                    : cmp.verdict === "verhandlungsbedarf" ? tokens.color.warningBg
                    : tokens.color.dangerBg;
                  const verdictLabel =
                    cmp.verdict === "angemessen"       ? "Angemessen"
                    : cmp.verdict === "verhandlungsbedarf" ? "Verhandlungsbedarf"
                    : "Überteuert";
                  const maxVal    = Math.max(pp, verhandlungsResult.max_kaufpreis);
                  const greenPct  = (verhandlungsResult.max_kaufpreis / maxVal) * 100;
                  const redPct    = cmp.difference > 0 ? (cmp.difference / maxVal) * 100 : 0;
                  return (
                    <div
                      className="rounded-[14px] px-5 py-5"
                      style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold" style={{ color: tokens.color.textMuted }}>
                          Vergleich mit Anforderungspreis
                        </p>
                        <span
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ color: verdictColor, background: verdictBg }}
                        >
                          {verdictLabel}
                        </span>
                      </div>

                      {/* Range bar */}
                      <div className="mb-4">
                        <div
                          className="relative h-2.5 rounded-full overflow-hidden"
                          style={{ background: tokens.color.surfaceActive }}
                        >
                          <div
                            className="absolute h-full rounded-l-full"
                            style={{ width: `${greenPct}%`, background: tokens.color.positive }}
                          />
                          {redPct > 0 && (
                            <div
                              className="absolute h-full"
                              style={{
                                left: `${greenPct}%`,
                                width: `${redPct}%`,
                                background: tokens.color.danger,
                                borderRadius: redPct + greenPct >= 99 ? "0 9999px 9999px 0" : 0,
                              }}
                            />
                          )}
                        </div>
                        <div
                          className="flex justify-between mt-2 text-[10px]"
                          style={{ color: tokens.color.textSubtle }}
                        >
                          <span>Max. {formatCurrency(Math.round(verhandlungsResult.max_kaufpreis))}</span>
                          <span>Anforderung {formatCurrency(pp)}</span>
                        </div>
                      </div>

                      <div
                        className="flex justify-between items-center pt-3"
                        style={{ borderTop: `1px solid ${tokens.color.border}` }}
                      >
                        <span className="text-sm" style={{ color: tokens.color.textMuted }}>
                          Verhandlungsspielraum
                        </span>
                        <span
                          className="text-base font-semibold tabular-nums"
                          style={{ color: cmp.potential_savings > 0 ? tokens.color.danger : tokens.color.positive }}
                        >
                          {cmp.potential_savings > 0
                            ? `−${formatCurrency(Math.round(cmp.potential_savings))}`
                            : "Kein Abschlag nötig"}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Verhandlungsstrategie */}
                <div
                  className="rounded-[14px] px-5 py-5"
                  style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                    style={{ color: tokens.color.textMuted }}
                  >
                    Verhandlungsstrategie
                  </p>
                  {[
                    { label: "Ausgangsgebot (15% unter Max.)", value: verhandlungsResult.verhandlungspuffer_15, dim: true },
                    { label: "Zielgebot (10% unter Max.)",     value: verhandlungsResult.verhandlungspuffer_10, dim: false },
                    { label: "Maximum (Zielrendite genau)",    value: verhandlungsResult.max_kaufpreis,          dim: false },
                  ].map(({ label, value, dim }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center py-3"
                      style={{ borderBottom: `1px solid ${tokens.color.border}` }}
                    >
                      <span className="text-xs" style={{ color: dim ? tokens.color.textSubtle : tokens.color.textMuted }}>
                        {label}
                      </span>
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: tokens.color.text }}
                      >
                        {formatCurrency(Math.round(value))}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pro Tip */}
                <div
                  className="rounded-[12px] px-4 py-3 flex items-start gap-2.5"
                  style={{ background: tokens.color.accentSubtle, border: `1px solid ${tokens.color.accentBorder}` }}
                >
                  <PiggyBank size={14} color={tokens.color.accent} className="mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] leading-relaxed" style={{ color: tokens.color.textMuted }}>
                    Der Maximalpreis basiert auf der Bruttomietrendite. Nebenkosten (Notar, Grunderwerbsteuer,
                    Makler) sind im NK-Betrag berücksichtigt. Starte die Verhandlung mit dem Ausgangsgebot.
                  </p>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
