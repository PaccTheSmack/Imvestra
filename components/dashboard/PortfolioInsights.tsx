"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Warning,
  ArrowRight,
  Info,
  Lightbulb,
  ShieldWarning,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { PortfolioHealthScore, PortfolioInsight } from "@/lib/portfolio-insights";
import { tokens } from "@/lib/tokens";

// ─── Score Ring ──────────────────────────────────────────────────────────────

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ScoreRing({
  score,
  color,
}: {
  score: number;
  color: string;
}) {
  const prefersReduced = useReducedMotion();
  const [displayed, setDisplayed] = useState(prefersReduced ? score : 0);

  useEffect(() => {
    if (prefersReduced) { setDisplayed(score); return; }
    const start = performance.now();
    const duration = 1400;
    const raf = requestAnimationFrame(function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      // ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [score, prefersReduced]);

  const fillLength = (displayed / 100) * RING_CIRCUMFERENCE;
  const gapLength = RING_CIRCUMFERENCE - fillLength;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 108, height: 108 }}>
      <svg width="108" height="108" viewBox="0 0 108 108" aria-hidden="true" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx="54"
          cy="54"
          r={RING_RADIUS}
          fill="none"
          stroke={tokens.color.border}
          strokeWidth="6"
        />
        {/* Fill */}
        <circle
          cx="54"
          cy="54"
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${fillLength} ${gapLength}`}
          style={{ transition: prefersReduced ? "none" : "stroke-dasharray 0.05s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="tabular-nums font-semibold leading-none"
          style={{ fontSize: 28, color }}
        >
          {displayed}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: tokens.color.textSubtle }}>
          Score
        </span>
      </div>
    </div>
  );
}

// ─── Dimension Bar ────────────────────────────────────────────────────────────

function DimensionBar({
  label,
  score,
  color,
  detail,
  delay,
}: {
  label: string;
  score: number;
  color: string;
  detail: string;
  delay: number;
}) {
  const prefersReduced = useReducedMotion();
  const pct = (score / 25) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: tokens.color.textSubtle }}>
          {label}
        </span>
        <span className="text-[11px] tabular-nums" style={{ color }}>
          {detail}
        </span>
      </div>
      <div
        className="relative h-[3px] w-full overflow-hidden rounded-full"
        style={{ background: tokens.color.border }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }
          }
        />
      </div>
    </div>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

const INSIGHT_CONFIG = {
  risk: {
    icon: ShieldWarning,
    color: tokens.color.danger,
    bg: tokens.color.dangerBg,
    border: "rgba(185,28,28,0.15)",
    label: "Risiko",
  },
  warning: {
    icon: Warning,
    color: tokens.color.warning,
    bg: tokens.color.warningBg,
    border: "rgba(255,184,0,0.15)",
    label: "Hinweis",
  },
  opportunity: {
    icon: Lightbulb,
    color: tokens.color.positive,
    bg: tokens.color.positiveBg,
    border: "rgba(34,197,94,0.15)",
    label: "Chance",
  },
  info: {
    icon: Info,
    color: tokens.color.accent,
    bg: "rgba(160,120,48,0.06)",
    border: tokens.color.borderAccent,
    label: "Info",
  },
};

function InsightCard({
  insight,
  index,
}: {
  insight: PortfolioInsight;
  index: number;
}) {
  const prefersReduced = useReducedMotion();
  const cfg = INSIGHT_CONFIG[insight.type];
  const Icon = cfg.icon;

  const content = (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group flex items-start gap-3 rounded-[12px] p-4"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]"
        style={{ background: `${cfg.color}18` }}
      >
        <Icon size={14} weight="bold" color={cfg.color} aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold leading-tight" style={{ color: tokens.color.text }}>
            {insight.title}
          </span>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
            style={{ background: `${cfg.color}18`, color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: tokens.color.textMuted }}>
          {insight.body}
        </p>
        {insight.href && (
          <div className="mt-1 flex items-center gap-1" style={{ color: cfg.color }}>
            <span className="text-[11px] font-semibold">Details ansehen</span>
            <ArrowRight
              size={11}
              weight="bold"
              className="transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </motion.div>
  );

  if (insight.href) {
    return <Link href={insight.href} className="block">{content}</Link>;
  }
  return content;
}

// ─── Public Component ─────────────────────────────────────────────────────────

interface PortfolioInsightsProps {
  score: PortfolioHealthScore;
  insights: PortfolioInsight[];
}

export default function PortfolioInsights({ score, insights }: PortfolioInsightsProps) {
  const prefersReduced = useReducedMotion();

  if (insights.length === 0 && score.total >= 90) return null;

  return (
    <motion.section
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Portfolio-Gesundheit"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: tokens.color.textSubtle }}>
            Portfolio-Analyse
          </span>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: `${score.color}14`, color: score.color }}
        >
          {score.label}
        </span>
      </div>

      {/* Score + Dimensions */}
      <div
        className="mb-4 rounded-[16px] p-5"
        style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
      >
        <div className="flex items-center gap-6">
          <ScoreRing score={score.total} color={score.color} />
          <div className="flex flex-1 flex-col gap-3">
            {score.dimensions.map((dim, i) => (
              <DimensionBar
                key={dim.key}
                label={dim.label}
                score={dim.score}
                color={dim.color}
                detail={dim.detail}
                delay={0.1 + i * 0.07}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Insight Cards */}
      {insights.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {insights.map((insight, i) => (
            <InsightCard key={`${insight.type}-${i}`} insight={insight} index={i} />
          ))}
        </div>
      )}
    </motion.section>
  );
}
