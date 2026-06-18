"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  TrendDown,
  TrendUp,
  ArrowRight,
  Bank,
  Info,
} from "@phosphor-icons/react";
import { tokens } from "@/lib/tokens";
import { formatCurrency, formatCurrencySigned } from "@/lib/format";
import FadeIn from "@/components/ui/FadeIn";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Financing {
  id: string;
  bank?: string | null;
  loan_amount: number;
  interest_rate: number;
  repayment_rate: number;
  rate_monthly: number;
  fixed_until?: string | null;
  current_debt?: number | null;
  propertyName?: string;
  propertyType?: string;
}

interface SzenarioRechnerProps {
  financings: Financing[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function yearsUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return 99;
  return (new Date(dateStr).getTime() - Date.now()) / (365.25 * 86400000);
}

function computeNewMonthlyRate(f: Financing, newInterestRate: number): number {
  const restschuld = f.current_debt ?? f.loan_amount;
  return (restschuld * (newInterestRate + f.repayment_rate)) / 1200;
}

// ─── Slider ──────────────────────────────────────────────────────────────────

function RateSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const min = -2;
  const max = 5;
  const step = 0.25;
  const pct = ((value - min) / (max - min)) * 100;
  const color = value > 0 ? tokens.color.danger : value < 0 ? tokens.color.positive : tokens.color.accent;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: tokens.color.textSubtle }}>
          Zinsänderung
        </span>
        <span
          className="tabular-nums text-[22px] font-semibold leading-none"
          style={{ color }}
        >
          {value >= 0 ? "+" : ""}{value.toFixed(2).replace(".", ",")} %
        </span>
      </div>

      {/* Custom slider track */}
      <div className="relative h-8 flex items-center">
        <div
          className="absolute inset-x-0 h-[3px] rounded-full"
          style={{ background: tokens.color.border }}
        />
        {/* Zero marker */}
        <div
          className="absolute h-2 w-px"
          style={{
            left: `${((-min) / (max - min)) * 100}%`,
            background: tokens.color.borderStrong,
          }}
        />
        {/* Fill */}
        {value !== 0 && (
          <div
            className="absolute h-[3px] rounded-full"
            style={{
              left: value > 0 ? `${((-min) / (max - min)) * 100}%` : `${pct}%`,
              width: `${Math.abs(value) / (max - min) * 100}%`,
              background: color,
            }}
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-8"
          aria-label="Zinsänderung"
        />
        {/* Thumb */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 shadow-lg pointer-events-none"
          style={{
            left: `calc(${pct}% - 8px)`,
            background: tokens.color.surface,
            borderColor: color,
            boxShadow: `0 0 0 3px ${color}22`,
          }}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between">
        <span className="text-[10px] tabular-nums" style={{ color: tokens.color.textSubtle }}>−2 %</span>
        <span className="text-[10px] tabular-nums" style={{ color: tokens.color.textSubtle }}>0 %</span>
        <span className="text-[10px] tabular-nums" style={{ color: tokens.color.textSubtle }}>+5 %</span>
      </div>

      {/* Quick presets */}
      <div className="flex gap-2 flex-wrap">
        {[-1, 0, 1, 2, 3].map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className="rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-150"
            style={{
              background: value === preset ? `${color}18` : tokens.color.surface,
              border: `1px solid ${value === preset ? color : tokens.color.border}`,
              color: value === preset ? color : tokens.color.textMuted,
            }}
          >
            {preset >= 0 ? "+" : ""}{preset} %
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Break-Even Bar ───────────────────────────────────────────────────────────

function BreakEvenBar({ breakEvenRate }: { breakEvenRate: number | null }) {
  if (breakEvenRate === null) return null;

  const min = 0;
  const max = 8;
  const pct = Math.min(100, Math.max(0, ((breakEvenRate - min) / (max - min)) * 100));

  return (
    <div
      className="rounded-[12px] p-4"
      style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: tokens.color.textSubtle }}>
          Break-Even Zinssatz
        </span>
        <div className="flex items-center gap-1.5">
          <Info size={12} color={tokens.color.textSubtle} aria-hidden="true" />
          <span className="text-[11px]" style={{ color: tokens.color.textSubtle }}>
            Portfolio kippt ins Negative
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="tabular-nums text-[28px] font-semibold leading-none" style={{ color: tokens.color.warning }}>
          {breakEvenRate.toFixed(2).replace(".", ",")} %
        </span>
        <span className="text-[12px]" style={{ color: tokens.color.textMuted }}>
          Effektivzins
        </span>
      </div>
      <div className="relative h-[4px] rounded-full overflow-hidden" style={{ background: tokens.color.border }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${tokens.color.positive} 0%, ${tokens.color.warning} 60%, ${tokens.color.danger} 100%)`,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{ left: `calc(${pct}% - 4px)`, background: tokens.color.warning }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] tabular-nums" style={{ color: tokens.color.textSubtle }}>0 %</span>
        <span className="text-[10px] tabular-nums" style={{ color: tokens.color.textSubtle }}>8 %</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SzenarioRechner({ financings }: SzenarioRechnerProps) {
  const [delta, setDelta] = useState(1.0);
  const [showAll, setShowAll] = useState(false);
  const prefersReduced = useReducedMotion();

  const activeFinancings = useMemo(() =>
    financings.filter(f => f.loan_amount > 0),
    [financings]
  );

  const relevantFinancings = useMemo(() =>
    showAll
      ? activeFinancings
      : activeFinancings.filter(f => yearsUntil(f.fixed_until) <= 3),
    [activeFinancings, showAll]
  );

  // Portfolio-level impact
  const portfolioImpact = useMemo(() => {
    let currentTotal = 0;
    let scenarioTotal = 0;
    let negativeCount = 0;

    for (const f of activeFinancings) {
      currentTotal += f.rate_monthly;
      const newRate = f.interest_rate + delta;
      const newMonthly = computeNewMonthlyRate(f, newRate);
      scenarioTotal += newMonthly;
      if (newMonthly > f.rate_monthly + 200) negativeCount++;
    }

    return {
      currentTotal,
      scenarioTotal,
      delta: currentTotal - scenarioTotal, // positive = savings, negative = extra cost
      negativeCount,
    };
  }, [activeFinancings, delta]);

  // Break-even: binary search for rate delta where portfolio becomes cashflow-negative
  // Simplified: find the average rate increase that pushes total rates up by X
  const breakEvenRate = useMemo(() => {
    if (activeFinancings.length === 0) return null;
    // Find average current interest rate
    const avgRate = activeFinancings.reduce((sum, f) => sum + f.interest_rate, 0) / activeFinancings.length;

    // Binary search: find delta where total new rates exceed some threshold
    // We assume break-even = when total monthly rate increase exceeds portfolio cashflow buffer
    // For simplicity: find the rate at which each financing doubles its cost
    // Better: just show the avg rate + delta at which total monthly cost increases by 50%
    const totalCurrent = activeFinancings.reduce((sum, f) => sum + f.rate_monthly, 0);
    if (totalCurrent === 0) return null;

    // Find delta such that total cost increases by 30% (rough stress test)
    let lo = 0;
    let hi = 8;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      const total = activeFinancings.reduce((sum, f) => {
        return sum + computeNewMonthlyRate(f, f.interest_rate + mid);
      }, 0);
      if (total > totalCurrent * 1.3) hi = mid;
      else lo = mid;
    }
    return avgRate + (lo + hi) / 2;
  }, [activeFinancings]);

  if (activeFinancings.length === 0) {
    return (
      <FadeIn>
        <div
          className="rounded-[16px] p-8 text-center"
          style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
        >
          <Bank size={32} color={tokens.color.textSubtle} className="mx-auto mb-3" aria-hidden="true" />
          <p className="text-[14px] font-semibold mb-1" style={{ color: tokens.color.text }}>
            Keine Darlehen vorhanden
          </p>
          <p className="text-[12px]" style={{ color: tokens.color.textMuted }}>
            Füge ein Darlehen hinzu um Zinsszenarien zu simulieren.
          </p>
        </div>
      </FadeIn>
    );
  }

  const costColor = portfolioImpact.delta < 0 ? tokens.color.danger : tokens.color.positive;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Slider Card ── */}
      <FadeIn delay={0}>
        <div
          className="rounded-[16px] p-5"
          style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
        >
          <RateSlider value={delta} onChange={setDelta} />
        </div>
      </FadeIn>

      {/* ── Portfolio Impact Summary ── */}
      <FadeIn delay={0.06}>
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-[14px] p-4"
            style={{
              background: delta !== 0 ? `${costColor}08` : tokens.color.surface,
              border: `1px solid ${delta !== 0 ? `${costColor}20` : tokens.color.border}`,
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2" style={{ color: tokens.color.textSubtle }}>
              Mehrkosten / Monat
            </p>
            <div className="flex items-baseline gap-1.5">
              {delta < 0
                ? <TrendDown size={18} color={tokens.color.positive} weight="bold" aria-hidden="true" />
                : <TrendUp size={18} color={delta > 0 ? tokens.color.danger : tokens.color.textSubtle} weight="bold" aria-hidden="true" />
              }
              <span
                className="tabular-nums text-[24px] font-semibold leading-none"
                style={{ color: delta !== 0 ? costColor : tokens.color.textMuted }}
              >
                {delta === 0
                  ? "±0 €"
                  : formatCurrencySigned(-portfolioImpact.delta)
                }
              </span>
            </div>
            {delta !== 0 && (
              <p className="text-[11px] mt-1.5" style={{ color: tokens.color.textMuted }}>
                {portfolioImpact.currentTotal > 0 &&
                  `${Math.abs((portfolioImpact.delta / portfolioImpact.currentTotal) * 100).toFixed(1).replace(".", ",")} % der aktuellen Rate`
                }
              </p>
            )}
          </div>

          <div
            className="rounded-[14px] p-4"
            style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2" style={{ color: tokens.color.textSubtle }}>
              Neue Gesamtrate
            </p>
            <span className="tabular-nums text-[24px] font-semibold leading-none" style={{ color: tokens.color.text }}>
              {formatCurrency(portfolioImpact.scenarioTotal)}
            </span>
            <p className="text-[11px] mt-1.5" style={{ color: tokens.color.textMuted }}>
              Aktuell: {formatCurrency(portfolioImpact.currentTotal)}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* ── Break-even ── */}
      <FadeIn delay={0.1}>
        <BreakEvenBar breakEvenRate={breakEvenRate} />
      </FadeIn>

      {/* ── Per-Financing Breakdown ── */}
      <FadeIn delay={0.14}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: tokens.color.textSubtle }}>
            {showAll ? "Alle Darlehen" : "Darlehen mit Fälligkeit ≤ 3 J."}
          </span>
          {activeFinancings.length > relevantFinancings.length && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-[11px] font-semibold flex items-center gap-1"
              style={{ color: tokens.color.accent }}
            >
              {showAll ? "Nur Fällige" : "Alle anzeigen"}
              <ArrowRight size={11} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>

        {relevantFinancings.length === 0 && (
          <div
            className="rounded-[12px] p-4 text-center"
            style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
          >
            <p className="text-[13px]" style={{ color: tokens.color.textMuted }}>
              Keine Darlehen in den nächsten 3 Jahren fällig.
            </p>
            <button
              onClick={() => setShowAll(true)}
              className="mt-2 text-[12px] font-semibold"
              style={{ color: tokens.color.accent }}
            >
              Alle Darlehen anzeigen
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {relevantFinancings.map((f, i) => {
            const scenarioInterest = f.interest_rate + delta;
            const newMonthly = computeNewMonthlyRate(f, scenarioInterest);
            const diff = newMonthly - f.rate_monthly;
            const diffColor = diff > 50 ? tokens.color.danger : diff < -50 ? tokens.color.positive : tokens.color.textMuted;
            const expiry = f.fixed_until ? new Date(f.fixed_until).toLocaleDateString("de-DE", { month: "short", year: "numeric" }) : "offen";
            const years = yearsUntil(f.fixed_until);
            const urgentColor = years < 0.5 ? tokens.color.danger : years < 1 ? tokens.color.warning : tokens.color.textSubtle;

            return (
              <motion.div
                key={f.id}
                initial={prefersReduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[14px] p-4"
                style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold leading-tight" style={{ color: tokens.color.text }}>
                      {f.propertyName ?? f.bank ?? "Darlehen"}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: tokens.color.textSubtle }}>
                      {f.bank ?? "Bank"} · Zinsbindung bis{" "}
                      <span style={{ color: urgentColor }}>{expiry}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px]" style={{ color: tokens.color.textSubtle }}>Restschuld</p>
                    <p className="tabular-nums text-[13px] font-semibold" style={{ color: tokens.color.text }}>
                      {formatCurrency(f.current_debt ?? f.loan_amount)}
                    </p>
                  </div>
                </div>

                {/* Rate comparison */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.06em] mb-1" style={{ color: tokens.color.textSubtle }}>Aktuell</p>
                    <p className="tabular-nums text-[13px] font-semibold" style={{ color: tokens.color.text }}>
                      {f.interest_rate.toFixed(2).replace(".", ",")} %
                    </p>
                    <p className="tabular-nums text-[11px]" style={{ color: tokens.color.textMuted }}>
                      {formatCurrency(f.rate_monthly)} / Mo.
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.06em] mb-1" style={{ color: tokens.color.textSubtle }}>Szenario</p>
                    <p
                      className="tabular-nums text-[13px] font-semibold"
                      style={{ color: scenarioInterest > f.interest_rate ? tokens.color.danger : tokens.color.positive }}
                    >
                      {scenarioInterest.toFixed(2).replace(".", ",")} %
                    </p>
                    <p className="tabular-nums text-[11px]" style={{ color: tokens.color.textMuted }}>
                      {formatCurrency(newMonthly)} / Mo.
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.06em] mb-1" style={{ color: tokens.color.textSubtle }}>Delta</p>
                    <p
                      className="tabular-nums text-[13px] font-semibold"
                      style={{ color: diffColor }}
                    >
                      {formatCurrencySigned(diff)}
                    </p>
                    <p className="text-[11px]" style={{ color: tokens.color.textMuted }}>pro Monat</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </FadeIn>

    </div>
  );
}
