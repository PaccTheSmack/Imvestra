"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  animate,
  useReducedMotion,
} from "motion/react";
import {
  PlayCircle,
  CheckCircle,
  Gift,
} from "@phosphor-icons/react";
import FadeIn from "@/components/ui/FadeIn";


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
  { label: "BRUTTORENDITE", to: 5.51, formatter: (v: number) => `${v.toFixed(2).replace(".", ",")} %`, color: "#2D6A2D" },
  { label: "CASHFLOW/MO.", to: 148, formatter: (v: number) => `+${Math.round(v)} €`, color: "#2D6A2D" },
  { label: "NETTOMIETRENDIT.", to: 4.12, formatter: (v: number) => `${v.toFixed(2).replace(".", ",")} %`, color: "#2D6A2D" },
  { label: "LTV", to: 72, formatter: (v: number) => `${Math.round(v)} %`, color: "#101418" },
];

const DETAIL_ROWS = [
  { label: "Gesamtinvestition", value: "203.500 €", color: "#A89A7A", bold: false },
  { label: "Eff. Jahresmiete", value: "9.720 €", color: "#A89A7A", bold: false },
  { label: "NOI", value: "7.596 €", color: "#A89A7A", bold: false },
  { label: "Cashflow / Jahr", value: "+1.776 €", color: "#2D6A2D", bold: true },
];

export default function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="min-h-screen bg-[#F8F7F4] flex items-center pt-16 relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 85% 10%, rgba(160,120,48,0.04) 0%, rgba(160,120,48,0.02) 35%, transparent 65%), radial-gradient(ellipse 50% 40% at 70% 0%, rgba(160,120,48,0.03) 0%, transparent 55%)",
        }}
      />

      <div className="max-w-[1200px] mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
        {/* LEFT */}
        <div>
          <FadeIn delay={0.1}>
            <h1 className="text-[52px] lg:text-[62px] font-bold tracking-[-0.04em] leading-[1.05] text-[#101418] mb-6">
              Vom ersten<br />
              Maklertelefonat<br />
              <span
                style={{
                  background: "linear-gradient(to right, #A07830, #C9A86A)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                bis zum Exit.
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg text-[#6A5A3A] leading-relaxed max-w-[460px] mb-8">
              Das Betriebssystem für Immobilieninvestoren. Analysiere Deals,
              verwalte dein Portfolio und behalte jede Frist, Finanzierung und
              Kennzahl im Blick.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex items-center gap-4 flex-wrap mb-8">
              <motion.button
                whileHover={prefersReduced ? {} : { y: -1 }}
                whileTap={prefersReduced ? {} : { scale: 0.97 }}
                onClick={() => scrollTo("waitlist")}
                className="bg-[#A07830] text-white font-bold px-7 py-3.5 rounded-[10px] text-sm transition-shadow cursor-pointer hover:bg-[#8A6420]"
                style={{ boxShadow: "0 4px 20px rgba(160,120,48,0.25)" }}
              >
                Kostenlos starten →
              </motion.button>
              <button
                onClick={() => scrollTo("screenshots")}
                className="flex items-center gap-2 text-sm text-[#6A5A3A] hover:text-[#101418] transition-colors cursor-pointer"
              >
                <PlayCircle size={16} weight="fill" color="#A07830" />
                Produkt ansehen
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="flex items-center gap-5 flex-wrap text-xs text-[#A89A7A]">
              <div className="flex items-center gap-1.5">
                <Gift size={13} color="#A07830" />
                30 Tage kostenlos
              </div>
              {["Keine Kreditkarte", "DSGVO · Server Frankfurt"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={13} color="#A07830" weight="fill" />
                  {t}
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.5}>
            <div className="mt-10 pt-8 border-t border-[rgba(16,20,24,0.08)] flex items-center gap-10 flex-wrap">
              {[
                { value: "5,51 %", label: "Ø Bruttorendite im Beispiel" },
                { value: "+148 €", label: "Cashflow pro Monat" },
                { value: "0 €", label: "Zum Starten" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-[28px] font-semibold text-[#101418] tracking-[-0.02em] tabular-nums">{value}</p>
                  <p className="text-xs text-[#A89A7A] mt-0.5">{label}</p>
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
            className="bg-white border border-[rgba(16,20,24,0.08)] rounded-[16px] overflow-hidden"
            style={{ boxShadow: "0 24px 64px rgba(16,20,24,0.1)" }}
          >
            {/* Window bar */}
            <div className="bg-[#F0EDE4] border-b border-[rgba(16,20,24,0.08)] px-4 py-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28CA41" }} />
              <span className="text-xs text-[#A89A7A] ml-2">Imvestra – Renditerechner</span>
            </div>

            <div className="px-5 py-5">
              {/* Header row */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-[#101418]">Altbauwohnung Goslar</p>
                  <p className="text-xs text-[#6A5A3A] mt-0.5">185.000 € · 68 m²</p>
                </div>
                <span className="bg-[rgba(45,106,45,0.08)] text-[#2D6A2D] border border-[rgba(45,106,45,0.15)] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Positiver Cashflow
                </span>
              </div>

              {/* Metric pills */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {METRIC_PILLS.map((m) => (
                  <div key={m.label} className="bg-[#F8F7F4] border border-[rgba(16,20,24,0.07)] rounded-[8px] px-3 py-2.5">
                    <p className="text-[9px] text-[#A89A7A] uppercase tracking-wide">{m.label}</p>
                    <CountUp to={m.to} formatter={m.formatter} color={m.color} />
                  </div>
                ))}
              </div>

              <div className="border-t border-[rgba(16,20,24,0.06)] my-4" />

              <div className="flex flex-col gap-1.5">
                {DETAIL_ROWS.map((r) => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-[#A89A7A]">{r.label}</span>
                    <span style={{ color: r.color, fontWeight: r.bold ? 600 : 500 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
