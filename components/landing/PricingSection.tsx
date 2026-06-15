"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle, X, ShieldCheck } from "@phosphor-icons/react";
import FadeIn from "@/components/ui/FadeIn";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

type Feature = { label: string; active: boolean };

const FREE_FEATURES: Feature[] = [
  { label: "1 Objekt analysieren", active: true },
  { label: "Vollständiger Rechner", active: true },
  { label: "Speichern & Portfolio", active: false },
  { label: "PDF Export", active: false },
  { label: "Standortanalyse", active: false },
  { label: "Mietverwaltung", active: false },
];

const PRO_FEATURES = [
  "Unbegrenzte Objekte",
  "Portfolio Dashboard",
  "PDF Bankpräsentation",
  "Standortanalyse",
  "AfA & Steuerübersicht",
  "Mietverwaltung & Aufgaben",
  "Smart Task Engine",
  "Zinsbindungsende-Tracker",
];

const TEAM_FEATURES: Feature[] = [
  { label: "Alles aus Pro", active: true },
  { label: "Bis zu 5 Nutzer", active: true },
  { label: "Shared Portfolio", active: true },
  { label: "Rollen & Berechtigungen", active: true },
];

function FeatureRow({ label, active }: Feature) {
  return (
    <div className="flex items-center gap-2.5">
      {active ? (
        <CheckCircle size={14} color="#00E0D7" weight="fill" />
      ) : (
        <X size={14} color="#333" />
      )}
      <span className={`text-sm ${active ? "text-white" : "text-[#444]"}`}>{label}</span>
    </div>
  );
}

export default function PricingSection() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const prefersReduced = useReducedMotion();

  return (
    <section id="preise" className="bg-[#080808] py-32">
      <div className="max-w-[1000px] mx-auto px-6">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-12">
            <span className="inline-flex bg-[#1A1A1A] border border-[rgba(255,255,255,0.08)] text-[#555] text-xs px-3 py-1 rounded-full">
              Preise
            </span>
            <h2 className="text-[44px] font-semibold tracking-[-0.03em] text-white mt-4">
              Transparent. Fair.
            </h2>
            <p className="text-[#555] text-lg mt-4">Kein Abo-Fallen. Kein Kleingedrucktes.</p>
          </div>
        </FadeIn>

        {/* Billing toggle */}
        <div className="flex justify-center items-center mb-10">
          <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] p-1 rounded-[10px] inline-flex items-center">
            <button
              onClick={() => setIsYearly(false)}
              className="px-5 py-2 rounded-[8px] text-sm cursor-pointer transition-all"
              style={!isYearly ? { background: "#1A1A1A", color: "#fff", fontWeight: 500 } : { color: "#555" }}
            >
              Monatlich
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className="px-5 py-2 rounded-[8px] text-sm cursor-pointer transition-all flex items-center"
              style={isYearly ? { background: "#1A1A1A", color: "#fff", fontWeight: 500 } : { color: "#555" }}
            >
              Jährlich
              <span className="bg-[rgba(0,224,215,0.1)] text-[#00E0D7] text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                34% sparen
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* FREE */}
          <FadeIn delay={0}>
            <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-7">
              <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest">Free</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-[40px] font-semibold text-white tracking-[-0.03em] leading-none">0€</span>
              </div>
              <p className="text-sm text-[#444] mt-2">dauerhaft kostenlos</p>
              <div className="mt-6 flex flex-col gap-2.5">
                {FREE_FEATURES.map((f) => (
                  <FeatureRow key={f.label} {...f} />
                ))}
              </div>
              <button
                onClick={() => router.push("/register")}
                className="mt-8 w-full py-3 rounded-[10px] text-sm font-semibold border border-[rgba(255,255,255,0.1)] text-white hover:bg-[#1A1A1A] hover:border-[rgba(255,255,255,0.15)] transition-all"
              >
                Kostenlos starten
              </button>
            </div>
          </FadeIn>

          {/* PRO */}
          <FadeIn delay={0.1}>
            <div
              className="relative bg-[#080808] rounded-[20px] p-7"
              style={{ border: "2px solid #00E0D7", boxShadow: "0 0 60px rgba(0,224,215,0.08)" }}
            >
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00E0D7] text-[#080808] text-[10px] font-bold px-4 py-1.5 rounded-full whitespace-nowrap"
                style={{ boxShadow: "0 0 20px rgba(0,224,215,0.4)" }}
              >
                ✦ Beliebteste Wahl
              </div>
              <p className="text-[10px] text-[#00E0D7] font-bold uppercase tracking-widest">Pro</p>
              <div className="mt-3 min-h-[68px]">
                <div className="flex items-end gap-1">
                  <span className="text-[40px] font-semibold text-white tracking-[-0.03em] leading-none transition-all duration-200">
                    {isYearly ? "149€" : "19€"}
                  </span>
                  <span className="text-sm text-[#555] mb-1">{isYearly ? "/Jahr" : "/Monat"}</span>
                </div>
                {isYearly && (
                  <p className="text-xs text-[#00E0D7] mt-1">= 12,42 € / Monat · 34% gespart</p>
                )}
              </div>
              <div className="mt-6 flex flex-col gap-2.5">
                {PRO_FEATURES.map((f) => (
                  <FeatureRow key={f} label={f} active />
                ))}
              </div>
              <motion.button
                whileTap={prefersReduced ? {} : { scale: 0.98 }}
                onClick={() => scrollTo("waitlist")}
                className="mt-8 w-full py-3.5 rounded-[10px] text-sm font-bold bg-[#00E0D7] text-[#080808] hover:bg-[#00C7BE] transition-all"
                style={{ boxShadow: "0 0 20px rgba(0,224,215,0.15)" }}
              >
                Pro starten →
              </motion.button>
            </div>
          </FadeIn>

          {/* TEAM */}
          <FadeIn delay={0.2}>
            <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-7">
              <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest">Team</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-[40px] font-semibold text-white tracking-[-0.03em] leading-none">49€</span>
                <span className="text-sm text-[#555] mb-1">/Monat</span>
              </div>
              <p className="text-sm text-[#444] mt-2">für kleine Teams</p>
              <div className="mt-6 flex flex-col gap-2.5">
                {TEAM_FEATURES.map((f) => (
                  <FeatureRow key={f.label} {...f} />
                ))}
              </div>
              <button
                onClick={() => router.push("/register")}
                className="mt-8 w-full py-3 rounded-[10px] text-sm font-semibold border border-[rgba(255,255,255,0.1)] text-white hover:bg-[#1A1A1A] hover:border-[rgba(255,255,255,0.15)] transition-all"
              >
                Team starten
              </button>
            </div>
          </FadeIn>
        </div>

        <FadeIn>
          <div className="text-center mt-8 flex items-center justify-center gap-2 text-xs text-[#444]">
            <ShieldCheck size={14} color="#444" />
            Jederzeit kündbar · Keine Mindestlaufzeit · Stripe Payments
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
