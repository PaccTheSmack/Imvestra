"use client";

import { motion, useReducedMotion } from "motion/react";
import { Lock, Lightning } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { tokens } from "@/lib/tokens";

interface GateOverlayProps {
  feature: string;
  description: string;
}

export default function GateOverlay({ feature, description }: GateOverlayProps) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReduced ? 0 : 0.2 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[inherit]"
      style={{
        background: "rgba(8,8,8,0.85)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        className="w-11 h-11 rounded-[12px] flex items-center justify-center mb-4"
        style={{ background: tokens.color.surfaceHover, border: `1px solid ${tokens.color.border}` }}
      >
        <Lock size={20} color={tokens.color.textSubtle} />
      </div>
      <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
        {feature}
      </p>
      <p
        className="text-xs mt-1 text-center max-w-[240px]"
        style={{ color: tokens.color.textMuted }}
      >
        {description}
      </p>
      <motion.button
        whileHover={prefersReduced ? {} : { scale: 1.03 }}
        whileTap={prefersReduced ? {} : { scale: 0.97 }}
        onClick={() => router.push("/settings")}
        className="mt-5 flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-[8px] transition-all"
        style={{
          background: tokens.color.accent,
          color: tokens.color.bg,
          boxShadow: tokens.shadow.accent,
        }}
      >
        <Lightning size={13} weight="fill" />
        Auf Pro upgraden
      </motion.button>
    </motion.div>
  );
}
