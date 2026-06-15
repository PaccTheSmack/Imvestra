"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Student,
  Buildings,
  ChartLine,
  CurrencyEur,
  TrendUp,
  Shield,
  CheckCircle,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

type ExperienceLevel = "beginner" | "intermediate" | "experienced";
type InvestmentGoal = "cashflow" | "appreciation" | "retirement" | "portfolio";

interface OnboardingData {
  name: string;
  experience_level: ExperienceLevel | "";
  investment_goal: InvestmentGoal | "";
  portfolio_size: number;
}

const EXPERIENCE_OPTIONS: {
  value: ExperienceLevel;
  label: string;
  sub: string;
  Icon: PhosphorIcon;
}[] = [
  { value: "beginner",     label: "Einsteiger",     sub: "Ich plane meinen ersten Kauf",   Icon: Student   },
  { value: "intermediate", label: "Fortgeschritten", sub: "Ich habe bereits 1-5 Objekte",  Icon: Buildings },
  { value: "experienced",  label: "Erfahren",        sub: "Ich manage 6+ Objekte aktiv",   Icon: ChartLine },
];

const GOAL_OPTIONS: {
  value: InvestmentGoal;
  label: string;
  sub: string;
  Icon: PhosphorIcon;
}[] = [
  { value: "cashflow",     label: "Cashflow",          sub: "Monatliches passives Einkommen", Icon: CurrencyEur },
  { value: "appreciation", label: "Wertsteigerung",    sub: "Langfristiger Vermogensaufbau",  Icon: TrendUp     },
  { value: "retirement",   label: "Altersvorsorge",    sub: "Sichere Rente aufbauen",          Icon: Shield      },
  { value: "portfolio",    label: "Portfolio aufbauen", sub: "Mehrere Objekte erwerben",       Icon: Buildings   },
];

const SIZE_OPTIONS: { label: string; value: number }[] = [
  { label: "0",    value: 0  },
  { label: "1-2",  value: 1  },
  { label: "3-5",  value: 3  },
  { label: "6-10", value: 6  },
  { label: "10+",  value: 10 },
];

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner:     "Einsteiger",
  intermediate: "Fortgeschritten",
  experienced:  "Erfahren",
};

const GOAL_LABELS: Record<InvestmentGoal, string> = {
  cashflow:     "Cashflow",
  appreciation: "Wertsteigerung",
  retirement:   "Altersvorsorge",
  portfolio:    "Portfolio aufbauen",
};

function getSizeLabel(v: number) {
  return SIZE_OPTIONS.find((o) => o.value === v)?.label ?? "0";
}


export default function OnboardingPage() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: "",
    experience_level: "",
    investment_goal: "",
    portfolio_size: 0,
  });
  const [saving, setSaving] = useState(false);

  const progressWidths = ["33%", "66%", "100%"];

  async function saveAndComplete() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        name: data.name || null,
        experience_level: data.experience_level || null,
        investment_goal: data.investment_goal || null,
        portfolio_size: data.portfolio_size,
        onboarding_completed: true,
      })
      .eq("id", user!.id);
    if (!error) {
      router.refresh();
      router.replace("/dashboard");
    } else {
      setSaving(false);
    }
  }

  async function handleSkip() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user!.id);
    router.refresh();
    router.replace("/dashboard");
  }

  const step1Valid = data.name.trim().length > 0 && data.experience_level !== "";
  const step2Valid = data.investment_goal !== "";

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-6">
      {/* Card */}
      <div
        className="w-full max-w-[480px] rounded-[20px] overflow-hidden"
        style={{
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 64px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Image src="/logo.svg" alt="Imvestra" width={90} height={24} style={{ filter: "brightness(0) saturate(100%) invert(75%) sepia(60%) saturate(500%) hue-rotate(155deg) brightness(95%)" }} />
          <span className="text-[11px] font-medium" style={{ color: "#666666" }}>
            Schritt {step} von 3
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#00E0D7" }}
            animate={{ width: progressWidths[step - 1] }}
            transition={{ duration: prefersReduced ? 0 : 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={prefersReduced ? {} : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReduced ? {} : { opacity: 0, x: -20 }}
                transition={{ duration: prefersReduced ? 0 : 0.25 }}
              >
                <h1
                  className="text-[22px] font-semibold text-white tracking-[-0.02em]"
                >
                  Willkommen bei Imvestra.
                </h1>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#777777" }}>
                  Lass uns kurz dein Profil einrichten - damit Imvestra zu dir passt.
                </p>

                {/* Name */}
                <div className="mt-8">
                  <label className="block text-[11px] uppercase tracking-wider mb-2" style={{ color: "#777777" }}>
                    Wie heisst du?
                  </label>
                  <input
                    className="w-full rounded-[10px] px-4 py-3 text-sm text-white placeholder:text-[#555555] focus:outline-none transition-all duration-150"
                    style={{
                      background: "#0C0C0C",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    placeholder="Dein Vorname"
                    value={data.name}
                    onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,224,215,0.4)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                    autoFocus
                  />
                </div>

                {/* Experience */}
                <div className="mt-6">
                  <label className="block text-[11px] uppercase tracking-wider mb-3" style={{ color: "#777777" }}>
                    Wie erfahren bist du mit Immobilien-Investments?
                  </label>
                  <div className="flex flex-col gap-2">
                    {EXPERIENCE_OPTIONS.map(({ value, label, sub, Icon }) => {
                      const selected = data.experience_level === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setData((d) => ({ ...d, experience_level: value }))}
                          className="flex items-center gap-3 rounded-[10px] px-4 py-3 text-left transition-all duration-150"
                          style={{
                            background:     selected ? "rgba(0,224,215,0.08)" : "#0C0C0C",
                            border: `1px solid ${selected ? "rgba(0,224,215,0.3)" : "rgba(255,255,255,0.07)"}`,
                          }}
                          onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                          onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                        >
                          <div
                            className="w-8 h-8 rounded-[8px] flex-shrink-0 flex items-center justify-center"
                            style={{ background: selected ? "rgba(0,224,215,0.12)" : "#1A1A1A" }}
                          >
                            <Icon size={15} color={selected ? "#00E0D7" : "#666666"} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{label}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: "#777777" }}>{sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={prefersReduced ? {} : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReduced ? {} : { opacity: 0, x: -20 }}
                transition={{ duration: prefersReduced ? 0 : 0.25 }}
              >
                <h1 className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                  Was ist dein Investment-Ziel?
                </h1>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#777777" }}>
                  Imvestra passt sich deinen Zielen an.
                </p>

                {/* Goals */}
                <div className="grid grid-cols-2 gap-2 mt-8">
                  {GOAL_OPTIONS.map(({ value, label, sub, Icon }) => {
                    const selected = data.investment_goal === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setData((d) => ({ ...d, investment_goal: value }))}
                        className="flex flex-col items-center gap-2 rounded-[10px] p-4 text-center transition-all duration-150"
                        style={{
                          background:     selected ? "rgba(0,224,215,0.08)" : "#0C0C0C",
                          border: `1px solid ${selected ? "rgba(0,224,215,0.3)" : "rgba(255,255,255,0.07)"}`,
                        }}
                        onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                        onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                      >
                        <div
                          className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                          style={{ background: selected ? "rgba(0,224,215,0.12)" : "#1A1A1A" }}
                        >
                          <Icon size={18} color={selected ? "#00E0D7" : "#666666"} />
                        </div>
                        <p className="text-sm font-medium text-white mt-1">{label}</p>
                        <p className="text-[10px]" style={{ color: "#777777" }}>{sub}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Portfolio size */}
                <div className="mt-6">
                  <label className="block text-[11px] uppercase tracking-wider mb-3" style={{ color: "#777777" }}>
                    Wie viele Objekte hast du aktuell?
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {SIZE_OPTIONS.map(({ label, value }) => {
                      const selected = data.portfolio_size === value;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setData((d) => ({ ...d, portfolio_size: value }))}
                          className="px-4 py-2 rounded-[8px] text-sm font-medium transition-all duration-150"
                          style={selected ? {
                            background: "#00E0D7",
                            color: "#080808",
                            border: "1px solid transparent",
                          } : {
                            background: "#1A1A1A",
                            color: "#666666",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                          onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                          onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={prefersReduced ? {} : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReduced ? {} : { opacity: 0, x: -20 }}
                transition={{ duration: prefersReduced ? 0 : 0.25 }}
                className="text-center py-4"
              >
                {/* Animated checkmark */}
                <motion.div
                  initial={prefersReduced ? {} : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={prefersReduced ? {} : { type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{
                    background: "rgba(0,224,215,0.1)",
                    border: "1px solid rgba(0,224,215,0.2)",
                  }}
                >
                  <CheckCircle size={32} color="#00E0D7" weight="fill" />
                </motion.div>

                <h1 className="text-[22px] font-semibold text-white tracking-[-0.02em] mt-6">
                  Alles bereit.
                </h1>
                <p className="mt-2 text-sm leading-relaxed max-w-[320px] mx-auto" style={{ color: "#777777" }}>
                  Dein Profil ist eingerichtet. Starte jetzt mit deiner ersten Renditeberechnung.
                </p>

                {/* Summary pills */}
                <div className="mt-6 flex flex-col gap-2 text-left">
                  {[
                    {
                      label: "Erfahrung",
                      value: data.experience_level ? EXPERIENCE_LABELS[data.experience_level as ExperienceLevel] : "-",
                    },
                    {
                      label: "Ziel",
                      value: data.investment_goal ? GOAL_LABELS[data.investment_goal as InvestmentGoal] : "-",
                    },
                    {
                      label: "Objekte",
                      value: getSizeLabel(data.portfolio_size),
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-[8px] px-4 py-2.5 flex items-center justify-between"
                      style={{
                        background: "#0C0C0C",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <span className="text-xs" style={{ color: "#777777" }}>{label}</span>
                      <span className="text-xs font-medium text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className="px-6 pb-6 pt-4 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="text-sm transition-colors duration-150"
                style={{ color: "#666666" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#666666")}
              >
                Zuruck
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={
              (step === 1 && !step1Valid) ||
              (step === 2 && !step2Valid) ||
              saving
            }
            onClick={() => {
              if (step < 3) setStep(step + 1);
              else saveAndComplete();
            }}
            className="px-5 py-2.5 rounded-[10px] text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: "#00E0D7", color: "#080808" }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#00E0D7"; }}
            onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#00E0D7"; }}
          >
            {step === 3 ? (saving ? "Wird gespeichert..." : "Imvestra starten") : "Weiter →"}
          </button>
        </div>
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={handleSkip}
        className="mt-4 text-xs transition-colors duration-150"
        style={{ color: "#555555" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#777777")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
      >
        Uberspringen
      </button>
    </div>
  );
}
