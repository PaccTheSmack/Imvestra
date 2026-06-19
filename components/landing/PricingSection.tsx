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
    <section id="preise" className="bg-[#F0EDE4] py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-[44px] font-semibold tracking-[-0.03em] text-[#101418]">
              Kostenlos starten.<br />Wachsen wenn es sich lohnt.
            </h2>
            <p className="text-[#6A5A3A] text-lg mt-5 max-w-[420px] mx-auto">
              Kein Abo-Fallen. Kein Kleingedrucktes. Jederzeit kündbar.
            </p>
          </div>
        </FadeIn>

        {/* Billing toggle */}
        <div className="flex justify-center items-center mb-10">
          <div className="bg-white border border-[rgba(16,20,24,0.08)] p-1 rounded-[10px] inline-flex items-center">
            <button
              onClick={() => setIsYearly(false)}
              className="px-5 py-2 rounded-[8px] text-sm cursor-pointer transition-all"
              style={!isYearly ? { background: "#F0EDE4", color: "#101418", fontWeight: 500 } : { color: "#6A5A3A" }}
            >
              Monatlich
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className="px-5 py-2 rounded-[8px] text-sm cursor-pointer transition-all flex items-center"
              style={isYearly ? { background: "#F0EDE4", color: "#101418", fontWeight: 500 } : { color: "#6A5A3A" }}
            >
              Jährlich
              <span className="bg-[rgba(160,120,48,0.1)] text-[#A07830] text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
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
                      ? {
                          background: "#FFFFFF",
                          border: "2px solid #A07830",
                          boxShadow: "0 0 40px rgba(160,120,48,0.12)",
                        }
                      : { background: "#FFFFFF", border: "1px solid rgba(16,20,24,0.08)" }
                  }
                >
                  {highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#A07830] text-white text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      Beliebteste Wahl
                    </div>
                  )}

                  <p
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: highlighted ? "#A07830" : "#A89A7A" }}
                  >
                    {cfg.name}
                  </p>

                  <div className="mt-3 min-h-[60px]">
                    <div className="flex items-end gap-1">
                      <span className="text-[36px] font-bold text-[#101418] tracking-[-0.03em] leading-none transition-all duration-200">
                        {price}
                      </span>
                      {interval && <span className="text-sm text-[#6A5A3A] mb-1">{interval}</span>}
                    </div>
                    <p className="text-xs text-[#A89A7A] mt-2">{cfg.description}</p>
                    {!isFree && (
                      <p className="text-xs text-[#A07830] mt-1">30 Tage kostenlos testen</p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-col gap-2.5 flex-1">
                    {cfg.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5">
                        <CheckCircle size={14} color="#2D6A2D" weight="fill" className="mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#101418] leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileTap={prefersReduced ? {} : { scale: 0.98 }}
                    onClick={() => handleCTA(planId)}
                    className="mt-7 w-full py-3 rounded-[10px] text-sm font-bold transition-all cursor-pointer"
                    style={
                      highlighted
                        ? { background: "#A07830", color: "#FFFFFF", boxShadow: "0 4px 16px rgba(160,120,48,0.2)" }
                        : { background: "transparent", color: "#101418", border: "1px solid rgba(16,20,24,0.14)" }
                    }
                    onMouseEnter={(e) => {
                      if (!highlighted) e.currentTarget.style.background = "#F0EDE4";
                    }}
                    onMouseLeave={(e) => {
                      if (!highlighted) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {isFree ? "Kostenlos starten" : "30 Tage gratis starten →"}
                  </motion.button>
                </div>
              </FadeIn>
            );
          })}
        </div>

        <FadeIn>
          <div className="text-center mt-8 flex items-center justify-center gap-2 text-xs text-[#A89A7A]">
            <ShieldCheck size={14} color="#A89A7A" />
            Jederzeit kündbar · Keine Mindestlaufzeit · Stripe Payments
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
