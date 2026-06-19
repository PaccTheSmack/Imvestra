"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  CheckCircle,
  Gift,
  PlayCircle,
} from "@phosphor-icons/react";

/* Dynamic import — no SSR so three.js doesn't crash on server */
const BeamsCanvas = dynamic(() => import("./BeamsCanvas"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0D0B07]" />,
});

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function BeamsHero() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-[#0D0B07] flex items-center">
      {/* Canvas background */}
      <div className="absolute inset-0 z-0">
        <BeamsCanvas />
      </div>

      {/* Edge vignette */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, rgba(13,11,7,0.65) 100%)",
        }}
      />
      {/* Center text-protection: darkens the middle where copy lives */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(13,11,7,0.55) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-32 w-full flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-semibold tracking-wide"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(201,168,106,0.25)",
            color: "#C9A86A",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#C9A86A", boxShadow: "0 0 6px #C9A86A" }}
          />
          Jetzt in der Beta — Früh-Zugang sichern
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="text-[48px] sm:text-[64px] lg:text-[78px] font-bold tracking-[-0.04em] leading-[1.0] max-w-[880px] mb-6"
          style={{ color: "rgba(255,255,255,0.95)", textWrap: "balance", textShadow: "0 2px 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.6)" } as React.CSSProperties}
        >
          Das Betriebssystem für{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #F0D991 0%, #C9A86A 40%, #A07830 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Immobilieninvestoren.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-base sm:text-lg leading-relaxed max-w-[520px] mb-10"
          style={{ color: "rgba(255,255,255,0.75)", textShadow: "0 1px 20px rgba(0,0,0,0.9)" }}
        >
          Analysiere Deals, verwalte dein Portfolio und behalte jede Frist,
          Finanzierung und Kennzahl im Blick. Vom ersten Angebot bis zum Exit.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex items-center gap-4 flex-wrap justify-center mb-10"
        >
          <motion.button
            whileHover={prefersReduced ? {} : { scale: 1.03, y: -1 }}
            whileTap={prefersReduced ? {} : { scale: 0.97 }}
            onClick={() => scrollTo("waitlist")}
            className="flex items-center gap-2 px-7 py-3.5 rounded-[10px] font-bold text-sm cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #C9A86A 0%, #A07830 100%)",
              color: "#0D0B07",
              boxShadow: "0 4px 24px rgba(160,120,48,0.4), 0 0 0 1px rgba(201,168,106,0.2)",
            }}
          >
            Kostenlos starten
            <ArrowRight size={15} weight="bold" />
          </motion.button>
          <motion.button
            whileHover={prefersReduced ? {} : { y: -1 }}
            whileTap={prefersReduced ? {} : { scale: 0.97 }}
            onClick={() => scrollTo("screenshots")}
            className="flex items-center gap-2 px-6 py-3.5 rounded-[10px] font-semibold text-sm cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
            }}
          >
            <PlayCircle size={15} weight="fill" style={{ color: "#C9A86A" }} />
            Produkt ansehen
          </motion.button>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-center gap-5 flex-wrap justify-center text-xs"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <div className="flex items-center gap-1.5">
            <Gift size={13} style={{ color: "#C9A86A" }} />
            30 Tage kostenlos
          </div>
          {["Keine Kreditkarte", "DSGVO · Server Frankfurt"].map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <CheckCircle size={13} weight="fill" style={{ color: "#C9A86A" }} />
              {t}
            </div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 pt-8 flex items-center gap-12 flex-wrap justify-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          {[
            { value: "1.000+", label: "Objekte analysiert" },
            { value: "50+", label: "Investoren vertrauen uns" },
            { value: "0 €", label: "Zum Starten" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p
                className="text-[30px] font-bold tracking-[-0.03em] tabular-nums"
                style={{
                  background: "linear-gradient(135deg, #F0D991 0%, #C9A86A 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {value}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                {label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
