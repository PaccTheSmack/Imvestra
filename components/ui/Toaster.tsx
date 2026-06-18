"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CheckCircle,
  XCircle,
  Warning,
  Info,
  X,
} from "@phosphor-icons/react";
import { useToastStore, dismissToast, type ToastItem, type ToastType } from "@/lib/toast";
import { tokens } from "@/lib/tokens";

const CONFIG: Record<
  ToastType,
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  success: {
    icon: <CheckCircle size={16} weight="fill" color={tokens.color.positive} />,
    color: tokens.color.positive,
    bg: "rgba(34,197,94,0.06)",
    border: "rgba(34,197,94,0.18)",
  },
  error: {
    icon: <XCircle size={16} weight="fill" color={tokens.color.danger} />,
    color: tokens.color.danger,
    bg: tokens.color.dangerBg,
    border: "rgba(255,68,68,0.2)",
  },
  warning: {
    icon: <Warning size={16} weight="fill" color={tokens.color.warning} />,
    color: tokens.color.warning,
    bg: tokens.color.warningBg,
    border: "rgba(255,184,0,0.2)",
  },
  info: {
    icon: <Info size={16} weight="fill" color={tokens.color.accent} />,
    color: tokens.color.accent,
    bg: tokens.color.accentSubtle,
    border: tokens.color.accentBorder,
  },
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const prefersReduced = useReducedMotion();
  const cfg = CONFIG[toast.type];
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - start;
      const pct = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(pct);
      if (pct > 0) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [toast.duration]);

  return (
    <motion.div
      layout
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 56, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 56, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-[14px] w-[340px] max-w-[calc(100vw-2rem)]"
      style={{
        background: tokens.color.surface,
        border: `1px solid ${cfg.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)",
      }}
      whileHover={prefersReduced ? {} : { scale: 1.01 }}
    >
      {/* Content */}
      <div className="px-4 py-3.5 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug" style={{ color: tokens.color.text }}>
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: tokens.color.textMuted }}>
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={() => dismissToast(toast.id)}
          className="flex-shrink-0 mt-0.5 rounded-[6px] p-0.5 transition-colors duration-150"
          style={{ color: tokens.color.textSubtle }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = tokens.color.text)}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = tokens.color.textSubtle)}
          aria-label="Schließen"
        >
          <X size={13} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-[2px] transition-none"
        style={{
          width: `${progress}%`,
          background: cfg.color,
          opacity: 0.6,
        }}
      />
    </motion.div>
  );
}

export default function Toaster() {
  const { toasts } = useToastStore();

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="sync">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
