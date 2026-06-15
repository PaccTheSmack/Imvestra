"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  animate,
  useReducedMotion,
} from "motion/react";
import {
  TrendUp,
  PlayCircle,
  CheckCircle,
  ChartLine,
} from "@phosphor-icons/react";
import FadeIn from "@/components/ui/FadeIn";

const GRADIENT_TEXT: React.CSSProperties = {
  background: "linear-gradient(135deg, #00E0D7 0%, #007A74 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function CountUp({
  to,
  formatter,
  color,
}: {
  to: number;
  formatter: (v: number) => string;
  color: string;
}) {
  const prefersReduced = useReducedMotion();
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(() => formatter(0));

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(formatter(to));
      return;
    }
    const ctrl = animate(mv, to, { duration: 1.8, ease: "easeOut" });
    const unsub = mv.on("change", (v) => setDisplay(formatter(v)));
    return () => {
      ctrl.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, prefersReduced]);

  return (
    <p className="text-sm font-semibold" style={{ color }}>
      {display}
    </p>
  );
}

const METRIC_PILLS = [
  { label: "BRUTTORENDITE", to: 5.51, formatter: (v: number) => `${v.toFixed(2).replace(".", ",")} %`, color: "#00E0D7" },
  { label: "CASHFLOW/MO.", to: 148, formatter: (v: number) => `+${Math.round(v)} €`, color: "#00E0D7" },
  { label: "NETTOMIETRENDIT.", to: 4.12, formatter: (v: number) => `${v.toFixed(2).replace(".", ",")} %`, color: "#00E0D7" },
  { label: "LTV", to: 72, formatter: (v: number) => `${Math.round(v)} %`, color: "#FFFFFF" },
];

const DETAIL_ROWS = [
  { label: "Gesamtinvestition", value: "203.500 €", color: "#888", bold: false },
  { label: "Eff. Jahresmiete", value: "9.720 €", color: "#888", bold: false },
  { label: "NOI", value: "7.596 €", color: "#888", bold: false },
  { label: "Cashflow / Jahr", value: "+1.776 €", color: "#00E0D7", bold: true },
];

export default function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="min-h-screen bg-[#080808] flex items-center pt-16 relative overflow-hidden">
      {/* Background decorations */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 700,
          height: 700,
          background: "radial-gradient(circle, rgba(0,224,215,0.07) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.3,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="max-w-[1200px] mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
        {/* LEFT */}
        <div>
          <FadeIn delay={0}>
            <div className="inline-flex items-center gap-2 bg-[rgba(0,224,215,0.08)] border border-[rgba(0,224,215,0.15)] text-[#00E0D7] text-xs font-medium px-3 py-1.5 rounded-full mb-5">
              <TrendUp size={12} />
              Das Betriebssystem für Immobilieninvestoren
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-[52px] lg:text-[62px] font-semibold tracking-[-0.04em] leading-[1.05] text-white mb-6">
              Vom ersten<br />
              Maklertelefonat<br />
              <span style={GRADIENT_TEXT}>bis zum Exit.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg text-[#555] leading-relaxed max-w-[460px] mb-8">
              Die Schaltzentrale für Immobilieninvestoren. Analysiere Deals,
              verwalte dein Portfolio und behalte jede Frist, Finanzierung und
              Kennzahl im Blick.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex items-center gap-4 flex-wrap mb-8">
              <motion.button
                whileHover={prefersReduced ? {} : { scale: 1.03 }}
                whileTap={prefersReduced ? {} : { scale: 0.97 }}
                onClick={() => scrollTo("waitlist")}
                className="bg-[#00E0D7] text-[#080808] font-bold px-7 py-3.5 rounded-[10px] text-sm transition-shadow cursor-pointer"
                style={{ boxShadow: "0 0 30px rgba(0,224,215,0.2)" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 40px rgba(0,224,215,0.35)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 30px rgba(0,224,215,0.2)")}
              >
                Kostenlos starten →
              </motion.button>
              <button
                onClick={() => scrollTo("screenshots")}
                className="flex items-center gap-2 text-sm text-[#555] hover:text-white transition-colors cursor-pointer"
              >
                <PlayCircle size={16} weight="fill" color="#00E0D7" />
                Produkt ansehen
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="flex items-center gap-5 flex-wrap text-xs text-[#444]">
              {["Kostenlos starten", "Keine Kreditkarte", "DSGVO · Server Frankfurt"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={13} color="#00E0D7" weight="fill" />
                  {t}
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.5}>
            <div className="mt-10 pt-8 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-10 flex-wrap">
              {[
                { value: "12+", label: "Features im Tool" },
                { value: "< 2 Min.", label: "Bis zur ersten Analyse" },
                { value: "0€", label: "Zum Starten" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-[28px] font-semibold text-white tracking-[-0.02em]">{value}</p>
                  <p className="text-xs text-[#444] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* RIGHT */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative"
        >
          {/* Main card */}
          <div
            className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[20px] overflow-hidden"
            style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)" }}
          >
            {/* Window bar */}
            <div className="bg-[#0C0C0C] border-b border-[rgba(255,255,255,0.06)] px-4 py-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28CA41" }} />
              <span className="text-xs text-[#444] ml-2">Imvestra – Renditerechner</span>
            </div>

            <div className="px-5 py-5">
              {/* Header row */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-white">Altbauwohnung Goslar</p>
                  <p className="text-xs text-[#555] mt-0.5">185.000 € · 68 m²</p>
                </div>
                <span className="bg-[rgba(0,224,215,0.1)] text-[#00E0D7] border border-[rgba(0,224,215,0.2)] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Positiver Cashflow
                </span>
              </div>

              {/* Metric pills */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {METRIC_PILLS.map((m) => (
                  <div key={m.label} className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-3 py-2.5">
                    <p className="text-[9px] text-[#444] uppercase tracking-wide">{m.label}</p>
                    <CountUp to={m.to} formatter={m.formatter} color={m.color} />
                  </div>
                ))}
              </div>

              <div className="border-t border-[rgba(255,255,255,0.05)] my-4" />

              <div className="flex flex-col gap-1.5">
                {DETAIL_ROWS.map((r) => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-[#444]">{r.label}</span>
                    <span style={{ color: r.color, fontWeight: r.bold ? 600 : 500 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating badge 1 */}
          <motion.div
            animate={prefersReduced ? {} : { y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-5 -right-5 z-10 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-[12px] px-4 py-3 flex items-center gap-2.5"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.7)" }}
          >
            <ChartLine size={15} color="#00E0D7" weight="fill" />
            <div>
              <p className="text-[10px] text-[#555]">Rendite berechnet</p>
              <p className="text-sm font-semibold text-white mt-0.5">5,51 %</p>
            </div>
          </motion.div>

          {/* Floating badge 2 */}
          <motion.div
            animate={prefersReduced ? {} : { y: [0, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-5 -left-5 z-10 bg-[#00E0D7] rounded-[12px] px-4 py-3 flex items-center gap-2.5"
            style={{ boxShadow: "0 8px 32px rgba(0,224,215,0.3)" }}
          >
            <CheckCircle size={15} color="#080808" weight="fill" />
            <div>
              <p className="text-[10px] text-[#080808] opacity-70">PDF erstellt</p>
              <p className="text-sm font-semibold text-[#080808] mt-0.5">Bankpräsentation</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
