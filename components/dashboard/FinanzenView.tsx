"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Bank,
  Warning,
  X,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import DarkButton from "@/components/ui/DarkButton";
import DarkInput from "@/components/ui/DarkInput";
import DarkSelect from "@/components/ui/DarkSelect";
import FadeIn from "@/components/ui/FadeIn";
import { tokens } from "@/lib/tokens";
import { formatCurrency, formatPercent, formatCurrencySigned } from "@/lib/format";
import type { FinanzierungWithProperty, FinanzierungUrgency } from "@/types";

interface FinanzenViewProps {
  financings: FinanzierungWithProperty[];
}

const URGENCY_BORDER: Record<FinanzierungUrgency, string> = {
  expired:  "rgba(185,28,28,0.25)",
  critical: "rgba(185,28,28,0.18)",
  warning:  "rgba(146,64,14,0.18)",
  ok:       "rgba(16,20,24,0.08)",
};

const URGENCY_BADGE: Record<FinanzierungUrgency, { bg: string; text: string; label: string }> = {
  expired:  { bg: "rgba(185,28,28,0.1)",   text: "#B91C1C", label: "Abgelaufen" },
  critical: { bg: "rgba(185,28,28,0.1)",   text: "#B91C1C", label: "Kritisch"   },
  warning:  { bg: "rgba(146,64,14,0.1)",   text: "#92400E", label: "Bald fallig"},
  ok:       { bg: "rgba(160,120,48,0.1)", text: "#A07830", label: "Lauft"      },
};

const URGENCY_COLOR: Record<FinanzierungUrgency, string> = {
  expired:  "#B91C1C",
  critical: "#B91C1C",
  warning:  "#92400E",
  ok:       "#A07830",
};

function fmtDateLong(d: string) {
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("de-DE", { month: "2-digit", year: "numeric" });
}

export default function FinanzenView({ financings }: FinanzenViewProps) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  const [showAddFinancing, setShowAddFinancing] = useState(false);
  const [selectedFinancing, setSelectedFinancing] = useState<FinanzierungWithProperty | null>(null);
  const [showAnschluss, setShowAnschluss] = useState(false);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    property_id: "",
    bank: "",
    loan_amount: "",
    interest_rate: "",
    repayment_rate: "",
    rate_monthly: "",
    fixed_until: "",
    current_debt: "",
  });

  const [newRate, setNewRate] = useState("");
  const [newRepayment, setNewRepayment] = useState("2.0");

  useEffect(() => {
    if (!showAddFinancing) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("properties").select("id, name").eq("user_id", user.id).then(({ data }) => {
        setProperties(data ?? []);
        if (data?.[0]) setForm((f) => ({ ...f, property_id: data[0].id }));
      });
    });
  }, [showAddFinancing]);

  // Summary stats
  const totalDebt = financings.reduce((s, f) => s + (f.current_debt ?? f.loan_amount), 0);
  const totalRate = financings.reduce((s, f) => s + f.rate_monthly, 0);
  const avgInterest = financings.length > 0
    ? financings.reduce((s, f) => s + f.interest_rate, 0) / financings.length
    : 0;
  const expiringCount = financings.filter(
    (f) => f.urgency === "critical" || f.urgency === "warning"
  ).length;
  const criticals = financings.filter(
    (f) => f.urgency === "critical" || f.urgency === "expired"
  );

  async function saveFinancing() {
    if (!form.property_id || !form.loan_amount) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("financings").insert({
      property_id: form.property_id,
      user_id: user.id,
      bank: form.bank || null,
      loan_amount: parseFloat(form.loan_amount),
      interest_rate: parseFloat(form.interest_rate) / 100,
      repayment_rate: parseFloat(form.repayment_rate) / 100,
      rate_monthly: parseFloat(form.rate_monthly) || 0,
      fixed_until: form.fixed_until || null,
      current_debt: parseFloat(form.current_debt) || parseFloat(form.loan_amount),
    });

    setSaving(false);
    setShowAddFinancing(false);
    setForm({ property_id: "", bank: "", loan_amount: "", interest_rate: "", repayment_rate: "", rate_monthly: "", fixed_until: "", current_debt: "" });
    router.refresh();
  }

  // Anschluss calc
  const anschlussDebt = selectedFinancing
    ? (selectedFinancing.current_debt ?? selectedFinancing.loan_amount)
    : 0;
  const newMonthlyRate = newRate
    ? (anschlussDebt * (parseFloat(newRate) / 100 + parseFloat(newRepayment) / 100)) / 12
    : null;

  function progressPct(fixedUntil: string) {
    const expiry = new Date(fixedUntil).getTime();
    const start = expiry - 10 * 365.25 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return Math.min(100, Math.max(0, ((now - start) / (expiry - start)) * 100));
  }

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.12)" }}
          >
            <Bank size={18} color="#A07830" />
          </div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]" style={{ color: tokens.color.text }}>
            Finanzen
          </h1>
        </div>
        <DarkButton variant="primary" onClick={() => setShowAddFinancing(true)}>
          Finanzierung hinzufugen
        </DarkButton>
      </div>

      {/* Alert banner */}
      {criticals.length > 0 && (
        <FadeIn delay={0}>
          <div
            className="rounded-[14px] px-5 py-4 mb-6 flex items-start gap-3"
            style={{ background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.15)" }}
          >
            <Warning size={18} color="#FF4444" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                {criticals.length} Zinsbindung{criticals.length > 1 ? "en laufen" : " lauft"} bald aus oder ist bereits abgelaufen.
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                Handle jetzt um schlechte Konditionen zu vermeiden.
              </p>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Summary cards */}
      {financings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "GESAMTSCHULDEN",    value: formatCurrency(totalDebt),            color: tokens.color.text },
            { label: "RATE / MONAT",      value: formatCurrency(totalRate),            color: "#B91C1C"         },
            { label: "Ø ZINSSATZ",        value: formatPercent(avgInterest),           color: tokens.color.text },
            {
              label: "LAUFT AUS (12 Mo)",
              value: expiringCount + " Finanzierungen",
              color: expiringCount > 0 ? "#92400E" : tokens.color.text,
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-[12px] px-4 py-3.5"
              style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: tokens.color.textSubtle }}>
                {label}
              </p>
              <p className="text-xl font-semibold tracking-tight" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {financings.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <motion.div
            animate={prefersReduced ? {} : { y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 rounded-[14px] flex items-center justify-center mx-auto"
            style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
          >
            <Bank size={24} color={tokens.color.textSubtle} />
          </motion.div>
          <p className="text-base font-semibold mt-5" style={{ color: tokens.color.text }}>
            Keine Finanzierungen
          </p>
          <p className="text-sm mt-2 max-w-[280px]" style={{ color: tokens.color.textMuted }}>
            Fuege deine Darlehen hinzu um Zinsbindungen zu tracken.
          </p>
          <div className="mt-5">
            <DarkButton variant="primary" onClick={() => setShowAddFinancing(true)}>
              Finanzierung hinzufugen
            </DarkButton>
          </div>
        </div>
      )}

      {/* Financing cards */}
      <div className="flex flex-col gap-4">
        {financings.map((f, i) => {
          const badge = URGENCY_BADGE[f.urgency];
          const barColor = URGENCY_COLOR[f.urgency];
          const pct = f.fixed_until ? progressPct(f.fixed_until) : 0;

          return (
            <FadeIn key={f.id} delay={i * 0.06}>
              <div
                className="rounded-[16px] overflow-hidden"
                style={{ background: tokens.color.surface, border: `1px solid ${URGENCY_BORDER[f.urgency]}` }}
              >
                {/* Top */}
                <div className="px-6 py-5 flex items-start justify-between">
                  <div>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full uppercase mb-2 inline-block"
                      style={{ background: tokens.color.bgSubtle, color: tokens.color.textSubtle }}
                    >
                      {f.property.type}
                    </span>
                    <p className="text-base font-semibold" style={{ color: tokens.color.text }}>
                      {f.property.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: tokens.color.textMuted }}>
                      {f.bank || "Bank nicht angegeben"}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                    style={{ background: badge.bg, color: badge.text }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Metrics bar */}
                <div
                  className="px-6 py-4 grid grid-cols-5 gap-4"
                  style={{ borderTop: `1px solid ${tokens.color.border}` }}
                >
                  {[
                    { label: "DARLEHEN",  value: formatCurrency(f.loan_amount) },
                    { label: "ZINSSATZ",  value: formatPercent(f.interest_rate) },
                    { label: "TILGUNG",   value: formatPercent(f.repayment_rate) },
                    { label: "RATE / MO", value: formatCurrency(f.rate_monthly) },
                    {
                      label: "ZINSBINDUNG",
                      value: f.fixed_until ? fmtDateShort(f.fixed_until) : "Nicht angegeben",
                      sub: f.fixed_until
                        ? f.urgency === "expired"
                          ? { text: "Abgelaufen", color: "#FF4444" }
                          : { text: f.monthsUntilExpiry + " Monate", color: URGENCY_COLOR[f.urgency] }
                        : null,
                    },
                  ].map(({ label, value, sub }) => (
                    <div key={label}>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: tokens.color.textSubtle }}>
                        {label}
                      </p>
                      <p className="text-sm font-semibold mt-1" style={{ color: tokens.color.text }}>
                        {value}
                      </p>
                      {sub && (
                        <p className="text-[10px] mt-0.5" style={{ color: sub.color }}>
                          {sub.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                {f.fixed_until && (
                  <div style={{ background: tokens.color.bgSubtle, height: 3 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: prefersReduced ? 0 : 0.8, ease: "easeOut", delay: i * 0.06 }}
                      style={{ height: "100%", background: barColor }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div
                  className="px-6 py-3 flex items-center justify-between"
                  style={{ borderTop: `1px solid ${tokens.color.border}` }}
                >
                  <span className="text-xs" style={{ color: tokens.color.textMuted }}>
                    {f.fixed_until && f.urgency !== "expired"
                      ? "Zinsbindungsende: " + fmtDateLong(f.fixed_until)
                      : ""}
                  </span>
                  <DarkButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedFinancing(f);
                      setNewRate("");
                      setNewRepayment("2.0");
                      setShowAnschluss(true);
                    }}
                  >
                    Anschluss berechnen
                  </DarkButton>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>

      {/* Modal: Add Financing */}
      <AnimatePresence>
        {showAddFinancing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-4 overflow-y-auto"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddFinancing(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="w-full max-w-[480px] rounded-[20px] overflow-hidden"
              style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}`, boxShadow: "0 24px 80px rgba(16,20,24,0.12)" }}
            >
              <div className="px-6 py-5 flex justify-between items-center" style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                <p className="text-base font-semibold" style={{ color: tokens.color.text }}>Finanzierung hinzufugen</p>
                <button onClick={() => setShowAddFinancing(false)} style={{ color: tokens.color.textSubtle }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = tokens.color.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = tokens.color.textSubtle)}>
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">
                <DarkSelect
                  label="Objekt"
                  value={form.property_id}
                  onChange={(e) => setForm((f) => ({ ...f, property_id: e.target.value }))}
                  options={properties.map((p) => ({ value: p.id, label: p.name }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput label="Bank" placeholder="z.B. Deutsche Bank" value={form.bank}
                    onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))} />
                  <DarkInput label="Darlehensbetrag (€)" type="number" value={form.loan_amount}
                    onChange={(e) => setForm((f) => ({ ...f, loan_amount: e.target.value }))} />
                  <DarkInput label="Zinssatz (%)" type="number" placeholder="3,5" value={form.interest_rate}
                    onChange={(e) => setForm((f) => ({ ...f, interest_rate: e.target.value }))} />
                  <DarkInput label="Tilgung (%)" type="number" placeholder="2,0" value={form.repayment_rate}
                    onChange={(e) => setForm((f) => ({ ...f, repayment_rate: e.target.value }))} />
                  <DarkInput label="Rate / Monat (€)" type="number" value={form.rate_monthly}
                    onChange={(e) => setForm((f) => ({ ...f, rate_monthly: e.target.value }))} />
                  <DarkInput label="Zinsbindung bis" type="date" value={form.fixed_until}
                    onChange={(e) => setForm((f) => ({ ...f, fixed_until: e.target.value }))} />
                </div>
                <DarkInput label="Aktuelle Restschuld (€)" type="number" value={form.current_debt}
                  hint="Optional – für genaues Tracking"
                  onChange={(e) => setForm((f) => ({ ...f, current_debt: e.target.value }))} />
              </div>

              <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: `1px solid ${tokens.color.border}` }}>
                <DarkButton variant="ghost" onClick={() => setShowAddFinancing(false)}>Abbrechen</DarkButton>
                <DarkButton variant="primary" loading={saving} onClick={saveFinancing}>Speichern</DarkButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Anschlussfinanzierung */}
      <AnimatePresence>
        {showAnschluss && selectedFinancing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowAnschluss(false); setSelectedFinancing(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="w-full max-w-[440px] rounded-[20px] overflow-hidden"
              style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}`, boxShadow: "0 24px 80px rgba(16,20,24,0.12)" }}
            >
              <div className="px-6 py-5 flex justify-between items-start" style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                <div>
                  <p className="text-base font-semibold" style={{ color: tokens.color.text }}>Anschlussfinanzierung</p>
                  <p className="text-xs mt-0.5" style={{ color: tokens.color.textSubtle }}>{selectedFinancing.property.name}</p>
                </div>
                <button onClick={() => { setShowAnschluss(false); setSelectedFinancing(null); }}
                  style={{ color: tokens.color.textSubtle }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = tokens.color.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = tokens.color.textSubtle)}>
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 flex flex-col gap-4">
                {/* Current situation */}
                <div
                  className="rounded-[12px] p-4 grid grid-cols-3 gap-4"
                  style={{ background: tokens.color.bgSubtle, border: `1px solid ${tokens.color.border}` }}
                >
                  {[
                    { label: "RESTSCHULD",       value: formatCurrency(anschlussDebt) },
                    { label: "AKTUELLER ZINS",   value: formatPercent(selectedFinancing.interest_rate) },
                    { label: "ZINSBINDUNG BIS",  value: selectedFinancing.fixed_until ? fmtDateShort(selectedFinancing.fixed_until) : "–" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: tokens.color.textSubtle }}>{label}</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: tokens.color.text }}>{value}</p>
                    </div>
                  ))}
                </div>

                <DarkInput label="Neuer Zinssatz (%)" type="number" placeholder="Aktueller Marktzins z.B. 3,8"
                  value={newRate} onChange={(e) => setNewRate(e.target.value)} />
                <DarkInput label="Neue Tilgung (%)" type="number" placeholder="2,0"
                  value={newRepayment} onChange={(e) => setNewRepayment(e.target.value)} />

                {/* Result */}
                {newMonthlyRate !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[12px] p-4"
                    style={{ background: "rgba(160,120,48,0.06)", border: "1px solid rgba(160,120,48,0.15)" }}
                  >
                    <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: tokens.color.textSubtle }}>NEUE RATE / MONAT</p>
                    <p className="text-2xl font-semibold" style={{ color: tokens.color.accent }}>
                      {formatCurrency(newMonthlyRate)}
                    </p>
                    <div className="flex justify-between text-xs mt-3" style={{ color: tokens.color.textSubtle }}>
                      <span>Aktuell: {formatCurrency(selectedFinancing.rate_monthly)}</span>
                      <span style={{ color: newMonthlyRate - selectedFinancing.rate_monthly > 0 ? tokens.color.danger : tokens.color.positive }}>
                        {formatCurrencySigned(newMonthlyRate - selectedFinancing.rate_monthly)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="px-6 py-4 flex justify-end" style={{ borderTop: `1px solid ${tokens.color.border}` }}>
                <DarkButton variant="secondary" onClick={() => { setShowAnschluss(false); setSelectedFinancing(null); }}>
                  Schliessen
                </DarkButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
