"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  User,
  CreditCard,
  ShieldCheck,
  Trash,
  CheckCircle,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import FadeIn from "@/components/ui/FadeIn";
import { tokens } from "@/lib/tokens";
import type { Plan } from "@/types";

const PLAN_META: Record<Plan, { label: string; badge: string; color: string; bg: string; desc: string }> = {
  free: {
    label: "Imvestra Free",
    badge: "Free",
    color: tokens.color.textMuted,
    bg: tokens.color.surfaceHover,
    desc: "1 Objekt · Kein Speichern · Kein PDF-Export",
  },
  pro: {
    label: "Imvestra Pro",
    badge: "Pro",
    color: tokens.color.accent,
    bg: tokens.color.accentMuted,
    desc: "Unbegrenzt · PDF-Export · Portfolio",
  },
  team: {
    label: "Imvestra Team",
    badge: "Team",
    color: tokens.color.positive,
    bg: tokens.color.positiveBg,
    desc: "Alles aus Pro · Bis zu 5 Nutzer",
  },
};

const FREE_FEATURES = ["1 Objekt analysieren", "Vollständiger Rechner"];
const PRO_FEATURES = [
  "Unbegrenzte Objekte",
  "Portfolio Dashboard",
  "PDF Bankpräsentation",
  "Finanzierungsanalyse",
  "Szenario-Vergleich",
];

interface SettingsViewProps {
  user: { id: string; email?: string };
  profile: {
    id?: string;
    name?: string;
    email?: string;
    plan?: string;
  } | null;
}

export default function SettingsView({ user, profile }: SettingsViewProps) {
  const prefersReduced = useReducedMotion();
  const plan = (profile?.plan ?? "free") as Plan;
  const meta = PLAN_META[plan];

  const displayName = profile?.name ?? "";
  const displayEmail = user.email ?? profile?.email ?? "";
  const avatarLetter = (displayName || displayEmail)[0]?.toUpperCase() ?? "?";

  const [nameValue, setNameValue] = useState(displayName);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);

  async function handleSaveName() {
    setNameSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ name: nameValue }).eq("id", user.id);
    setNameSaving(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 3000);
  }

  const [resetSent, setResetSent] = useState(false);
  async function handleResetPassword() {
    if (!displayEmail) return;
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(displayEmail);
    setResetSent(true);
    setTimeout(() => setResetSent(false), 5000);
  }

  const [deleteMessage, setDeleteMessage] = useState("");
  function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden."
    );
    if (confirmed) setDeleteMessage("Bitte kontaktiere support@imvestra.de");
  }

  async function handleCheckout(planKey: string) {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  async function handlePortal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  const inputStyle = {
    background: tokens.color.surface,
    border: `1px solid ${tokens.color.border}`,
    color: tokens.color.text,
  };

  function SectionHeader({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) {
    return (
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ borderBottom: `1px solid ${tokens.color.border}` }}
      >
        {icon}
        <span
          className="text-sm font-semibold"
          style={{ color: danger ? tokens.color.danger : tokens.color.text }}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[720px] mx-auto">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-[24px] font-semibold tracking-[-0.02em]" style={{ color: tokens.color.text }}>
            Einstellungen
          </h1>
          <p className="text-sm mt-1" style={{ color: tokens.color.textMuted }}>
            Konto und Abonnement verwalten.
          </p>
        </div>
      </FadeIn>

      {/* Profile */}
      <FadeIn delay={0.05}>
        <div
          className="rounded-[14px] overflow-hidden mb-4"
          style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
        >
          <SectionHeader icon={<User size={15} color={tokens.color.textSubtle} />} label="Profil" />

          <div className="px-6 py-5 flex flex-col gap-4">
            <div
              className="flex items-center gap-4 pb-5"
              style={{ borderBottom: `1px solid ${tokens.color.border}` }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tokens.color.accentMuted }}
              >
                <span className="text-xl font-semibold" style={{ color: tokens.color.accent }}>
                  {avatarLetter}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: tokens.color.text }}>
                  {displayName || displayEmail}
                </p>
                <p className="text-sm mt-0.5" style={{ color: tokens.color.textMuted }}>
                  {displayEmail}
                </p>
                <span
                  className="mt-2 inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.badge}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: tokens.color.textMuted }}>
                Name
              </label>
              <input
                className="w-full rounded-[8px] px-3 py-2.5 text-sm focus:outline-none transition-all"
                style={inputStyle}
                placeholder="Dein Name"
                value={nameValue}
                onChange={(e) => { setNameValue(e.target.value); setNameSaved(false); }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(29,184,122,0.4)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = tokens.color.border)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: tokens.color.textMuted }}>
                E-Mail
              </label>
              <input
                className="w-full rounded-[8px] px-3 py-2.5 text-sm cursor-not-allowed opacity-40"
                style={inputStyle}
                value={displayEmail}
                disabled
              />
              <p className="text-[10px] mt-1" style={{ color: tokens.color.textSubtle }}>
                E-Mail kann nicht geändert werden.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleSaveName}
                disabled={nameSaving}
                whileTap={prefersReduced ? {} : { scale: 0.98 }}
                className="text-sm font-semibold px-4 py-2 rounded-[8px] transition-all disabled:opacity-60"
                style={{ background: tokens.color.accent, color: tokens.color.bg }}
              >
                {nameSaving ? "Speichern..." : "Änderungen speichern"}
              </motion.button>
              {nameSaved && (
                <motion.span
                  initial={prefersReduced ? {} : { opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs"
                  style={{ color: tokens.color.positive }}
                >
                  Gespeichert
                </motion.span>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Subscription */}
      <FadeIn delay={0.1}>
        <div
          className="rounded-[14px] overflow-hidden mb-4"
          style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
        >
          <SectionHeader icon={<CreditCard size={15} color={tokens.color.textSubtle} />} label="Abonnement" />

          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold" style={{ color: tokens.color.text }}>
                  {meta.label}
                </p>
                <p className="text-sm mt-1" style={{ color: tokens.color.textMuted }}>
                  {meta.desc}
                </p>
              </div>
              {plan === "free" ? (
                <motion.button
                  onClick={() => handleCheckout("pro_monthly")}
                  whileTap={prefersReduced ? {} : { scale: 0.98 }}
                  className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-[8px] transition-all"
                  style={{ background: tokens.color.accent, color: tokens.color.bg }}
                >
                  Auf Pro upgraden
                </motion.button>
              ) : (
                <motion.button
                  onClick={handlePortal}
                  whileTap={prefersReduced ? {} : { scale: 0.98 }}
                  className="flex-shrink-0 text-sm px-4 py-2 rounded-[8px] transition-all"
                  style={{
                    background: tokens.color.surfaceHover,
                    color: tokens.color.text,
                    border: `1px solid ${tokens.color.borderStrong}`,
                  }}
                >
                  Abo verwalten
                </motion.button>
              )}
            </div>

            {plan === "free" && (
              <div
                className="mt-5 pt-5"
                style={{ borderTop: `1px solid ${tokens.color.border}` }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: tokens.color.textSubtle }}>
                      Free
                    </p>
                    <div className="flex flex-col gap-2">
                      {FREE_FEATURES.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs" style={{ color: tokens.color.textMuted }}>
                          <CheckCircle size={13} color={tokens.color.textSubtle} />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: tokens.color.accent }}>
                      Pro - 19€/Mo
                    </p>
                    <div className="flex flex-col gap-2">
                      {PRO_FEATURES.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs" style={{ color: tokens.color.text }}>
                          <CheckCircle size={13} color={tokens.color.positive} weight="fill" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 mt-2">
                    <div
                      className="rounded-[10px] px-4 py-3 flex items-center justify-between"
                      style={{ background: tokens.color.accentSubtle, border: `1px solid ${tokens.color.borderAccent}` }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                          Jährlich zahlen und 34% sparen
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: tokens.color.textMuted }}>
                          149€/Jahr statt 228€
                        </p>
                      </div>
                      <motion.button
                        onClick={() => handleCheckout("pro_yearly")}
                        whileTap={prefersReduced ? {} : { scale: 0.98 }}
                        className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-[8px] transition-all"
                        style={{ background: tokens.color.accent, color: tokens.color.bg }}
                      >
                        Pro Yearly
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Security */}
      <FadeIn delay={0.15}>
        <div
          className="rounded-[14px] overflow-hidden mb-4"
          style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
        >
          <SectionHeader icon={<ShieldCheck size={15} color={tokens.color.textSubtle} />} label="Sicherheit" />

          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                  Passwort ändern
                </p>
                <p className="text-xs mt-0.5" style={{ color: tokens.color.textSubtle }}>
                  Zuletzt geändert: unbekannt
                </p>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={handleResetPassword}
                  whileTap={prefersReduced ? {} : { scale: 0.98 }}
                  className="text-sm px-4 py-2 rounded-[8px] transition-all"
                  style={{
                    background: tokens.color.surfaceHover,
                    color: tokens.color.text,
                    border: `1px solid ${tokens.color.borderStrong}`,
                  }}
                >
                  E-Mail senden
                </motion.button>
                {resetSent && (
                  <motion.span
                    initial={prefersReduced ? {} : { opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs"
                    style={{ color: tokens.color.positive }}
                  >
                    E-Mail gesendet
                  </motion.span>
                )}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Delete account */}
      <FadeIn delay={0.2}>
        <div
          className="rounded-[14px] overflow-hidden"
          style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
        >
          <SectionHeader icon={<Trash size={15} color={tokens.color.danger} />} label="Konto löschen" danger />

          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                  Konto dauerhaft löschen
                </p>
                <p className="text-xs mt-0.5" style={{ color: tokens.color.textMuted }}>
                  Alle Daten werden unwiderruflich gelöscht.
                </p>
                {deleteMessage && (
                  <p className="text-xs mt-2" style={{ color: tokens.color.danger }}>
                    {deleteMessage}
                  </p>
                )}
              </div>
              <motion.button
                onClick={handleDeleteAccount}
                whileTap={prefersReduced ? {} : { scale: 0.98 }}
                className="flex-shrink-0 text-sm px-4 py-2 rounded-[8px] transition-all"
                style={{
                  background: tokens.color.dangerBg,
                  color: tokens.color.danger,
                  border: `1px solid rgba(255,68,68,0.2)`,
                }}
              >
                Konto löschen
              </motion.button>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
