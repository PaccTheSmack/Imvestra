"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle, ShieldCheck } from "@phosphor-icons/react";
import FadeIn from "@/components/ui/FadeIn";
import type { Plan } from "@/types";
import { PLAN_CONFIG } from "@/types";

const PLAN_ORDER: Plan[] = ["free", "investor", "manager", "team"];

function formatPrice(n: number) {
  return Number.isInteger(n) ? `${n}€` : `${n.toString().replace(".", ",")}€`;
}

export default function PricingSection() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const prefersReduced = useReducedMotion();

  function handleCTA(plan: Plan) {
    if (plan === "free") {
      router.push("/register");
    } else {
      router.push(`/register?plan=${plan}`);
    }
  }

  return (
    <section id="preise" className="bg-[#080808] py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-12">
            <span className="inline-flex bg-[#1A1A1A] border border-[rgba(255,255,255,0.08)] text-[#777] text-xs px-3 py-1 rounded-full">
              Preise
            </span>
            <h2 className="text-[44px] font-semibold tracking-[-0.03em] text-white mt-4">
              Transparent. Fair.
            </h2>
            <p className="text-[#777] text-lg mt-4">Kein Abo-Fallen. Kein Kleingedrucktes.</p>
          </div>
        </FadeIn>

        {/* Billing toggle */}
        <div className="flex justify-center items-center mb-10">
          <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] p-1 rounded-[10px] inline-flex items-center">
            <button
              onClick={() => setIsYearly(false)}
              className="px-5 py-2 rounded-[8px] text-sm cursor-pointer transition-all"
              style={!isYearly ? { background: "#1A1A1A", color: "#fff", fontWeight: 500 } : { color: "#777" }}
            >
              Monatlich
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className="px-5 py-2 rounded-[8px] text-sm cursor-pointer transition-all flex items-center"
              style={isYearly ? { background: "#1A1A1A", color: "#fff", fontWeight: 500 } : { color: "#777" }}
            >
              Jährlich
              <span className="bg-[rgba(0,224,215,0.1)] text-[#00E0D7] text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                sparen
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {PLAN_ORDER.map((planId, i) => {
            const cfg = PLAN_CONFIG[planId];
            const highlighted = cfg.highlighted;
            const isFree = planId === "free";
            const price = isFree
              ? "0€"
              : isYearly
              ? formatPrice(cfg.price_yearly)
              : formatPrice(cfg.price_monthly);
            const interval = isFree ? "" : isYearly ? "/Jahr" : "/Monat";

            return (
              <FadeIn key={planId} delay={i * 0.08}>
                <div
                  className="relative rounded-[20px] p-6 h-full flex flex-col"
                  style={
                    highlighted
                      ? { background: "#080808", border: "2px solid #00E0D7", boxShadow: "0 0 60px rgba(0,224,215,0.08)" }
                      : { background: "#111", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {highlighted && (
                    <div
                      className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00E0D7] text-[#080808] text-[10px] font-bold px-4 py-1.5 rounded-full whitespace-nowrap"
                      style={{ boxShadow: "0 0 20px rgba(0,224,215,0.4)" }}
                    >
                      Beliebteste Wahl
                    </div>
                  )}

                  <p
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: highlighted ? "#00E0D7" : "#777" }}
                  >
                    {cfg.name}
                  </p>

                  <div className="mt-3 min-h-[60px]">
                    <div className="flex items-end gap-1">
                      <span className="text-[36px] font-semibold text-white tracking-[-0.03em] leading-none transition-all duration-200">
                        {price}
                      </span>
                      {interval && <span className="text-sm text-[#777] mb-1">{interval}</span>}
                    </div>
                    <p className="text-xs text-[#666] mt-2">{cfg.description}</p>
                    {!isFree && (
                      <p className="text-xs text-[#00E0D7] mt-1">30 Tage kostenlos testen</p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-col gap-2.5 flex-1">
                    {cfg.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5">
                        <CheckCircle size={14} color="#00E0D7" weight="fill" className="mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-white leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileTap={prefersReduced ? {} : { scale: 0.98 }}
                    onClick={() => handleCTA(planId)}
                    className="mt-7 w-full py-3 rounded-[10px] text-sm font-bold transition-all"
                    style={
                      highlighted
                        ? { background: "#00E0D7", color: "#080808", boxShadow: "0 0 20px rgba(0,224,215,0.15)" }
                        : { background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }
                    }
                  >
                    {isFree ? "Kostenlos starten" : "30 Tage gratis starten →"}
                  </motion.button>
                </div>
              </FadeIn>
            );
          })}
        </div>

        <FadeIn>
          <div className="text-center mt-8 flex items-center justify-center gap-2 text-xs text-[#666]">
            <ShieldCheck size={14} color="#666" />
            Jederzeit kündbar · Keine Mindestlaufzeit · Stripe Payments
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
