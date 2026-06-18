"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Bank,
  CaretLeft,
  CaretRight,
  Warning,
  X,
  DotsThree,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import SzenarioRechner from "@/components/dashboard/SzenarioRechner";
import BankAccountTab from "@/components/dashboard/BankAccountTab";
import DarkButton from "@/components/ui/DarkButton";
import DarkInput from "@/components/ui/DarkInput";
import DarkSelect from "@/components/ui/DarkSelect";
import FadeIn from "@/components/ui/FadeIn";
import { tokens } from "@/lib/tokens";
import { formatCurrency, formatPercent, formatCurrencySigned } from "@/lib/format";
import type { Property, Tenant, RentPayment, Expense, BankAccount, BankTransaction } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TabId = "cashflow" | "ausgaben" | "zinsbindung" | "darlehen" | "szenario" | "bankkonto";
type UrgencyKind = "expired" | "critical" | "warning" | "ok";

interface RawFinancing {
  id: string;
  user_id: string;
  property_id: string;
  bank?: string | null;
  loan_amount: number;
  interest_rate: number;
  repayment_rate: number;
  rate_monthly: number;
  fixed_until?: string | null;
  current_debt?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties?: any;
}

interface EnrichedFinancing extends RawFinancing {
  propertyName: string;
  propertyType: string;
  urgency: UrgencyKind;
  daysUntilExpiry: number;
  monthsUntilExpiry: number;
}

interface FinanzenHubProps {
  properties: Property[];
  tenants: Tenant[];
  payments: RentPayment[];
  expenses: Expense[];
  financings: RawFinancing[];
  bankAccounts?: BankAccount[];
  bankTransactions?: BankTransaction[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; badge?: string }[] = [
  { id: "cashflow",    label: "Cashflow"    },
  { id: "ausgaben",    label: "Ausgaben"    },
  { id: "zinsbindung", label: "Zinsbindung" },
  { id: "darlehen",    label: "Darlehen"    },
  { id: "szenario",   label: "Szenarien"   },
  { id: "bankkonto",   label: "Bankkonto",  badge: "NEU" },
];

const MONTHS_DE  = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
const MONTHS_FULL = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

const URGENCY_BORDER: Record<UrgencyKind, string> = {
  expired:  "rgba(255,68,68,0.3)",
  critical: "rgba(255,68,68,0.2)",
  warning:  "rgba(255,184,0,0.2)",
  ok:       "rgba(255,255,255,0.08)",
};
const URGENCY_COLOR: Record<UrgencyKind, string> = {
  expired:  "#FF4444",
  critical: "#FF4444",
  warning:  "#FFB800",
  ok:       "#00E0D7",
};
const URGENCY_BADGE: Record<UrgencyKind, { bg: string; text: string; label: string }> = {
  expired:  { bg: "rgba(255,68,68,0.1)",   text: "#FF4444", label: "Abgelaufen" },
  critical: { bg: "rgba(255,68,68,0.1)",   text: "#FF4444", label: "Kritisch"   },
  warning:  { bg: "rgba(255,184,0,0.1)",   text: "#FFB800", label: "Bald fallig"},
  ok:       { bg: "rgba(0,224,215,0.1)",  text: "#00E0D7", label: "Lauft"      },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function computeUrgency(fixedUntil: string | null | undefined): { urgency: UrgencyKind; days: number; months: number } {
  if (!fixedUntil) return { urgency: "ok", days: 9999, months: 999 };
  const days  = Math.ceil((new Date(fixedUntil).getTime() - Date.now()) / 86400000);
  const months = Math.ceil(days / 30);
  const urgency: UrgencyKind = days < 0 ? "expired" : days < 180 ? "critical" : days < 365 ? "warning" : "ok";
  return { urgency, days, months };
}

function progressPct(fixedUntil: string) {
  const expiry = new Date(fixedUntil).getTime();
  const start  = expiry - 10 * 365.25 * 86400000;
  return Math.min(100, Math.max(0, ((Date.now() - start) / (expiry - start)) * 100));
}

function monthYM(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthYM(d);
}

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("de-DE", { month: "2-digit", year: "numeric" });
}
function fmtDateLong(d: string) {
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtDateLocale(d: string) {
  return new Date(d).toLocaleDateString("de-DE");
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Modal({ show, onClose, title, children, footer }: {
  show: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="w-full max-w-[480px] rounded-[20px] overflow-hidden"
            style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
          >
            <div className="px-6 py-5 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-base font-semibold" style={{ color: tokens.color.text }}>{title}</p>
              <button onClick={onClose} style={{ color: "#666" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}>
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">
              {children}
            </div>
            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {footer}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MonthSelector({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  const [y, m] = value.split("-").map(Number);
  const now = new Date();
  const isFuture = new Date(y, m - 1, 1) > new Date(now.getFullYear(), now.getMonth(), 1);
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={() => onChange(shiftMonth(value, -1))}
        className="p-1.5 rounded-[6px] transition-colors"
        style={{ color: "#666" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
      >
        <CaretLeft size={16} />
      </button>
      <div
        className="text-sm font-medium rounded-[8px] px-4 py-2"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", color: tokens.color.text }}
      >
        {MONTHS_FULL[m - 1]} {y}
      </div>
      <button
        onClick={() => { if (!isFuture) onChange(shiftMonth(value, 1)); }}
        className="p-1.5 rounded-[6px] transition-colors"
        style={{ color: isFuture ? "#222" : "#666" }}
        onMouseEnter={(e) => { if (!isFuture) e.currentTarget.style.color = "#888"; }}
        onMouseLeave={(e) => (e.currentTarget.style.color = isFuture ? "#222" : "#666")}
      >
        <CaretRight size={16} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function FinanzenHub({
  properties,
  tenants,
  payments,
  expenses,
  financings,
  bankAccounts = [],
  bankTransactions = [],
}: FinanzenHubProps) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  const today = new Date();
  const [activeTab, setActiveTab]           = useState<TabId>("cashflow");
  const [selectedMonth, setSelectedMonth]   = useState(() => monthYM(today));
  const [showAddExpense, setShowAddExpense]  = useState(false);
  const [showAddFinancing, setShowAddFinancing] = useState(false);
  const [showAnschluss, setShowAnschluss]   = useState(false);
  const [selectedFinancing, setSelectedFinancing] = useState<EnrichedFinancing | null>(null);
  const [savingExpense, setSavingExpense]    = useState(false);
  const [savingFinancing, setSavingFinancing] = useState(false);
  const [newRate, setNewRate]               = useState("");
  const [newRepayment, setNewRepayment]     = useState("2.0");

  const [expenseForm, setExpenseForm] = useState({
    title: "", amount: "", category: "other", property_id: "", date: today.toISOString().split("T")[0], notes: "",
  });
  const [financingForm, setFinancingForm] = useState({
    property_id: properties[0]?.id ?? "",
    bank: "", loan_amount: "", interest_rate: "", repayment_rate: "",
    rate_monthly: "", fixed_until: "", current_debt: "",
  });

  // ── Computed: maps ─────────────────────────────────────────────────────────
  const tenantsMap = Object.fromEntries(tenants.map((t) => [t.id, t]));
  const propertiesMap = Object.fromEntries(properties.map((p) => [p.id, p]));

  // ── Computed: month filter ─────────────────────────────────────────────────
  const [selYear, selMonth] = selectedMonth.split("-").map(Number);

  function inSelectedMonth(dateStr: string) {
    const d = new Date(dateStr);
    return d.getFullYear() === selYear && d.getMonth() + 1 === selMonth;
  }

  const sollEinnahmen = tenants
    .filter((t) => t.is_active)
    .reduce((s, t) => s + t.rent_monthly, 0);

  const thisMonthPayments = payments.filter((p) => inSelectedMonth(p.due_date));

  const istEinnahmen = thisMonthPayments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);

  const thisMonthExpenses = expenses.filter((e) => inSelectedMonth(e.date));

  const ausgabenMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const netCashflow   = istEinnahmen - ausgabenMonth;
  const sollCoveredPct = sollEinnahmen > 0 ? (istEinnahmen / sollEinnahmen) * 100 : 0;

  // ── Computed: category breakdown ───────────────────────────────────────────
  const categoryTotals: Partial<Record<keyof typeof EXPENSE_CATEGORIES, number>> = {};
  for (const e of thisMonthExpenses) {
    const cat = e.category as keyof typeof EXPENSE_CATEGORIES;
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + e.amount;
  }

  // ── Computed: 6-month chart ────────────────────────────────────────────────
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const income = payments
      .filter((p) => {
        const pd = new Date(p.due_date);
        return pd.getFullYear() === y && pd.getMonth() + 1 === m && p.status === "paid";
      })
      .reduce((s, p) => s + p.amount, 0);
    const exp = expenses
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getFullYear() === y && ed.getMonth() + 1 === m;
      })
      .reduce((s, e) => s + e.amount, 0);
    return { label: MONTHS_DE[d.getMonth()], income, expenses: exp };
  });
  const chartMax = Math.max(...last6.map((m) => Math.max(m.income, m.expenses)), 1);

  // ── Computed: enriched financings ──────────────────────────────────────────
  const enrichedFinancings: EnrichedFinancing[] = financings.map((f) => {
    const { urgency, days, months } = computeUrgency(f.fixed_until);
    const prop = Array.isArray(f.properties) ? f.properties[0] : f.properties;
    return {
      ...f,
      propertyName: prop?.name ?? propertiesMap[f.property_id]?.name ?? "Unbekannt",
      propertyType: prop?.type ?? propertiesMap[f.property_id]?.type ?? "",
      urgency,
      daysUntilExpiry: days,
      monthsUntilExpiry: months,
    };
  });

  const criticals = enrichedFinancings.filter((f) => f.urgency === "critical" || f.urgency === "expired");
  const financingsWithDate = enrichedFinancings.filter((f) => f.fixed_until);

  const totalDebt     = financings.reduce((s, f) => s + (f.current_debt ?? f.loan_amount), 0);
  const totalRateMonth = financings.reduce((s, f) => s + f.rate_monthly, 0);

  // ── Anschluss calc ─────────────────────────────────────────────────────────
  const anschlussDebt = selectedFinancing ? (selectedFinancing.current_debt ?? selectedFinancing.loan_amount) : 0;
  const newMonthlyRate = newRate && anschlussDebt > 0
    ? (anschlussDebt * ((parseFloat(newRate) + parseFloat(newRepayment || "0")) / 100)) / 12
    : null;

  // ── Save handlers ──────────────────────────────────────────────────────────
  async function saveExpense() {
    if (!expenseForm.title || !expenseForm.amount) return;
    setSavingExpense(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingExpense(false); return; }
    await supabase.from("expenses").insert({
      user_id:     user.id,
      title:       expenseForm.title,
      amount:      parseFloat(expenseForm.amount),
      category:    expenseForm.category,
      property_id: expenseForm.property_id || null,
      date:        expenseForm.date,
      notes:       expenseForm.notes || null,
    });
    setSavingExpense(false);
    setShowAddExpense(false);
    setExpenseForm({ title: "", amount: "", category: "other", property_id: properties[0]?.id ?? "", date: today.toISOString().split("T")[0], notes: "" });
    router.refresh();
  }

  async function saveFinancing() {
    if (!financingForm.property_id || !financingForm.loan_amount) return;
    setSavingFinancing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingFinancing(false); return; }
    await supabase.from("financings").insert({
      property_id:    financingForm.property_id,
      user_id:        user.id,
      bank:           financingForm.bank || null,
      loan_amount:    parseFloat(financingForm.loan_amount),
      interest_rate:  parseFloat(financingForm.interest_rate) / 100 || 0,
      repayment_rate: parseFloat(financingForm.repayment_rate) / 100 || 0,
      rate_monthly:   parseFloat(financingForm.rate_monthly) || 0,
      fixed_until:    financingForm.fixed_until || null,
      current_debt:   parseFloat(financingForm.current_debt) || parseFloat(financingForm.loan_amount) || null,
    });
    setSavingFinancing(false);
    setShowAddFinancing(false);
    setFinancingForm({ property_id: properties[0]?.id ?? "", bank: "", loan_amount: "", interest_rate: "", repayment_rate: "", rate_monthly: "", fixed_until: "", current_debt: "" });
    router.refresh();
  }

  // ── Stat cards (summary bar) ───────────────────────────────────────────────
  const summaryCards = [
    { label: "SOLL / MONAT",   value: formatCurrency(sollEinnahmen),             color: tokens.color.text },
    { label: "IST-EINNAHMEN",  value: formatCurrency(istEinnahmen),              color: istEinnahmen >= sollEinnahmen ? "#00E0D7" : "#FFB800" },
    { label: "AUSGABEN",       value: formatCurrency(ausgabenMonth),             color: "#FF4444" },
    { label: "NET CASHFLOW",   value: formatCurrencySigned(netCashflow),         color: netCashflow >= 0 ? "#00E0D7" : "#FF4444" },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 w-full" style={{ minHeight: "100vh" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,224,215,0.08)", border: "1px solid rgba(0,224,215,0.12)" }}
          >
            <Bank size={18} color="#00E0D7" />
          </div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]" style={{ color: tokens.color.text }}>
            Finanzen
          </h1>
        </div>
        {activeTab === "ausgaben" && (
          <DarkButton variant="primary" onClick={() => setShowAddExpense(true)}>
            Ausgabe erfassen
          </DarkButton>
        )}
        {activeTab === "darlehen" && (
          <DarkButton variant="primary" onClick={() => setShowAddFinancing(true)}>
            Darlehen hinzufugen
          </DarkButton>
        )}
        {activeTab === "zinsbindung" && (
          <DarkButton variant="primary" onClick={() => setShowAddFinancing(true)}>
            Darlehen hinzufugen
          </DarkButton>
        )}
      </div>

      {/* ── Summary bar ────────────────────────────────────────────────── */}
      <FadeIn delay={0}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {summaryCards.map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-[12px] px-4 py-3.5"
              style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: tokens.color.textSubtle }}>
                {label}
              </p>
              <p className="text-xl font-semibold tracking-tight tabular-nums" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <div className="flex gap-0 mb-6 overflow-x-auto" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(({ id, label, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="px-1 mr-6 pb-3 text-sm font-medium cursor-pointer transition-colors relative flex items-center gap-2 flex-shrink-0"
            style={{ color: activeTab === id ? tokens.color.accent : tokens.color.textSubtle }}
            onMouseEnter={(e) => { if (activeTab !== id) e.currentTarget.style.color = "#aaa"; }}
            onMouseLeave={(e) => { if (activeTab !== id) e.currentTarget.style.color = tokens.color.textSubtle; }}
          >
            {label}
            {badge && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: tokens.color.accentMuted, color: tokens.color.accent }}
              >
                {badge}
              </span>
            )}
            {activeTab === id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{ background: tokens.color.accent }}
                transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.21, 0.47, 0.32, 0.98] }}
        >

          {/* ──────────────────── TAB 1: CASHFLOW ──────────────────────── */}
          {activeTab === "cashflow" && (
            <div>
              <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

              {/* Soll vs Ist card */}
              <div
                className="rounded-[14px] p-5 mb-4"
                style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#777" }}>
                    Mieteinnahmen
                  </p>
                  <p className="text-xs" style={{ color: "#666" }}>
                    {MONTHS_FULL[selMonth - 1]} {selYear}
                  </p>
                </div>

                <div className="flex justify-between text-xs mb-2">
                  <span style={{ color: "#777" }}>Eingegangen</span>
                  <span style={{ color: tokens.color.text }}>
                    {formatCurrency(istEinnahmen)} / {formatCurrency(sollEinnahmen)}
                  </span>
                </div>
                <div className="rounded-full h-2 overflow-hidden" style={{ background: "#1A1A1A" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(sollCoveredPct, 100)}%` }}
                    transition={{ duration: prefersReduced ? 0 : 0.7, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: sollCoveredPct >= 100 ? "#00E0D7" : "#FFB800" }}
                  />
                </div>

                {/* Payment list */}
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#666" }}>
                    Zahlungen dieses Monats
                  </p>
                  {thisMonthPayments.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: "#666" }}>
                      Noch keine Zahlungen in diesem Monat.
                    </p>
                  ) : (
                    <div>
                      {thisMonthPayments.map((p) => {
                        const tenant = tenantsMap[p.tenant_id];
                        const prop   = propertiesMap[p.property_id];
                        const statusColor = p.status === "paid" ? "#00E0D7" : p.status === "late" ? "#FF4444" : "#FFB800";
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between py-3"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          >
                            <div>
                              <p className="text-sm font-medium" style={{ color: tokens.color.text }}>
                                {tenant?.name ?? "Unbekannter Mieter"}
                              </p>
                              <p className="text-[11px] mt-0.5" style={{ color: "#666" }}>
                                {prop?.name ?? ""}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold" style={{ color: statusColor }}>
                                {formatCurrency(p.amount)}
                              </p>
                              <p className="text-[10px] mt-0.5" style={{ color: statusColor }}>
                                {p.status === "paid" ? "Bezahlt" : p.status === "late" ? "Überfällig" : "Ausstehend"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 6-month chart */}
              <div
                className="rounded-[14px] p-5"
                style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="text-xs uppercase tracking-widest mb-5" style={{ color: "#777" }}>
                  Letzte 6 Monate
                </p>
                <div className="flex items-end gap-2" style={{ height: 100 }}>
                  {last6.map(({ label, income, expenses: exp }, i) => (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end gap-0.5" style={{ height: 80 }}>
                        <motion.div
                          initial={prefersReduced ? {} : { height: 0 }}
                          animate={{ height: `${(income / chartMax) * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
                          className="flex-1 rounded-t-sm"
                          style={{ background: "#00E0D7", opacity: 0.75, minHeight: income > 0 ? 2 : 0 }}
                        />
                        <motion.div
                          initial={prefersReduced ? {} : { height: 0 }}
                          animate={{ height: `${(exp / chartMax) * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.07 + 0.05, ease: "easeOut" }}
                          className="flex-1 rounded-t-sm"
                          style={{ background: "#FF4444", opacity: 0.6, minHeight: exp > 0 ? 2 : 0 }}
                        />
                      </div>
                      <p className="text-[10px]" style={{ color: "#666" }}>{label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#00E0D7", opacity: 0.75 }} />
                    <span className="text-[11px]" style={{ color: "#777" }}>Einnahmen</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#FF4444", opacity: 0.6 }} />
                    <span className="text-[11px]" style={{ color: "#777" }}>Ausgaben</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────── TAB 2: AUSGABEN ──────────────────────── */}
          {activeTab === "ausgaben" && (
            <div>
              <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

              {/* Category breakdown */}
              <div
                className="rounded-[14px] p-5 mb-4"
                style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#777" }}>
                  Ausgaben nach Kategorie
                </p>
                {Object.keys(categoryTotals).length === 0 ? (
                  <p className="text-sm" style={{ color: "#666" }}>Keine Ausgaben in diesem Monat.</p>
                ) : (
                  Object.entries(categoryTotals)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([cat, total]) => {
                      const catKey = cat as keyof typeof EXPENSE_CATEGORIES;
                      const info = EXPENSE_CATEGORIES[catKey];
                      const pct = ausgabenMonth > 0 ? ((total as number) / ausgabenMonth) * 100 : 0;
                      return (
                        <div
                          key={cat}
                          className="flex items-center justify-between py-2.5"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: info.color }} />
                            <span className="text-sm" style={{ color: tokens.color.text }}>{info.label}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                              {formatCurrency(total as number)}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: "#666" }}>
                              {pct.toFixed(0)} %
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Expense list */}
              <div
                className="rounded-[14px] overflow-hidden"
                style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div
                  className="px-5 py-3 flex justify-between items-center"
                  style={{ background: "#0C0C0C", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-xs uppercase tracking-widest" style={{ color: "#777" }}>Ausgaben</p>
                  <p className="text-xs font-semibold" style={{ color: tokens.color.text }}>
                    {formatCurrency(ausgabenMonth)}
                  </p>
                </div>

                {thisMonthExpenses.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm mb-4" style={{ color: "#666" }}>Keine Ausgaben in diesem Monat.</p>
                    <DarkButton variant="primary" onClick={() => setShowAddExpense(true)}>
                      Ausgabe erfassen
                    </DarkButton>
                  </div>
                ) : (
                  thisMonthExpenses.map((e) => {
                    const catKey = e.category as keyof typeof EXPENSE_CATEGORIES;
                    const info = EXPENSE_CATEGORIES[catKey];
                    const prop = e.property_id ? propertiesMap[e.property_id] : null;
                    return (
                      <div
                        key={e.id}
                        className="px-5 py-3.5 flex items-center justify-between transition-colors"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={(el) => (el.currentTarget.style.background = "#141414")}
                        onMouseLeave={(el) => (el.currentTarget.style.background = "transparent")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: info.color }} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>{e.title}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: "#666" }}>
                              {fmtDateLocale(e.date)}{prop ? " · " + prop.name : ""}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: "#FF4444" }}>
                          -{formatCurrency(e.amount)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ──────────────────── TAB 3: ZINSBINDUNG ───────────────────── */}
          {activeTab === "zinsbindung" && (
            <div>
              {criticals.length > 0 && (
                <div
                  className="rounded-[14px] px-5 py-4 mb-6 flex items-start gap-3"
                  style={{ background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.15)" }}
                >
                  <Warning size={18} color="#FF4444" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                      {criticals.length} Zinsbindung{criticals.length > 1 ? "en laufen" : " lauft"} bald aus oder ist bereits abgelaufen.
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#666" }}>
                      Handle jetzt um schlechte Konditionen zu vermeiden.
                    </p>
                  </div>
                </div>
              )}

              {financingsWithDate.length === 0 ? (
                <div className="mt-16 flex flex-col items-center text-center">
                  <motion.div
                    animate={prefersReduced ? {} : { y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-14 h-14 rounded-[14px] flex items-center justify-center mx-auto"
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Bank size={24} color="#666" />
                  </motion.div>
                  <p className="text-base font-semibold mt-5" style={{ color: tokens.color.text }}>
                    Keine Zinsbindungen erfasst
                  </p>
                  <p className="text-sm mt-2 max-w-[280px]" style={{ color: "#777" }}>
                    Erfasse deine Darlehen mit Zinsbindungsende um Ablaufdaten zu tracken.
                  </p>
                  <div className="mt-5">
                    <DarkButton variant="primary" onClick={() => setActiveTab("darlehen")}>
                      Darlehen hinzufugen
                    </DarkButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {financingsWithDate.map((f, i) => {
                    const badge    = URGENCY_BADGE[f.urgency];
                    const barColor = URGENCY_COLOR[f.urgency];
                    const pct      = f.fixed_until ? progressPct(f.fixed_until) : 0;
                    return (
                      <FadeIn key={f.id} delay={i * 0.06}>
                        <div
                          className="rounded-[16px] overflow-hidden"
                          style={{ background: "#111", border: `1px solid ${URGENCY_BORDER[f.urgency]}` }}
                        >
                          <div className="px-6 py-5 flex items-start justify-between">
                            <div>
                              <span
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full uppercase mb-2 inline-block"
                                style={{ background: "#1A1A1A", color: "#777" }}
                              >
                                {f.propertyType}
                              </span>
                              <p className="text-base font-semibold" style={{ color: tokens.color.text }}>{f.propertyName}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#666" }}>{f.bank || "Bank nicht angegeben"}</p>
                            </div>
                            <span
                              className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                              style={{ background: badge.bg, color: badge.text }}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <div
                            className="px-6 py-4 grid grid-cols-5 gap-4"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                          >
                            {[
                              { label: "DARLEHEN",   value: formatCurrency(f.loan_amount) },
                              { label: "ZINSSATZ",   value: formatPercent(f.interest_rate) },
                              { label: "TILGUNG",    value: formatPercent(f.repayment_rate) },
                              { label: "RATE / MO",  value: formatCurrency(f.rate_monthly) },
                              {
                                label: "ZINSBINDUNG",
                                value: f.fixed_until ? fmtDateShort(f.fixed_until) : "–",
                                sub: f.fixed_until
                                  ? f.urgency === "expired"
                                    ? { text: "Abgelaufen", color: "#FF4444" }
                                    : { text: f.monthsUntilExpiry + " Monate", color: URGENCY_COLOR[f.urgency] }
                                  : null,
                              },
                            ].map(({ label, value, sub }) => (
                              <div key={label}>
                                <p className="text-[10px] uppercase tracking-wide" style={{ color: "#666" }}>{label}</p>
                                <p className="text-sm font-semibold mt-1" style={{ color: tokens.color.text }}>{value}</p>
                                {sub && <p className="text-[10px] mt-0.5" style={{ color: sub.color }}>{sub.text}</p>}
                              </div>
                            ))}
                          </div>

                          {f.fixed_until && (
                            <div style={{ background: "rgba(255,255,255,0.04)", height: 3 }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: prefersReduced ? 0 : 0.8, ease: "easeOut", delay: i * 0.06 }}
                                style={{ height: "100%", background: barColor }}
                              />
                            </div>
                          )}

                          <div
                            className="px-6 py-3 flex items-center justify-between"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                          >
                            <span className="text-xs" style={{ color: "#666" }}>
                              {f.fixed_until && f.urgency !== "expired" ? "Zinsbindungsende: " + fmtDateLong(f.fixed_until) : ""}
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
              )}
            </div>
          )}

          {/* ──────────────────── TAB 4: DARLEHEN ──────────────────────── */}
          {activeTab === "darlehen" && (
            <div>
              {/* Summary */}
              {financings.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: "GESAMTSCHULDEN", value: formatCurrency(totalDebt) },
                    { label: "RATE / MONAT",   value: formatCurrency(totalRateMonth) },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-[12px] px-4 py-3.5"
                      style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
                    >
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: tokens.color.textSubtle }}>{label}</p>
                      <p className="text-xl font-semibold" style={{ color: tokens.color.text }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {financings.length === 0 ? (
                <div className="mt-10 flex flex-col items-center text-center px-6">
                  <motion.div
                    animate={prefersReduced ? {} : { y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-[20px] flex items-center justify-center mx-auto"
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Bank size={36} color="#333" />
                  </motion.div>

                  <h2 className="text-[24px] font-semibold tracking-[-0.02em] mt-8" style={{ color: tokens.color.text }}>
                    Keine Darlehen erfasst
                  </h2>
                  <p className="text-sm mt-3 max-w-[340px] leading-relaxed" style={{ color: "#555" }}>
                    Hinterlege deine Finanzierungen und behalte Zinsbindungen, Tilgung und Restschuld im Blick.
                  </p>

                  <div className="mt-6">
                    <DarkButton variant="primary" onClick={() => setShowAddFinancing(true)}>
                      Erstes Darlehen hinzufügen
                    </DarkButton>
                  </div>

                  {/* Ghost financing rows */}
                  <div className="mt-10 w-full max-w-[500px] flex flex-col gap-2 select-none pointer-events-none">
                    {[
                      { name: "Altbauwohnung Goslar", bank: "Sparkasse Goslar", rate: "1.850 €/Mo", debt: "189.400 €" },
                      { name: "MFH Braunschweig",    bank: "Deutsche Bank",    rate: "3.120 €/Mo", debt: "312.000 €" },
                    ].map((f, i) => (
                      <div
                        key={f.name}
                        className="rounded-[14px] px-5 py-4 flex items-center justify-between"
                        style={{
                          background: "#111",
                          border: "1px solid rgba(255,255,255,0.07)",
                          opacity: i === 0 ? 0.35 : 0.2,
                          filter: "blur(1.5px)",
                        }}
                      >
                        <div className="text-left">
                          <p className="text-sm font-semibold text-white">{f.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#555" }}>{f.bank}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">{f.rate}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#555" }}>Restschuld {f.debt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {enrichedFinancings.map((f, i) => (
                    <FadeIn key={f.id} delay={i * 0.05}>
                      <div
                        className="rounded-[14px] px-5 py-4 flex items-center justify-between"
                        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <div className="min-w-[160px]">
                          <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>{f.propertyName}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "#666" }}>{f.bank || "Bank nicht angegeben"}</p>
                        </div>
                        <div className="flex gap-6 flex-1 justify-center">
                          {[
                            { label: "DARLEHEN",   value: formatCurrency(f.loan_amount) },
                            { label: "ZINSSATZ",   value: formatPercent(f.interest_rate) },
                            { label: "RATE / MO",  value: formatCurrency(f.rate_monthly) },
                            { label: "RESTSCHULD", value: formatCurrency(f.current_debt ?? f.loan_amount) },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-[10px] uppercase tracking-wide" style={{ color: "#666" }}>{label}</p>
                              <p className="text-sm font-semibold mt-0.5" style={{ color: tokens.color.text }}>{value}</p>
                            </div>
                          ))}
                        </div>
                        <button style={{ color: "#666" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}>
                          <DotsThree size={20} weight="bold" />
                        </button>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──────────────────── TAB 5: SZENARIEN ─────────────────────── */}
          {activeTab === "szenario" && (
            <SzenarioRechner
              financings={enrichedFinancings.map(f => ({
                id: f.id,
                bank: f.bank,
                loan_amount: f.loan_amount,
                interest_rate: f.interest_rate,
                repayment_rate: f.repayment_rate,
                rate_monthly: f.rate_monthly,
                fixed_until: f.fixed_until,
                current_debt: f.current_debt,
                propertyName: f.propertyName,
                propertyType: f.propertyType,
              }))}
            />
          )}

          {/* ──────────────────── TAB 6: BANKKONTO ──────────────────────── */}
          {activeTab === "bankkonto" && (
            <BankAccountTab
              bankAccounts={bankAccounts}
              transactions={bankTransactions}
            />
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Modal: Add Expense ──────────────────────────────────────────── */}
      <Modal
        show={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        title="Ausgabe erfassen"
        footer={
          <>
            <DarkButton variant="ghost" onClick={() => setShowAddExpense(false)}>Abbrechen</DarkButton>
            <DarkButton variant="primary" loading={savingExpense} onClick={saveExpense}>Speichern</DarkButton>
          </>
        }
      >
        <DarkInput
          label="Titel"
          placeholder="z.B. Heizungsreparatur"
          value={expenseForm.title}
          onChange={(e) => setExpenseForm((f) => ({ ...f, title: e.target.value }))}
        />
        <DarkInput
          label="Betrag (€)"
          type="number"
          placeholder="0,00"
          value={expenseForm.amount}
          onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
        />
        <DarkSelect
          label="Kategorie"
          value={expenseForm.category}
          onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
          options={Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => ({ value: key, label: cat.label }))}
        />
        <DarkSelect
          label="Objekt"
          value={expenseForm.property_id}
          onChange={(e) => setExpenseForm((f) => ({ ...f, property_id: e.target.value }))}
          options={[
            { value: "", label: "Alle Objekte" },
            ...properties.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
        <DarkInput
          label="Datum"
          type="date"
          value={expenseForm.date}
          onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))}
        />
        <DarkInput
          label="Notizen"
          placeholder="Optional"
          value={expenseForm.notes}
          onChange={(e) => setExpenseForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </Modal>

      {/* ── Modal: Add Financing ────────────────────────────────────────── */}
      <Modal
        show={showAddFinancing}
        onClose={() => setShowAddFinancing(false)}
        title="Darlehen hinzufugen"
        footer={
          <>
            <DarkButton variant="ghost" onClick={() => setShowAddFinancing(false)}>Abbrechen</DarkButton>
            <DarkButton variant="primary" loading={savingFinancing} onClick={saveFinancing}>Speichern</DarkButton>
          </>
        }
      >
        <DarkSelect
          label="Objekt"
          value={financingForm.property_id}
          onChange={(e) => setFinancingForm((f) => ({ ...f, property_id: e.target.value }))}
          options={properties.map((p) => ({ value: p.id, label: p.name }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <DarkInput label="Bank" placeholder="z.B. Deutsche Bank" value={financingForm.bank}
            onChange={(e) => setFinancingForm((f) => ({ ...f, bank: e.target.value }))} />
          <DarkInput label="Darlehensbetrag (€)" type="number" value={financingForm.loan_amount}
            onChange={(e) => setFinancingForm((f) => ({ ...f, loan_amount: e.target.value }))} />
          <DarkInput label="Zinssatz (%)" type="number" placeholder="3,5" value={financingForm.interest_rate}
            onChange={(e) => setFinancingForm((f) => ({ ...f, interest_rate: e.target.value }))} />
          <DarkInput label="Tilgung (%)" type="number" placeholder="2,0" value={financingForm.repayment_rate}
            onChange={(e) => setFinancingForm((f) => ({ ...f, repayment_rate: e.target.value }))} />
          <DarkInput label="Rate / Monat (€)" type="number" value={financingForm.rate_monthly}
            onChange={(e) => setFinancingForm((f) => ({ ...f, rate_monthly: e.target.value }))} />
          <DarkInput label="Zinsbindung bis" type="date" value={financingForm.fixed_until}
            onChange={(e) => setFinancingForm((f) => ({ ...f, fixed_until: e.target.value }))} />
        </div>
        <DarkInput
          label="Aktuelle Restschuld (€)"
          type="number"
          hint="Optional – für genaues Tracking"
          value={financingForm.current_debt}
          onChange={(e) => setFinancingForm((f) => ({ ...f, current_debt: e.target.value }))}
        />
      </Modal>

      {/* ── Modal: Anschlussfinanzierung ────────────────────────────────── */}
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
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
            >
              <div className="px-6 py-5 flex justify-between items-start" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-base font-semibold" style={{ color: tokens.color.text }}>Anschlussfinanzierung</p>
                  <p className="text-xs mt-0.5" style={{ color: "#666" }}>{selectedFinancing.propertyName}</p>
                </div>
                <button onClick={() => { setShowAnschluss(false); setSelectedFinancing(null); }}
                  style={{ color: "#666" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}>
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 flex flex-col gap-4">
                <div
                  className="rounded-[12px] p-4 grid grid-cols-3 gap-4"
                  style={{ background: "#0C0C0C", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {[
                    { label: "RESTSCHULD",      value: formatCurrency(anschlussDebt) },
                    { label: "AKTUELLER ZINS",  value: formatPercent(selectedFinancing.interest_rate) },
                    { label: "ZINSBINDUNG BIS", value: selectedFinancing.fixed_until ? fmtDateShort(selectedFinancing.fixed_until) : "–" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: "#666" }}>{label}</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: tokens.color.text }}>{value}</p>
                    </div>
                  ))}
                </div>

                <DarkInput
                  label="Neuer Zinssatz (%)"
                  type="number"
                  placeholder="Aktueller Marktzins z.B. 3,8"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                />
                <DarkInput
                  label="Neue Tilgung (%)"
                  type="number"
                  placeholder="2,0"
                  value={newRepayment}
                  onChange={(e) => setNewRepayment(e.target.value)}
                />

                {newMonthlyRate !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[12px] p-4"
                    style={{ background: "rgba(0,224,215,0.06)", border: "1px solid rgba(0,224,215,0.15)" }}
                  >
                    <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "#777" }}>NEUE RATE / MONAT</p>
                    <p className="text-2xl font-semibold" style={{ color: "#00E0D7" }}>
                      {formatCurrency(newMonthlyRate)}
                    </p>
                    <div className="flex justify-between text-xs mt-3" style={{ color: "#777" }}>
                      <span>Aktuell: {formatCurrency(selectedFinancing.rate_monthly)}</span>
                      <span style={{ color: newMonthlyRate - selectedFinancing.rate_monthly > 0 ? "#FF4444" : "#00E0D7" }}>
                        {formatCurrencySigned(newMonthlyRate - selectedFinancing.rate_monthly)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="px-6 py-4 flex justify-end" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
