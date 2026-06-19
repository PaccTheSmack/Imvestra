"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useReducedMotion,
  animate,
} from "motion/react";
import {
  Calculator,
  FloppyDisk,
  CheckCircle,
  CaretDown,
  Lock,
  WarningCircle,
  Plus,
  Trash,
  PiggyBank,
  CurrencyEur,
  Warning,
  MapPin,
  FilePdf,
} from "@phosphor-icons/react";
import {
  calculateProperty,
  calculateTilgungsplan,
  calculateAfA,
  checkKfWPrograms,
  calculateSpekulationsfrist,
} from "@/lib/calculations";
import { formatCurrency, formatPercent, formatCurrencySigned } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { canAccess } from "@/lib/gates";
import { tokens } from "@/lib/tokens";
import DownloadButton from "@/components/pdf/DownloadButton";
import type { DownloadData } from "@/components/pdf/DownloadButton";
import type {
  PropertyType,
  Plan,
  Szenario,
  TilgungsplanRow,
  Financing,
  AfAResult,
} from "@/types";

// ─── constants ────────────────────────────────────────────────
const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "ETW", label: "Eigentumswohnung" },
  { value: "MFH", label: "Mehrfamilienhaus" },
  { value: "EFH", label: "Einfamilienhaus" },
  { value: "DHH", label: "Doppelhaushälfte" },
  { value: "Gewerbe", label: "Gewerbe" },
];

const AFA_TYPE_LABELS: Record<AfAResult["afa_type"], string> = {
  linear_2: "Lineare AfA · 2 % · 50 Jahre",
  linear_3: "Lineare AfA · 2,5 % · 40 Jahre",
  denkmal:  "Denkmal-AfA · 9 % · 8 Jahre",
  neu:      "Neubau-AfA · 3 % · 33 Jahre",
};

const INPUT =
  "w-full bg-white border border-[rgba(16,20,24,0.1)] rounded-[8px] px-3 py-2.5 text-sm text-[#101418] placeholder:text-[#A89A7A] focus:outline-none focus:ring-2 focus:ring-[rgba(160,120,48,0.2)] focus:border-[rgba(160,120,48,0.3)] transition-all duration-150";
const LABEL = "block text-xs font-medium text-[#6A5A3A] mb-1.5";
const SECTION_LABEL =
  "text-[10px] font-semibold text-[#A89A7A] uppercase tracking-widest mb-4";

type TabId =
  | "Übersicht"
  | "Kosten"
  | "Erträge"
  | "Tilgung"
  | "Szenarien"
  | "AfA"
  | "Förderung";

// ─── helpers ──────────────────────────────────────────────────
function getYieldColor(v: number, hi: number, mid: number) {
  if (v >= hi) return tokens.color.positive;
  if (v >= mid) return tokens.color.warning;
  return tokens.color.danger;
}

function MetricValue({
  value,
  formatter,
  className,
  style,
}: {
  value: number;
  formatter: (v: number) => string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const prefersReduced = useReducedMotion();
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(() => formatter(0));

  useEffect(() => {
    if (prefersReduced) {
      mv.set(value);
      setDisplay(formatter(value));
      return;
    }
    const ctrl = animate(mv, value, { duration: 0.6, ease: "easeOut" });
    const unsub = mv.on("change", (v) => setDisplay(formatter(v)));
    return () => { ctrl.stop(); unsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, prefersReduced]);

  return <span className={className} style={style}>{display}</span>;
}

function SuffixInput({ suffix, children }: { suffix: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
        style={{ color: tokens.color.textSubtle }}
      >
        {suffix}
      </span>
    </div>
  );
}

function Row({
  label,
  value,
  color,
  highlighted,
}: {
  label: string;
  value: string;
  color?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center py-3 last:border-0 ${highlighted ? "-mx-5 px-5" : ""}`}
      style={{
        borderBottom: `1px solid ${tokens.color.border}`,
        background: highlighted ? tokens.color.surfaceHover : "transparent",
      }}
    >
      <span
        className="text-sm"
        style={{ color: highlighted ? tokens.color.text : tokens.color.textMuted, fontWeight: highlighted ? 600 : 400 }}
      >
        {label}
      </span>
      <span
        className="text-sm font-semibold tabular-nums"
        style={{ color: color ?? tokens.color.text }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Tilgungsplan chart ────────────────────────────────────────
function TilgungsChart({
  rows,
  prefersReduced,
}: {
  rows: TilgungsplanRow[];
  prefersReduced: boolean | null;
}) {
  const display = rows.slice(0, 20);
  const maxRate = Math.max(...display.map((r) => r.rate_jahres), 1);
  const H = 100;
  const BAR_W = 14;
  const GAP = 2;

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={H + 20}
        viewBox={`0 0 ${display.length * (BAR_W + GAP)} ${H + 20}`}
        preserveAspectRatio="none"
      >
        {display.map((row, i) => {
          const x = i * (BAR_W + GAP);
          const tilgungH = Math.max(1, (row.tilgung / maxRate) * H);
          const zinsenH = Math.max(1, (row.zinsen / maxRate) * H);
          return (
            <g key={row.year}>
              <motion.rect
                x={x} y={H - tilgungH} width={BAR_W} height={tilgungH} rx={1}
                fill={tokens.color.accent} fillOpacity={0.7}
                initial={prefersReduced ? {} : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                style={{ transformBox: "fill-box", transformOrigin: "50% 100%" } as React.CSSProperties}
                transition={{ duration: prefersReduced ? 0 : 0.5, ease: "easeOut", delay: prefersReduced ? 0 : i * 0.02 }}
              />
              <motion.rect
                x={x} y={H - tilgungH - zinsenH} width={BAR_W} height={zinsenH} rx={1}
                fill={tokens.color.danger} fillOpacity={0.6}
                initial={prefersReduced ? {} : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                style={{ transformBox: "fill-box", transformOrigin: "50% 100%" } as React.CSSProperties}
                transition={{ duration: prefersReduced ? 0 : 0.5, ease: "easeOut", delay: prefersReduced ? 0 : i * 0.02 }}
              />
              {row.year % 5 === 0 && (
                <text x={x + BAR_W / 2} y={H + 13} textAnchor="middle" fontSize={7} fill={tokens.color.textSubtle}>
                  {row.year}J
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-1">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: tokens.color.textMuted }}>
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: tokens.color.accent, opacity: 0.7 }} />Tilgung
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: tokens.color.textMuted }}>
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: tokens.color.danger, opacity: 0.6 }} />Zinsen
        </div>
      </div>
    </div>
  );
}

// ─── Kaufpreis-Indikator bar ───────────────────────────────────
function PriceIndicatorBar({
  multiplier,
  prefersReduced,
}: {
  multiplier: number;
  prefersReduced: boolean | null;
}) {
  const pct = Math.min(97, Math.max(2, (multiplier / 40) * 100));
  return (
    <div>
      <div className="relative h-2 rounded-full overflow-hidden">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(to right, ${tokens.color.positive} 0%, ${tokens.color.positive} 50%, ${tokens.color.accent} 50%, ${tokens.color.accent} 62.5%, ${tokens.color.warning} 62.5%, ${tokens.color.warning} 75%, ${tokens.color.danger} 75%, ${tokens.color.danger} 100%)`,
            opacity: 0.4,
          }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2"
          style={{ backgroundColor: tokens.color.text, borderColor: tokens.color.bg, boxShadow: tokens.shadow.sm }}
          initial={prefersReduced ? {} : { left: "0%" }}
          animate={{ left: `${pct}%` }}
          transition={{ duration: prefersReduced ? 0 : 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between mt-1.5" style={{ fontSize: 9, color: tokens.color.textSubtle }}>
        <span>günstig ≤20x</span>
        <span>fair 25x</span>
        <span>sehr teuer &gt;30x</span>
      </div>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────
export default function CalculatorPage() {
  const router = useRouter();

  // form – objekt
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType>("ETW");
  const [address, setAddress] = useState("");
  const [buildYear, setBuildYear] = useState<string>("");
  const [sqm, setSqm] = useState<string>("");
  const [units, setUnits] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [rentMonthly, setRentMonthly] = useState<string>("");
  const [monthlyRateInput, setMonthlyRateInput] = useState<string>("");

  // financing accordion
  const [showFinancing, setShowFinancing] = useState(false);
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [interestRate, setInterestRate] = useState(3.5);
  const [repaymentRate, setRepaymentRate] = useState(2.0);
  const [fixedUntil, setFixedUntil] = useState<string>("2031");

  // steuer & förderung accordion
  const [showSteuer, setShowSteuer] = useState(false);
  const [steuerForm, setSteuerForm] = useState({
    kaufdatum: "",
    steuersatz: "42",
    grundstueck_anteil: "20",
    energieklasse: "",
    is_denkmal: false,
    is_sanierung: false,
  });

  // UI
  const [activeTab, setActiveTab] = useState<TabId>("Übersicht");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isPending, startTransition] = useTransition();
  const prefersReduced = useReducedMotion();

  // plan
  const [plan, setPlan] = useState<Plan>("free");
  useEffect(() => {
    async function fetchPlan() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles").select("plan").eq("id", user.id).single();
      if (profile?.plan) setPlan(profile.plan as Plan);
    }
    fetchPlan();
  }, []);

  // tilgung
  const [tilgungYears, setTilgungYears] = useState<10 | 20 | 30>(20);

  // szenarien
  const [szenarien, setSzenarien] = useState<Szenario[]>([
    { id: "base", label: "Basis", kaufpreis: 0, miete_monthly: 0, zinssatz: 3.5, tilgung: 2.0, sqm: 0, units: 1 },
  ]);

  // ─── derived ──────────────────────────────────────────────────
  const pp = Number(purchasePrice) || 0;
  const rent = Number(rentMonthly) || 0;
  const hasData = pp > 0 && rent > 0;
  const loan = Number(loanAmount) || 0;
  const builtYear = Number(buildYear) || 0;
  const isNeubau = builtYear >= 2023;
  const grundstueckAnteilVal = parseFloat(steuerForm.grundstueck_anteil) / 100 || 0.2;
  const steuersatzVal = parseFloat(steuerForm.steuersatz) / 100 || 0.42;

  const computedMonthlyRate =
    loan > 0
      ? (loan * (interestRate + repaymentRate)) / 100 / 12
      : Number(monthlyRateInput) || 0;

  const financing: Financing | undefined =
    loan > 0
      ? {
          id: "", property_id: "", bank: "",
          loan_amount: loan,
          interest_rate: interestRate / 100,
          repayment_rate: repaymentRate / 100,
          rate_monthly: computedMonthlyRate,
          fixed_until: fixedUntil,
          current_debt: loan,
        }
      : Number(monthlyRateInput) > 0
      ? {
          id: "", property_id: "", bank: "",
          loan_amount: 0, interest_rate: 0, repayment_rate: 0,
          rate_monthly: Number(monthlyRateInput),
          fixed_until: "", current_debt: 0,
        }
      : undefined;

  const result = hasData
    ? calculateProperty(
        {
          id: "", user_id: "", name: name || "Objekt", address, type,
          build_year: builtYear || 2000,
          sqm: Number(sqm) || 0,
          purchase_price: pp,
          ancillary_costs_pct: 0.1,
          market_value: pp,
          rent_monthly: rent,
          monthly_rate: computedMonthlyRate,
          units,
        },
        financing
      )
    : null;

  const qualityScore = result
    ? Math.round(Math.min(100, Math.max(0,
        (result.gross_yield / 0.08) * 40 +
        (result.cashflow_monthly > 0 ? 40 : 0) +
        (result.ltv < 0.8 ? 20 : 0)
      )))
    : 0;
  const scoreColor = qualityScore > 70 ? tokens.color.positive : qualityScore > 40 ? tokens.color.warning : tokens.color.danger;
  const scoreLabel = qualityScore > 70 ? "Stark" : qualityScore > 40 ? "Solide" : "Schwach";

  // tilgungsplan
  const tilgungsplan: TilgungsplanRow[] =
    loan > 0 && interestRate > 0
      ? calculateTilgungsplan(loan, interestRate / 100, repaymentRate / 100, tilgungYears)
      : [];
  const totalZinsen = tilgungsplan.reduce((s, r) => s + r.zinsen, 0);
  const totalTilgung = tilgungsplan.reduce((s, r) => s + r.tilgung, 0);
  const lastRow = tilgungsplan[tilgungsplan.length - 1];

  // afa
  const afaResult: AfAResult | null =
    pp > 0 && builtYear > 0
      ? calculateAfA(pp, builtYear, steuerForm.is_denkmal, isNeubau, grundstueckAnteilVal, steuersatzVal)
      : null;

  // kfw
  const kfwPrograms = checkKfWPrograms(
    builtYear || 2000,
    steuerForm.is_sanierung,
    isNeubau,
    steuerForm.energieklasse || undefined
  );
  const sortedPrograms = [...kfwPrograms].sort((a, b) => (b.applicable ? 1 : 0) - (a.applicable ? 1 : 0));

  // speku
  const spekuResult =
    steuerForm.kaufdatum && pp > 0
      ? calculateSpekulationsfrist(steuerForm.kaufdatum, undefined, pp, steuersatzVal)
      : null;

  // 150er Regel
  const faktor150 = rent > 0 ? pp / rent : 0;

  // auto-sync Basis szenario
  useEffect(() => {
    setSzenarien((prev) =>
      prev.map((s) =>
        s.id === "base"
          ? { ...s, kaufpreis: pp, miete_monthly: rent, zinssatz: interestRate, tilgung: repaymentRate, sqm: Number(sqm) || 0, units }
          : s
      )
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pp, rent, interestRate, repaymentRate, sqm, units]);

  useEffect(() => {
    setSaved(false);
    setSaveError("");
  }, [purchasePrice, rentMonthly, sqm, name]);

  function getSzenarioResult(s: Szenario) {
    if (!s.kaufpreis || !s.miete_monthly) return null;
    const fin: Financing | undefined =
      s.zinssatz > 0 && s.kaufpreis > 0
        ? {
            id: "", property_id: "", bank: "",
            loan_amount: s.kaufpreis * 0.8,
            interest_rate: s.zinssatz / 100,
            repayment_rate: s.tilgung / 100,
            rate_monthly: (s.kaufpreis * 0.8 * (s.zinssatz + s.tilgung)) / 100 / 12,
            fixed_until: "2031",
            current_debt: s.kaufpreis * 0.8,
          }
        : undefined;
    return calculateProperty(
      { id: "", user_id: "", name: s.label, address: "", type: "ETW" as PropertyType,
        build_year: 2000, sqm: s.sqm, purchase_price: s.kaufpreis, ancillary_costs_pct: 0.1,
        market_value: s.kaufpreis, rent_monthly: s.miete_monthly, monthly_rate: fin?.rate_monthly ?? 0, units: s.units },
      fin
    );
  }

  function addSzenario() {
    if (szenarien.length >= 3) return;
    const base = szenarien[0];
    setSzenarien((prev) => [
      ...prev,
      {
        id: `s${Date.now()}`, label: `Szenario ${prev.length + 1}`,
        kaufpreis: base.kaufpreis * 1.1, miete_monthly: base.miete_monthly,
        zinssatz: base.zinssatz + 0.5, tilgung: base.tilgung, sqm: base.sqm, units: base.units,
      },
    ]);
  }

  function updateSzenario(id: string, field: keyof Szenario, val: string | number) {
    setSzenarien((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  }

  function removeSzenario(id: string) {
    setSzenarien((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSave() {
    if (!result) return;
    setSaved(false);
    setSaveError("");
    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (plan === "free") {
        const { count } = await supabase
          .from("properties").select("*", { count: "exact", head: true }).eq("user_id", user.id);
        if ((count ?? 0) >= 1) {
          setSaveError("Free-Plan: Maximal 1 Objekt. Upgrade auf Pro.");
          return;
        }
      }

      const { data: prop, error } = await supabase
        .from("properties")
        .insert({
          user_id: user.id, name: name || "Objekt", address, type,
          build_year: builtYear || 2000, sqm: Number(sqm) || 0,
          purchase_price: pp, ancillary_costs_pct: 0.1, market_value: pp,
          rent_monthly: rent, monthly_rate: computedMonthlyRate, units,
        })
        .select().single();

      if (!error && prop && loan > 0) {
        await supabase.from("financings").insert({
          property_id: prop.id, bank: "", loan_amount: loan,
          interest_rate: interestRate / 100, repayment_rate: repaymentRate / 100,
          rate_monthly: computedMonthlyRate, fixed_until: fixedUntil || null, current_debt: loan,
        });
      }
      if (!error) setSaved(true);
    });
  }

  const canSave = canAccess("save_property", plan);
  const canPdf  = canAccess("pdf_export", plan);

  const downloadData: DownloadData | undefined = result
    ? {
        propertyName: name || "Objekt", address, type,
        purchase_price: pp, rent_monthly: rent, sqm: Number(sqm) || 0,
        result, financing, tilgungsplan: tilgungsplan.slice(0, 10),
        afa: afaResult ?? undefined,
        kaufdatum: steuerForm.kaufdatum || undefined,
        steuersatz: parseFloat(steuerForm.steuersatz) || 42,
      }
    : undefined;

  const TABS: TabId[] = ["Übersicht", "Kosten", "Erträge", "Tilgung", "Szenarien", "AfA", "Förderung"];

  const szenarioResults = szenarien.map((s) => ({ s, r: getSzenarioResult(s) }));

  function bestIdx(field: string): number {
    const vals = szenarioResults.map(({ s, r }) => {
      if (!r) return -Infinity;
      if (field === "kaufpreis") return -s.kaufpreis;
      if (field === "gross_yield") return r.gross_yield;
      if (field === "net_yield") return r.net_yield;
      if (field === "cashflow") return r.cashflow_monthly;
      if (field === "roe") return r.roe;
      if (field === "dscr") return r.dscr;
      return -Infinity;
    });
    return vals.indexOf(Math.max(...vals));
  }

  // ─── render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: tokens.color.bg }}>
      <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(160,120,48,0.08)] border border-[rgba(160,120,48,0.12)] rounded-[10px] flex items-center justify-center flex-shrink-0">
            <Calculator size={18} color="#A07830" />
          </div>
          <div>
            <p className="text-[20px] font-semibold text-[#101418] tracking-[-0.02em] leading-tight">Renditerechner</p>
            <p className="text-xs text-[#6A5A3A] mt-0.5">Objekt analysieren und Rendite berechnen</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {result && (
            <div className="flex items-center gap-2">
              {(() => {
                const plzMatch = address.match(/\d{5}/)
                const plzFromAddress = plzMatch?.[0]
                if (!plzFromAddress) return null
                return (
                  <button
                    onClick={() => router.push(
                      `/standort?plz=${plzFromAddress}` +
                      `&kaufpreis=${pp}` +
                      `&miete=${rent}` +
                      `&sqm=${Number(sqm) || 0}`
                    )}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-[8px] transition-all border"
                    style={{ borderColor: tokens.color.border, color: tokens.color.textMuted, background: "transparent" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(160,120,48,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "#A07830" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = tokens.color.border; (e.currentTarget as HTMLButtonElement).style.color = tokens.color.textMuted }}
                  >
                    <MapPin size={13} />
                    Standort prüfen
                  </button>
                )
              })()}
              {canSave ? (
                <motion.button
                  onClick={handleSave}
                  disabled={isPending}
                  whileTap={prefersReduced ? {} : { scale: 0.98 }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-[8px] transition-all disabled:opacity-60"
                  style={saved ? {
                    background: tokens.color.positiveBg,
                    border: `1px solid rgba(45,106,45,0.2)`,
                    color: tokens.color.positive,
                  } : {
                    background: tokens.color.surfaceHover,
                    border: `1px solid ${tokens.color.borderStrong}`,
                    color: tokens.color.text,
                  }}
                >
                  {saved ? <CheckCircle size={14} /> : <FloppyDisk size={14} />}
                  {isPending ? "Speichern…" : saved ? "Gespeichert" : "Speichern"}
                </motion.button>
              ) : (
                <button
                  onClick={() => router.push("/settings")}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-[8px] transition-all"
                  style={{ border: `1px solid ${tokens.color.border}`, color: tokens.color.textMuted, background: "transparent" }}
                >
                  <Lock size={14} />Speichern (Pro)
                </button>
              )}
              {canPdf ? (
                <DownloadButton propertyName={name || "Objekt"} data={downloadData} />
              ) : (
                <button
                  onClick={() => router.push("/settings")}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-[8px] transition-all"
                  style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.2)", color: "#FF4444" }}
                >
                  <FilePdf size={14} />PDF Export
                </button>
              )}
            </div>
          )}
          {saveError && (
            <motion.p
              initial={prefersReduced ? {} : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs flex items-center gap-1.5"
              style={{ color: tokens.color.danger }}
            >
              <WarningCircle size={13} />{saveError}
            </motion.p>
          )}
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Inputs */}
        <div
          className="rounded-[14px] p-6 flex flex-col gap-6"
          style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
        >

            {/* Section 1 – Objekt */}
            <div>
              <p className={SECTION_LABEL}>Objekt</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={LABEL}>Bezeichnung</label>
                  <input className={INPUT} placeholder="z.B. Altbauwohnung Goslar" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Typ</label>
                  <select className={INPUT} value={type} onChange={(e) => setType(e.target.value as PropertyType)}>
                    {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Einheiten (WE)</label>
                  <input type="number" min={1} className={INPUT} placeholder="1" value={units} onChange={(e) => setUnits(Math.max(1, Number(e.target.value)))} />
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>Adresse</label>
                  <input className={INPUT} placeholder="Straße, PLZ Ort" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Baujahr</label>
                  <input type="number" className={INPUT} placeholder="1985" value={buildYear} onChange={(e) => setBuildYear(e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Wohnfläche</label>
                  <SuffixInput suffix="m²">
                    <input type="number" className={`${INPUT} pr-10`} placeholder="75" value={sqm} onChange={(e) => setSqm(e.target.value)} />
                  </SuffixInput>
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${tokens.color.border}` }} />

            {/* Section 2 – Finanzen */}
            <div>
              <p className={SECTION_LABEL}>Finanzen</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={LABEL}>Kaufpreis</label>
                  <SuffixInput suffix="€">
                    <input type="number" className={`${INPUT} pr-8`} placeholder="250.000" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
                  </SuffixInput>
                </div>
                <div>
                  <label className={LABEL}>Kaltmiete / Monat</label>
                  <SuffixInput suffix="€">
                    <input type="number" className={`${INPUT} pr-8`} placeholder="850" value={rentMonthly} onChange={(e) => setRentMonthly(e.target.value)} />
                  </SuffixInput>
                </div>
                <div>
                  <label className={LABEL}>Monatliche Rate</label>
                  <SuffixInput suffix="€">
                    <input
                      type="number" className={`${INPUT} pr-8`} placeholder="0"
                      value={loan > 0 ? computedMonthlyRate.toFixed(0) : monthlyRateInput}
                      readOnly={loan > 0}
                      onChange={(e) => setMonthlyRateInput(e.target.value)}
                    />
                  </SuffixInput>
                  <p className="text-[10px] mt-1" style={{ color: tokens.color.textSubtle }}>Geplante Darlehensrate</p>
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${tokens.color.border}` }} />

            {/* Section 3 – Finanzierung */}
            <div>
              <button type="button" onClick={() => setShowFinancing(!showFinancing)} className="flex items-center justify-between w-full cursor-pointer py-1">
                <p className={`${SECTION_LABEL} mb-0`}>Finanzierung (optional)</p>
                <motion.div animate={prefersReduced ? {} : { rotate: showFinancing ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <CaretDown size={14} color={tokens.color.textSubtle} />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {showFinancing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: prefersReduced ? 0 : 0.2 }} style={{ overflow: "hidden" }}
                  >
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div className="col-span-2">
                        <label className={LABEL}>Darlehensbetrag</label>
                        <SuffixInput suffix="€">
                          <input type="number" className={`${INPUT} pr-8`} placeholder="150.000" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
                        </SuffixInput>
                      </div>
                      <div>
                        <label className={LABEL}>Zinssatz</label>
                        <SuffixInput suffix="%">
                          <input type="number" step={0.1} className={`${INPUT} pr-8`} placeholder="3,5" value={interestRate} disabled={!loan} onChange={(e) => setInterestRate(Number(e.target.value))} />
                        </SuffixInput>
                      </div>
                      <div>
                        <label className={LABEL}>Tilgung</label>
                        <SuffixInput suffix="%">
                          <input type="number" step={0.1} className={`${INPUT} pr-8`} placeholder="2,0" value={repaymentRate} disabled={!loan} onChange={(e) => setRepaymentRate(Number(e.target.value))} />
                        </SuffixInput>
                      </div>
                      <div>
                        <label className={LABEL}>Zinsbindung bis</label>
                        <input type="number" className={INPUT} placeholder="2031" value={fixedUntil} onChange={(e) => setFixedUntil(e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ borderTop: `1px solid ${tokens.color.border}` }} />

            {/* Section 4 – Steuer & Förderung */}
            <div>
              <button type="button" onClick={() => setShowSteuer(!showSteuer)} className="flex items-center justify-between w-full cursor-pointer py-1">
                <p className={`${SECTION_LABEL} mb-0`}>Steuer & Förderung (optional)</p>
                <motion.div animate={prefersReduced ? {} : { rotate: showSteuer ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <CaretDown size={14} color={tokens.color.textSubtle} />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {showSteuer && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: prefersReduced ? 0 : 0.2 }} style={{ overflow: "hidden" }}
                  >
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div className="col-span-2">
                        <label className={LABEL}>Kaufdatum</label>
                        <input
                          type="date" className={INPUT}
                          value={steuerForm.kaufdatum}
                          onChange={(e) => setSteuerForm((f) => ({ ...f, kaufdatum: e.target.value }))}
                        />
                        <p className="text-[10px] mt-1" style={{ color: tokens.color.textSubtle }}>Für Spekulationsfrist-Berechnung</p>
                      </div>
                      <div>
                        <label className={LABEL}>Steuersatz</label>
                        <SuffixInput suffix="%">
                          <input
                            type="number" className={`${INPUT} pr-8`} placeholder="42"
                            value={steuerForm.steuersatz}
                            onChange={(e) => setSteuerForm((f) => ({ ...f, steuersatz: e.target.value }))}
                          />
                        </SuffixInput>
                        <p className="text-[10px] mt-1" style={{ color: tokens.color.textSubtle }}>Persönlicher Grenzsteuersatz</p>
                      </div>
                      <div>
                        <label className={LABEL}>Grundstücksanteil</label>
                        <SuffixInput suffix="%">
                          <input
                            type="number" className={`${INPUT} pr-8`} placeholder="20"
                            value={steuerForm.grundstueck_anteil}
                            onChange={(e) => setSteuerForm((f) => ({ ...f, grundstueck_anteil: e.target.value }))}
                          />
                        </SuffixInput>
                        <p className="text-[10px] mt-1" style={{ color: tokens.color.textSubtle }}>Nicht abschreibbar</p>
                      </div>
                      <div className="col-span-2">
                        <label className={LABEL}>Energieeffizienzklasse</label>
                        <select
                          className={INPUT}
                          value={steuerForm.energieklasse}
                          onChange={(e) => setSteuerForm((f) => ({ ...f, energieklasse: e.target.value }))}
                        >
                          {["", "A+", "A", "B", "C", "D", "E", "F", "G", "H"].map((k) => (
                            <option key={k} value={k}>{k || "- nicht bekannt -"}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 flex gap-6">
                        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: tokens.color.text }}>
                          <input
                            type="checkbox" checked={steuerForm.is_denkmal}
                            onChange={(e) => setSteuerForm((f) => ({ ...f, is_denkmal: e.target.checked }))}
                            className="w-4 h-4 accent-[#A07830]"
                          />
                          Denkmalschutz-Objekt
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: tokens.color.text }}>
                          <input
                            type="checkbox" checked={steuerForm.is_sanierung}
                            onChange={(e) => setSteuerForm((f) => ({ ...f, is_sanierung: e.target.checked }))}
                            className="w-4 h-4 accent-[#A07830]"
                          />
                          Sanierung geplant
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

        </div>

        {/* Right: Results */}
        <div>
          <AnimatePresence mode="wait">
            {!hasData ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.25 }}
                className="flex flex-col items-center mt-24 px-8"
              >
                <motion.div
                  animate={prefersReduced ? {} : { y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-[20px] flex items-center justify-center"
                  style={{
                    background: tokens.color.surface,
                    border: `1px solid ${tokens.color.border}`,
                    boxShadow: tokens.shadow.md,
                  }}
                >
                  <Calculator size={32} color={tokens.color.textSubtle} />
                </motion.div>
                <p className="text-base font-semibold mt-5 text-center" style={{ color: tokens.color.text }}>Ergebnis erscheint sofort</p>
                <p className="text-sm mt-2 text-center" style={{ color: tokens.color.textSubtle }}>Kaufpreis und Miete eingeben.</p>
                <div className="flex gap-2 justify-center mt-6 flex-wrap">
                  {["Kaufpreis eingeben", "Miete eingeben", "Baujahr eingeben"].map((hint) => (
                    <span
                      key={hint}
                      className="rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"
                      style={{
                        background: tokens.color.surface,
                        border: `1px solid ${tokens.color.border}`,
                        color: tokens.color.textMuted,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: tokens.color.border }} />{hint}
                    </span>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
                transition={{ duration: prefersReduced ? 0 : 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="px-6 py-5"
              >
                {/* Tab card */}
                <div
                  className="rounded-[14px] overflow-hidden mb-4"
                  style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
                >
                  {/* Tab bar */}
                  <div
                    className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ borderBottom: `1px solid ${tokens.color.border}` }}
                  >
                    {TABS.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="flex-shrink-0 py-3 px-4 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        style={activeTab === tab ? {
                          color: tokens.color.accent,
                          borderBottom: `2px solid ${tokens.color.accent}`,
                          marginBottom: -1,
                        } : {
                          color: tokens.color.textSubtle,
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={prefersReduced ? {} : { opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={prefersReduced ? {} : { opacity: 0, x: -6 }}
                      transition={{ duration: prefersReduced ? 0 : 0.15 }}
                      className="px-5 py-4"
                    >

                      {/* ÜBERSICHT */}
                      {activeTab === "Übersicht" && (
                        <div>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            {[
                              { label: "BRUTTORENDITE",    value: result!.gross_yield,      formatter: formatPercent,                                        color: getYieldColor(result!.gross_yield, 0.05, 0.03),  sub: "Kaufpreis-basiert" },
                              { label: "NETTOMIETRENDITE", value: result!.net_yield,         formatter: formatPercent,                                        color: getYieldColor(result!.net_yield, 0.04, 0.02),    sub: "Gesamtinvestition" },
                              { label: "CASHFLOW / MO.",   value: result!.cashflow_monthly,  formatter: (v: number) => formatCurrencySigned(Math.round(v)),   color: result!.cashflow_monthly >= 0 ? tokens.color.positive : tokens.color.danger, sub: "Nach Rate & Kosten" },
                              { label: "ROE",              value: result!.roe,               formatter: formatPercent,                                        color: tokens.color.text, sub: "Eigenkapitalrendite" },
                            ].map(({ label, value, formatter, color, sub }) => (
                              <div
                                key={label}
                                className="rounded-[12px] p-4"
                                style={{ border: `1px solid ${tokens.color.border}`, background: tokens.color.bgSubtle }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: tokens.color.textSubtle }}>{label}</p>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                </div>
                                <MetricValue value={value} formatter={formatter} className="text-[26px] font-semibold tracking-[-0.03em] leading-none" style={{ color }} />
                                <p className="text-[10px] mt-1.5" style={{ color: tokens.color.textSubtle }}>{sub}</p>
                              </div>
                            ))}
                          </div>

                          {/* Quality bar */}
                          <div
                            className="rounded-[12px] px-4 py-3 flex items-center gap-3 mb-4"
                            style={{ border: `1px solid ${tokens.color.border}`, background: tokens.color.bgSubtle }}
                          >
                            <p className="text-xs font-semibold whitespace-nowrap" style={{ color: tokens.color.textMuted }}>Objektqualität</p>
                            <div
                              className="flex-1 rounded-full h-1.5 overflow-hidden"
                              style={{ background: tokens.color.surfaceActive }}
                            >
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: scoreColor }}
                                initial={{ width: "0%" }}
                                animate={{ width: `${qualityScore}%` }}
                                transition={{ duration: prefersReduced ? 0 : 0.8, ease: "easeOut", delay: prefersReduced ? 0 : 0.2 }}
                              />
                            </div>
                            <p className="text-sm font-semibold whitespace-nowrap" style={{ color: scoreColor }}>{scoreLabel}</p>
                          </div>

                          {/* DSCR */}
                          {loan > 0 && result!.dscr > 0 && (
                            <div
                              className="flex justify-between items-center py-3"
                              style={{ borderTop: `1px solid ${tokens.color.border}` }}
                            >
                              <span
                                className="text-sm cursor-help underline decoration-dotted"
                                style={{ color: tokens.color.textMuted }}
                                title="Debt Service Coverage Ratio: NOI / Jahresschuldendienst. Banken erwarten mind. 1,2"
                              >
                                DSCR
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold" style={{ color: result!.dscr >= 1.5 ? tokens.color.positive : result!.dscr >= 1.2 ? tokens.color.warning : tokens.color.danger }}>
                                  {result!.dscr >= 1.5 ? "Sehr gut" : result!.dscr >= 1.2 ? "Ausreichend" : "Kritisch"}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                                  color: result!.dscr >= 1.5 ? tokens.color.positive : result!.dscr >= 1.2 ? tokens.color.warning : tokens.color.danger,
                                  background: result!.dscr >= 1.5 ? tokens.color.positiveBg : result!.dscr >= 1.2 ? tokens.color.warningBg : tokens.color.dangerBg,
                                }}>
                                  {result!.dscr.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Kaufpreis-Indikator */}
                          <div
                            className="rounded-[12px] p-4 mt-3"
                            style={{ background: tokens.color.bgSubtle, border: `1px solid ${tokens.color.border}` }}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <p className="text-xs font-semibold" style={{ color: tokens.color.textMuted }}>Kaufpreis-Indikator</p>
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{
                                background: result!.price_indicator === "günstig" ? tokens.color.positiveBg : result!.price_indicator === "fair" ? tokens.color.accentMuted : result!.price_indicator === "teuer" ? tokens.color.warningBg : tokens.color.dangerBg,
                                color:      result!.price_indicator === "günstig" ? tokens.color.positive : result!.price_indicator === "fair" ? tokens.color.accent : result!.price_indicator === "teuer" ? tokens.color.warning : tokens.color.danger,
                              }}>
                                {result!.price_indicator}
                              </span>
                            </div>

                            <div className="flex justify-between text-sm mb-1">
                              <span style={{ color: tokens.color.textMuted }}>Kaufpreisfaktor (Jahresmiete)</span>
                              <span className="font-semibold" style={{ color: tokens.color.text }}>{result!.price_multiplier.toFixed(1)}x</span>
                            </div>
                            <div className="flex justify-between text-xs mb-1" style={{ color: tokens.color.textSubtle }}>
                              <span>Fairer Wertbereich (20–25x)</span>
                              <span>{formatCurrency(result!.fair_value_min)} – {formatCurrency(result!.fair_value_max)}</span>
                            </div>

                            {/* 150er Regel */}
                            <div
                              className="flex justify-between items-center py-2 mt-2"
                              style={{ borderTop: `1px solid ${tokens.color.border}` }}
                            >
                              <span
                                className="text-sm cursor-help underline decoration-dotted"
                                style={{ color: tokens.color.textMuted }}
                                title="Klassische Faustformel: Kaufpreis ÷ Monatsmiete. Sollte ≤ 150 sein."
                              >
                                150er Regel
                              </span>
                              <span
                                className="text-sm font-semibold tabular-nums"
                                style={{ color: faktor150 <= 150 ? tokens.color.positive : faktor150 <= 200 ? tokens.color.warning : tokens.color.danger }}
                              >
                                {faktor150.toFixed(0)}x
                              </span>
                            </div>
                            <div className="flex justify-between items-center pb-3">
                              <span className="text-xs" style={{ color: tokens.color.textSubtle }}>Fairer Kaufpreis (150x)</span>
                              <span className="text-xs font-medium" style={{ color: tokens.color.text }}>{formatCurrency(rent * 150)}</span>
                            </div>

                            <PriceIndicatorBar multiplier={result!.price_multiplier} prefersReduced={prefersReduced} />
                          </div>
                        </div>
                      )}

                      {/* KOSTEN */}
                      {activeTab === "Kosten" && (
                        <div>
                          <Row label="Kaufpreis" value={formatCurrency(pp)} />
                          <Row label="Nebenkosten (10 %)" value={formatCurrency(result!.ancillary_costs)} />
                          <Row label="Gesamtinvestition" value={formatCurrency(result!.total_investment)} highlighted />
                          <Row label="Instandhaltung / Jahr" value={formatCurrency(result!.maintenance_yearly)} />
                          <Row label="Verwaltung / Jahr" value={formatCurrency(result!.management_yearly)} />
                          <Row label="Leerstandsverlust" value={formatCurrency(result!.vacancy_loss)} color={tokens.color.danger} />
                        </div>
                      )}

                      {/* ERTRÄGE */}
                      {activeTab === "Erträge" && (
                        <div>
                          <Row label="Kaltmiete / Jahr" value={formatCurrency(rent * 12)} />
                          <Row label="Leerstandsabzug (3 %)" value={"−" + formatCurrency(result!.vacancy_loss)} color={tokens.color.danger} />
                          <Row label="Eff. Jahresmiete" value={formatCurrency(result!.effective_rent_yearly)} />
                          <Row label="NOI" value={formatCurrency(result!.noi)} highlighted />
                          {computedMonthlyRate > 0 && (
                            <Row label="Darlehensrate / Jahr" value={formatCurrency(computedMonthlyRate * 12)} color={tokens.color.danger} />
                          )}
                          <Row label="Cashflow / Jahr" value={formatCurrencySigned(result!.cashflow_yearly)} color={result!.cashflow_yearly >= 0 ? tokens.color.positive : tokens.color.danger} highlighted />
                        </div>
                      )}

                      {/* TILGUNG */}
                      {activeTab === "Tilgung" && (
                        <div>
                          {loan > 0 && interestRate > 0 ? (
                            <>
                              <div className="flex justify-between items-center mb-4">
                                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tokens.color.textMuted }}>Tilgungsplan</p>
                                <div className="flex items-center gap-1.5">
                                  {([10, 20, 30] as const).map((y) => (
                                    <button
                                      key={y}
                                      onClick={() => setTilgungYears(y)}
                                      className="text-xs px-2.5 py-1 rounded-[6px] transition-all"
                                      style={tilgungYears === y ? {
                                        background: tokens.color.accent,
                                        color: tokens.color.bg,
                                      } : {
                                        background: tokens.color.surfaceHover,
                                        color: tokens.color.textMuted,
                                      }}
                                    >{y}J</button>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mb-4">
                                {[
                                  { label: "Gesamtzinsen",   value: formatCurrency(totalZinsen),                  color: totalZinsen > loan * 0.3 ? tokens.color.danger : tokens.color.text },
                                  { label: "Gesamttilgung",  value: formatCurrency(totalTilgung),                 color: tokens.color.text },
                                  { label: `Restschuld ${tilgungYears}J.`, value: formatCurrency(lastRow?.restschuld_end ?? 0), color: (lastRow?.restschuld_end ?? 0) === 0 ? tokens.color.positive : tokens.color.warning },
                                ].map(({ label, value, color }) => (
                                  <div
                                    key={label}
                                    className="rounded-[10px] p-3"
                                    style={{ background: tokens.color.bgSubtle, border: `1px solid ${tokens.color.border}` }}
                                  >
                                    <p className="text-[9px] mb-1.5 leading-tight" style={{ color: tokens.color.textSubtle }}>{label}</p>
                                    <p className="text-xs font-semibold" style={{ color }}>{value}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="mb-3">
                                <TilgungsChart rows={tilgungsplan} prefersReduced={prefersReduced} />
                              </div>
                              <div className="max-h-[240px] overflow-y-auto [scrollbar-width:thin]">
                                <table className="w-full">
                                  <thead>
                                    <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                                      {["Jahr", "Restschuld", "Zinsen", "Tilgung", "Rate/Jahr"].map((h) => (
                                        <th key={h} className="text-left text-[9px] uppercase tracking-wide pb-2 font-semibold" style={{ color: tokens.color.textSubtle }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tilgungsplan.map((row) => (
                                      <tr
                                        key={row.year}
                                        style={{
                                          background: row.year % 5 === 0 ? tokens.color.bgSubtle : "transparent",
                                          borderBottom: `1px solid ${tokens.color.border}`,
                                        }}
                                      >
                                        <td className="text-xs font-medium py-1.5 tabular-nums" style={{ color: tokens.color.textMuted }}>{row.year}</td>
                                        <td className="text-xs tabular-nums" style={{ color: tokens.color.text }}>{formatCurrency(row.restschuld_end)}</td>
                                        <td className="text-xs tabular-nums" style={{ color: tokens.color.danger }}>{formatCurrency(row.zinsen)}</td>
                                        <td className="text-xs tabular-nums" style={{ color: tokens.color.accent }}>{formatCurrency(row.tilgung)}</td>
                                        <td className="text-xs font-medium tabular-nums" style={{ color: tokens.color.text }}>{formatCurrency(row.rate_jahres)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center py-10 text-center">
                              <p className="text-sm" style={{ color: tokens.color.textMuted }}>Finanzierungsdaten eingeben</p>
                              <p className="text-xs mt-1" style={{ color: tokens.color.textSubtle }}>Darlehensbetrag und Zinssatz im linken Panel angeben.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SZENARIEN */}
                      {activeTab === "Szenarien" && (
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tokens.color.textMuted }}>Szenario-Vergleich</p>
                            {szenarien.length < 3 && (
                              <button
                                onClick={addSzenario}
                                className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                                style={{ color: tokens.color.accent }}
                              >
                                <Plus size={13} />Szenario hinzufügen
                              </button>
                            )}
                          </div>
                          <div className="flex flex-col gap-3">
                            {szenarioResults.map(({ s, r }) => {
                              const cfColor = r && r.cashflow_monthly >= 0 ? tokens.color.positive : tokens.color.danger;
                              const isBase = s.id === "base";
                              return (
                                <div
                                  key={s.id}
                                  className="rounded-[12px] overflow-hidden"
                                  style={{
                                    border: `1px solid ${isBase ? tokens.color.borderAccent : tokens.color.border}`,
                                  }}
                                >
                                  <div
                                    className="px-4 py-3 flex items-center justify-between"
                                    style={{
                                      background: tokens.color.bgSubtle,
                                      borderBottom: `1px solid ${tokens.color.border}`,
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        value={s.label}
                                        onChange={(e) => updateSzenario(s.id, "label", e.target.value)}
                                        className="text-xs font-semibold bg-transparent border-none outline-none w-28"
                                        style={{ color: tokens.color.text }}
                                      />
                                      {!isBase && (
                                        <button
                                          onClick={() => removeSzenario(s.id)}
                                          className="text-[10px] flex items-center gap-0.5 transition-colors"
                                          style={{ color: tokens.color.danger }}
                                        >
                                          <Trash size={10} />Entfernen
                                        </button>
                                      )}
                                    </div>
                                    {r && (
                                      <span
                                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                          color: cfColor,
                                          background: r.cashflow_monthly >= 0 ? tokens.color.positiveBg : tokens.color.dangerBg,
                                        }}
                                      >
                                        {formatCurrencySigned(r.cashflow_monthly)}/Mo.
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2"
                                    style={{ background: tokens.color.surface }}
                                  >
                                    {[
                                      { label: "Kaufpreis (€)", field: "kaufpreis" as keyof Szenario, val: s.kaufpreis },
                                      { label: "Miete/Mo (€)",  field: "miete_monthly" as keyof Szenario, val: s.miete_monthly },
                                      { label: "Zinssatz (%)",  field: "zinssatz" as keyof Szenario, val: s.zinssatz },
                                      { label: "Tilgung (%)",   field: "tilgung" as keyof Szenario, val: s.tilgung },
                                    ].map(({ label, field, val }) => (
                                      <div key={field}>
                                        <p className="text-[9px] mb-1" style={{ color: tokens.color.textSubtle }}>{label}</p>
                                        <input
                                          type="number"
                                          step={field === "zinssatz" || field === "tilgung" ? 0.1 : 1}
                                          value={val}
                                          readOnly={isBase}
                                          onChange={(e) => updateSzenario(s.id, field, Number(e.target.value))}
                                          className="rounded-[6px] px-2 py-1.5 text-xs w-full focus:outline-none transition-colors"
                                          style={{
                                            background: tokens.color.surfaceHover,
                                            border: `1px solid ${tokens.color.border}`,
                                            color: isBase ? tokens.color.textMuted : tokens.color.text,
                                          }}
                                          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(160,120,48,0.4)")}
                                          onBlur={(e) => (e.currentTarget.style.borderColor = tokens.color.border)}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  {r && (
                                    <div
                                      className="px-4 py-3 grid grid-cols-4 gap-2"
                                      style={{ borderTop: `1px solid ${tokens.color.border}`, background: tokens.color.surface }}
                                    >
                                      {[
                                        { label: "BRUTTO", value: formatPercent(r.gross_yield),             color: getYieldColor(r.gross_yield, 0.05, 0.03) },
                                        { label: "NETTO",  value: formatPercent(r.net_yield),               color: getYieldColor(r.net_yield, 0.04, 0.02) },
                                        { label: "CF/MO.", value: formatCurrencySigned(r.cashflow_monthly), color: cfColor },
                                        { label: "ROE",    value: formatPercent(r.roe),                     color: tokens.color.text },
                                      ].map(({ label, value, color }) => (
                                        <div key={label}>
                                          <p className="text-[9px] mb-0.5" style={{ color: tokens.color.textSubtle }}>{label}</p>
                                          <p className="text-xs font-semibold" style={{ color }}>{value}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {szenarien.length > 1 && (
                            <div
                              className="mt-4 rounded-[12px] overflow-hidden"
                              style={{ border: `1px solid ${tokens.color.border}` }}
                            >
                              <div
                                className="px-4 py-2"
                                style={{ background: tokens.color.bgSubtle, borderBottom: `1px solid ${tokens.color.border}` }}
                              >
                                <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: tokens.color.textSubtle }}>Kennzahlen im Vergleich</p>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs tabular-nums">
                                  <thead>
                                    <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                                      <th className="text-left font-medium px-4 py-2" style={{ color: tokens.color.textSubtle }}>Kennzahl</th>
                                      {szenarien.map((s) => (
                                        <th key={s.id} className="text-right font-semibold px-4 py-2" style={{ color: tokens.color.text }}>{s.label}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[
                                      { label: "Kaufpreis",        field: "kaufpreis",   vals: szenarioResults.map(({ s }) => formatCurrency(s.kaufpreis)) },
                                      { label: "Bruttorendite",    field: "gross_yield", vals: szenarioResults.map(({ r }) => r ? formatPercent(r.gross_yield) : "—") },
                                      { label: "Nettomietrendite", field: "net_yield",   vals: szenarioResults.map(({ r }) => r ? formatPercent(r.net_yield) : "—") },
                                      { label: "Cashflow/Mo.",     field: "cashflow",    vals: szenarioResults.map(({ r }) => r ? formatCurrencySigned(r.cashflow_monthly) : "—") },
                                      { label: "ROE",              field: "roe",         vals: szenarioResults.map(({ r }) => r ? formatPercent(r.roe) : "—") },
                                      { label: "DSCR",             field: "dscr",        vals: szenarioResults.map(({ r }) => r && r.dscr > 0 ? r.dscr.toFixed(2) : "—") },
                                    ].map(({ label, field, vals }) => {
                                      const best = bestIdx(field);
                                      return (
                                        <tr key={label} style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                                          <td className="px-4 py-2.5" style={{ color: tokens.color.textMuted }}>{label}</td>
                                          {vals.map((v, ci) => (
                                            <td
                                              key={ci}
                                              className="text-right px-4 py-2.5 font-medium"
                                              style={{
                                                color: ci === best ? tokens.color.positive : tokens.color.text,
                                                background: ci === best ? tokens.color.positiveBg : "transparent",
                                                fontWeight: ci === best ? 600 : 500,
                                              }}
                                            >{v}</td>
                                          ))}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AFA */}
                      {activeTab === "AfA" && (
                        <div>
                          {!pp || !builtYear ? (
                            <div className="flex flex-col items-center py-10 text-center">
                              <p className="text-sm" style={{ color: tokens.color.textMuted }}>Kaufpreis und Baujahr eingeben</p>
                              <p className="text-xs mt-1" style={{ color: tokens.color.textSubtle }}>um die AfA-Berechnung zu starten.</p>
                            </div>
                          ) : afaResult && (
                            <>
                              <div
                                className="inline-flex items-center gap-2 mb-5 text-xs font-medium px-3 py-1.5 rounded-full"
                                style={{ background: tokens.color.accentMuted, color: tokens.color.accent }}
                              >
                                {AFA_TYPE_LABELS[afaResult.afa_type]}
                              </div>

                              <div className="grid grid-cols-3 gap-3 mb-5">
                                {[
                                  { label: "AfA / JAHR",             value: formatCurrency(afaResult.afa_yearly),             color: tokens.color.text },
                                  { label: "AfA / MONAT",            value: formatCurrency(afaResult.afa_monthly),            color: tokens.color.text },
                                  { label: "STEUERSPARNIS / JAHR",   value: formatCurrency(afaResult.steuerersparnis_yearly), color: tokens.color.positive },
                                ].map(({ label, value, color }) => (
                                  <div
                                    key={label}
                                    className="rounded-[10px] p-3"
                                    style={{ background: tokens.color.bgSubtle, border: `1px solid ${tokens.color.border}` }}
                                  >
                                    <p className="text-[9px] uppercase tracking-wide mb-1.5" style={{ color: tokens.color.textSubtle }}>{label}</p>
                                    <p className="text-lg font-semibold mt-1.5 tabular-nums" style={{ color }}>{value}</p>
                                  </div>
                                ))}
                              </div>

                              <div
                                className="flex flex-col rounded-[12px] overflow-hidden mb-4"
                                style={{ border: `1px solid ${tokens.color.border}` }}
                              >
                                {[
                                  { label: "AfA-Satz",          value: `${(afaResult.afa_rate * 100).toFixed(1)} %` },
                                  { label: "Gebäudewert",       value: formatCurrency(pp * (1 - grundstueckAnteilVal)) },
                                  { label: "Grundstücksanteil", value: `${(grundstueckAnteilVal * 100).toFixed(0)} %` },
                                  { label: "Restlaufzeit",      value: `${afaResult.remaining_years} Jahre` },
                                  { label: "Gesamt-AfA",        value: formatCurrency(afaResult.afa_total_period) },
                                ].map(({ label, value }) => (
                                  <div
                                    key={label}
                                    className="flex justify-between px-4 py-3"
                                    style={{ borderBottom: `1px solid ${tokens.color.border}` }}
                                  >
                                    <span className="text-sm" style={{ color: tokens.color.textMuted }}>{label}</span>
                                    <span className="text-sm font-semibold" style={{ color: tokens.color.text }}>{value}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Steuerersparnis callout */}
                              <div
                                className="rounded-[12px] px-4 py-4 flex items-start gap-3"
                                style={{ background: tokens.color.positiveBg, border: `1px solid rgba(45,106,45,0.15)` }}
                              >
                                <PiggyBank size={18} color={tokens.color.positive} className="mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm" style={{ color: tokens.color.text }}>
                                    Durch AfA reduzierst du dein zu versteuerndes Einkommen um{" "}
                                    <span className="font-semibold">{formatCurrency(afaResult.afa_yearly)}</span> pro Jahr.
                                  </p>
                                  <p className="text-xs mt-1" style={{ color: tokens.color.textMuted }}>
                                    Das entspricht einer Steuerersparnis von{" "}
                                    <span className="font-medium" style={{ color: tokens.color.positive }}>{formatCurrency(afaResult.steuerersparnis_yearly)}/Jahr</span>{" "}
                                    bei {steuerForm.steuersatz || "42"} % Steuersatz.
                                  </p>
                                </div>
                              </div>

                              {/* Spekulationsfrist */}
                              {steuerForm.kaufdatum && spekuResult && (
                                <div
                                  className="mt-4 rounded-[12px] overflow-hidden"
                                  style={{ border: `1px solid ${tokens.color.border}` }}
                                >
                                  <div
                                    className="px-4 py-3 flex items-center justify-between"
                                    style={{ background: tokens.color.bgSubtle, borderBottom: `1px solid ${tokens.color.border}` }}
                                  >
                                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: tokens.color.textMuted }}>Spekulationsfrist</p>
                                    {spekuResult.ist_spekulationsfrei && (
                                      <span
                                        className="text-[10px] font-semibold px-2 py-1 rounded-full"
                                        style={{ color: tokens.color.positive, background: tokens.color.positiveBg }}
                                      >
                                        Steuerfrei
                                      </span>
                                    )}
                                  </div>
                                  <div className="px-4 py-4">
                                    {spekuResult.ist_spekulationsfrei ? (
                                      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.color.positive }}>
                                        <CheckCircle size={16} weight="fill" />
                                        Spekulationsfrei! Verkauf ohne Steuer möglich.
                                      </div>
                                    ) : (
                                      <>
                                        <p className="text-xs" style={{ color: tokens.color.textSubtle }}>Spekulationsfrei ab:</p>
                                        <p className="text-base font-semibold mt-1" style={{ color: tokens.color.text }}>{spekuResult.speku_frei_ab}</p>
                                        <div className="mt-3">
                                          <div
                                            className="rounded-full h-1.5 overflow-hidden"
                                            style={{ background: tokens.color.surfaceActive }}
                                          >
                                            <motion.div
                                              className="h-full rounded-full"
                                              style={{ background: tokens.color.accent }}
                                              initial={{ width: "0%" }}
                                              animate={{ width: `${Math.min(100, ((10 - spekuResult.jahre_verbleibend) / 10) * 100)}%` }}
                                              transition={{ duration: prefersReduced ? 0 : 0.8, ease: "easeOut" }}
                                            />
                                          </div>
                                          <div className="flex justify-between text-[10px] mt-1.5" style={{ color: tokens.color.textSubtle }}>
                                            <span>Kaufdatum</span>
                                            <span>Steuerfrei</span>
                                          </div>
                                        </div>
                                        <p className="mt-3 text-sm font-medium" style={{ color: tokens.color.warning }}>
                                          {spekuResult.tage_verbleibend > 365
                                            ? `${spekuResult.jahre_verbleibend.toFixed(1)} Jahre verbleibend`
                                            : `${spekuResult.tage_verbleibend} Tage verbleibend`}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* FÖRDERUNG */}
                      {activeTab === "Förderung" && (
                        <div>
                          <div className="mb-4">
                            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tokens.color.textMuted }}>KfW-Förderprogramme</p>
                            <p className="text-[10px] mt-0.5" style={{ color: tokens.color.textSubtle }}>Mögliche Förderungen für dieses Objekt</p>
                          </div>

                          <div className="flex flex-col gap-3">
                            {sortedPrograms.map((prog) => (
                              <div
                                key={prog.id}
                                className="rounded-[12px] overflow-hidden"
                                style={{ border: `1px solid ${tokens.color.border}` }}
                              >
                                <div className="px-4 py-3 flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>{prog.name}</p>
                                    <p className="text-[10px] mt-0.5" style={{ color: tokens.color.textSubtle }}>KfW {prog.id}</p>
                                  </div>
                                  <span
                                    className="text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ml-3"
                                    style={prog.applicable ? {
                                      background: tokens.color.positiveBg,
                                      color: tokens.color.positive,
                                    } : {
                                      background: tokens.color.surfaceHover,
                                      color: tokens.color.textSubtle,
                                    }}
                                  >
                                    {prog.applicable ? "Möglich" : "Nicht anwendbar"}
                                  </span>
                                </div>
                                <div className="px-4 pb-4">
                                  <p className="text-xs leading-relaxed" style={{ color: tokens.color.textMuted }}>{prog.beschreibung}</p>
                                  <div
                                    className="mt-2 flex items-center gap-1.5 text-xs"
                                    style={{ color: prog.applicable ? tokens.color.positive : tokens.color.textSubtle, fontWeight: prog.applicable ? 500 : 400 }}
                                  >
                                    <CurrencyEur size={12} />{prog.max_betrag}
                                  </div>
                                  {!prog.applicable && prog.reason && (
                                    <p className="mt-1.5 text-[10px] italic" style={{ color: tokens.color.textSubtle }}>{prog.reason}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div
                            className="mt-4 rounded-[10px] px-4 py-3 flex items-start gap-2"
                            style={{ background: tokens.color.warningBg, border: `1px solid rgba(146,64,14,0.2)` }}
                          >
                            <Warning size={14} color={tokens.color.warning} className="mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] leading-relaxed" style={{ color: tokens.color.textMuted }}>
                                Förderangaben ohne Gewähr. Aktuelle Konditionen und Voraussetzungen bei der KfW Bank prüfen.
                              </p>
                              <a
                                href="https://www.kfw.de"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 block text-[10px] font-medium hover:underline"
                                style={{ color: tokens.color.accent }}
                              >
                                Zur KfW Förderberatung →
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* LTV bar */}
                {activeTab === "Übersicht" && result!.ltv > 0 && (
                  <div
                    className="mt-4 rounded-[14px] px-5 py-4 flex items-center gap-4"
                    style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
                  >
                    <p className="text-xs font-semibold whitespace-nowrap" style={{ color: tokens.color.textMuted }}>LTV</p>
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ background: tokens.color.surfaceActive }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: result!.ltv < 0.6 ? tokens.color.positive : result!.ltv < 0.8 ? tokens.color.warning : tokens.color.danger }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.min(100, result!.ltv * 100)}%` }}
                        transition={{ duration: prefersReduced ? 0 : 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-sm font-semibold whitespace-nowrap" style={{ color: tokens.color.text }}>{formatPercent(result!.ltv, 0)}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </div>
  );
}
