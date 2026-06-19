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
import type { Plan } from "@/types";
import { PLAN_CONFIG } from "@/types";

const PLAN_ORDER: Plan[] = ["free", "investor", "manager", "team"];

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
  const planConfig = PLAN_CONFIG[plan];
  const higherTiers = PLAN_ORDER.slice(PLAN_ORDER.indexOf(plan) + 1);

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
    background: "#FFFFFF",
    border: "1px solid rgba(0,0,0,0.07)",
    color: "#101418",
  };

  function SectionHeader({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) {
    return (
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        {icon}
        <span
          className="text-[15px] font-semibold"
          style={{ color: danger ? "#B91C1C" : "#101418" }}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="px-8 py-7 max-w-[720px] mx-auto" style={{ background: "#F8F7F4", minHeight: "100vh" }}>
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-[24px] font-semibold tracking-[-0.02em]" style={{ color: "#101418" }}>
            Einstellungen
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Konto und Abonnement verwalten.
          </p>
        </div>
      </FadeIn>

      {/* Profile */}
      <FadeIn delay={0.05}>
        <div
          className="rounded-[14px] overflow-hidden mb-4"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <SectionHeader icon={<User size={15} color="#9CA3AF" />} label="Profil" />

          <div className="px-6 py-5 flex flex-col gap-4">
            <div
              className="flex items-center gap-4 pb-5"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(160,120,48,0.08)" }}
              >
                <span className="text-xl font-semibold" style={{ color: "#A07830" }}>
                  {avatarLetter}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: "#101418" }}>
                  {displayName || displayEmail}
                </p>
                <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
                  {displayEmail}
                </p>
                <span
                  className="mt-2 inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(160,120,48,0.08)", color: "#A07830" }}
                >
                  {planConfig.name}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "#6B7280" }}>
                Name
              </label>
              <input
                className="w-full rounded-[10px] px-3.5 py-2.5 text-[13px] focus:outline-none transition-all"
                style={inputStyle}
                placeholder="Dein Name"
                value={nameValue}
                onChange={(e) => { setNameValue(e.target.value); setNameSaved(false); }}
                onFocus={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "rgba(160,120,48,0.3)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(160,120,48,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "#6B7280" }}>
                E-Mail
              </label>
              <input
                className="w-full rounded-[10px] px-3.5 py-2.5 text-[13px] cursor-not-allowed opacity-40"
                style={inputStyle}
                value={displayEmail}
                disabled
              />
              <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>
                E-Mail kann nicht geändert werden.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleSaveName}
                disabled={nameSaving}
                whileTap={prefersReduced ? {} : { scale: 0.98 }}
                className="text-[13px] font-semibold px-4 py-2.5 rounded-[10px] transition-all disabled:opacity-60"
                style={{ background: "#A07830", color: "#FFFFFF" }}
              >
                {nameSaving ? "Speichern..." : "Änderungen speichern"}
              </motion.button>
              {nameSaved && (
                <motion.span
                  initial={prefersReduced ? {} : { opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs"
                  style={{ color: "#2D6A2D" }}
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
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <SectionHeader icon={<CreditCard size={15} color="#9CA3AF" />} label="Abonnement" />

          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold" style={{ color: "#101418" }}>
                  Imvestra {planConfig.name}
                </p>
                <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
                  {planConfig.description}
                </p>
              </div>
              {plan !== "free" && (
                <motion.button
                  onClick={handlePortal}
                  whileTap={prefersReduced ? {} : { scale: 0.98 }}
                  className="flex-shrink-0 text-[13px] px-4 py-2.5 rounded-[10px] transition-all"
                  style={{
                    background: "#F8F7F4",
                    color: "#101418",
                    border: "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  Abo verwalten
                </motion.button>
              )}
            </div>

            {/* Current plan features */}
            <div className="mt-4 flex flex-col gap-2">
              {planConfig.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
                  <CheckCircle size={13} color="#A07830" weight="fill" />
                  {f}
                </div>
              ))}
            </div>

            {/* Upgrade options */}
            {higherTiers.length > 0 && (
              <div className="mt-5 pt-5 grid grid-cols-1 gap-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                {higherTiers.map((tier) => {
                  const cfg = PLAN_CONFIG[tier];
                  return (
                    <div
                      key={tier}
                      className="rounded-[14px] p-4 flex items-center justify-between gap-4"
                      style={{
                        background: "#F5F5F5",
                        border: `1px solid ${cfg.highlighted ? "rgba(160,120,48,0.2)" : "rgba(0,0,0,0.07)"}`,
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#101418" }}>
                          {cfg.name}
                          {cfg.highlighted && (
                            <span
                              className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(160,120,48,0.08)", color: "#A07830" }}
                            >
                              Beliebt
                            </span>
                          )}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                          {cfg.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <motion.button
                          onClick={() => handleCheckout(`${tier}_yearly`)}
                          whileTap={prefersReduced ? {} : { scale: 0.98 }}
                          className="text-xs font-bold px-3 py-2 rounded-[10px] transition-all whitespace-nowrap"
                          style={{ background: "#A07830", color: "#FFFFFF" }}
                        >
                          30 Tage gratis · dann {cfg.price_yearly}€/Jahr
                        </motion.button>
                        <motion.button
                          onClick={() => handleCheckout(`${tier}_monthly`)}
                          whileTap={prefersReduced ? {} : { scale: 0.98 }}
                          className="text-xs font-medium px-3 py-2 rounded-[10px] transition-all whitespace-nowrap"
                          style={{
                            background: "transparent",
                            color: "#6B7280",
                            border: "1px solid rgba(0,0,0,0.07)",
                          }}
                        >
                          30 Tage gratis · dann {cfg.price_monthly}€/Mo
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Security */}
      <FadeIn delay={0.15}>
        <div
          className="rounded-[14px] overflow-hidden mb-4"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <SectionHeader icon={<ShieldCheck size={15} color="#9CA3AF" />} label="Sicherheit" />

          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium" style={{ color: "#101418" }}>
                  Passwort ändern
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "#9CA3AF" }}>
                  Zuletzt geändert: unbekannt
                </p>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={handleResetPassword}
                  whileTap={prefersReduced ? {} : { scale: 0.98 }}
                  className="text-[13px] px-4 py-2.5 rounded-[10px] transition-all"
                  style={{
                    background: "#F8F7F4",
                    color: "#101418",
                    border: "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  E-Mail senden
                </motion.button>
                {resetSent && (
                  <motion.span
                    initial={prefersReduced ? {} : { opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs"
                    style={{ color: "#2D6A2D" }}
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
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(185,28,28,0.15)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <SectionHeader icon={<Trash size={15} color="#B91C1C" />} label="Konto löschen" danger />

          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium" style={{ color: "#101418" }}>
                  Konto dauerhaft löschen
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>
                  Alle Daten werden unwiderruflich gelöscht.
                </p>
                {deleteMessage && (
                  <p className="text-xs mt-2" style={{ color: "#B91C1C" }}>
                    {deleteMessage}
                  </p>
                )}
              </div>
              <motion.button
                onClick={handleDeleteAccount}
                whileTap={prefersReduced ? {} : { scale: 0.98 }}
                className="flex-shrink-0 text-[13px] font-semibold px-4 py-2.5 rounded-[10px] transition-all"
                style={{
                  background: "#B91C1C",
                  color: "#FFFFFF",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#991B1B")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#B91C1C")}
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
