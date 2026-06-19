"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowLeft, ChartLine } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import DarkInput from "@/components/ui/DarkInput";
import DarkSelect from "@/components/ui/DarkSelect";
import DarkButton from "@/components/ui/DarkButton";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { getStadtData } from "@/lib/standort-data";
import { calculateWertermittlung } from "@/lib/wertermittlung";
import { formatCurrency, formatPercent, formatCurrencySigned } from "@/lib/format";

const PROPERTY_TYPES = ["ETW", "MFH", "EFH", "DHH", "Gewerbe", "Sonstige"];

type Step = 1 | 2 | 3;

interface FormState {
  name: string;
  type: string;
  address: string;
  plz: string;
  city: string;
  build_year: string;
  sqm: string;
  units: string;
  kaufpreis: string;
  kaufdatum: string;
  ancillary_costs_pct: string;
  heizungsart: string;
  energieklasse: string;
  denkmalschutz: boolean;
  aufzug: boolean;
  keller: boolean;
  parkplaetze: string;
  lage: string;
  notes: string;
  rent_monthly: string;
  hausgeld_monthly: string;
  has_financing: boolean;
  bank: string;
  loan_amount: string;
  interest_rate: string;
  repayment_rate: string;
  monthly_rate: string;
  fixed_until: string;
}

const INITIAL_FORM: FormState = {
  name: "", type: "", address: "", plz: "", city: "",
  build_year: "", sqm: "", units: "1", kaufpreis: "", kaufdatum: "",
  ancillary_costs_pct: "10",
  heizungsart: "", energieklasse: "",
  denkmalschutz: false, aufzug: false, keller: false,
  parkplaetze: "0", lage: "", notes: "",
  rent_monthly: "", hausgeld_monthly: "0",
  has_financing: false, bank: "", loan_amount: "",
  interest_rate: "", repayment_rate: "", monthly_rate: "", fixed_until: "",
};

export default function NeuesObjektPage() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key as string]) setErrors(e => { const n = { ...e }; delete n[key as string]; return n; });
  }

  function validateStep(s: Step): boolean {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.name.trim())             e.name      = "Pflichtfeld";
      if (!form.type)                    e.type      = "Bitte wählen";
      if (!form.kaufpreis)               e.kaufpreis = "Pflichtfeld";
      if (!form.sqm)                     e.sqm       = "Pflichtfeld";
      if (!form.address.trim())          e.address   = "Pflichtfeld";
      if (!form.plz || form.plz.length !== 5) e.plz = "5-stellige PLZ erforderlich";
    }
    if (s === 3) {
      if (!form.rent_monthly || parseFloat(form.rent_monthly) <= 0) e.rent_monthly = "Pflichtfeld";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      if (!prefersReduced) {
        formRef.current?.classList.remove("shake");
        void formRef.current?.offsetWidth;
        formRef.current?.classList.add("shake");
      }
      setTimeout(() => {
        formRef.current?.querySelector<HTMLElement>(".error-field")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return false;
    }
    return true;
  }

  useEffect(() => {
    if (form.plz.length === 5) {
      const { plzInfo } = getStadtData(form.plz);
      if (plzInfo) setField("city", plzInfo.city);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.plz]);

  const kaufpreis = parseFloat(form.kaufpreis) || 0;
  const rentMonthly = parseFloat(form.rent_monthly) || 0;
  const sqm = parseFloat(form.sqm) || 0;
  const hausgeld = parseFloat(form.hausgeld_monthly) || 0;
  const monthlyRate = parseFloat(form.monthly_rate) || 0;
  const nkPct = parseFloat(form.ancillary_costs_pct) || 10;

  const bruttorendite = kaufpreis > 0 && rentMonthly > 0 ? (rentMonthly * 12) / kaufpreis : 0;
  const cashflowMonthly = rentMonthly - (form.has_financing ? monthlyRate : 0) - hausgeld;
  const totalInvestment = kaufpreis * (1 + nkPct / 100);

  const showWertermittlung = kaufpreis > 0 && rentMonthly > 0 && form.plz.length === 5;
  const wert = showWertermittlung
    ? calculateWertermittlung(kaufpreis, rentMonthly, sqm, form.plz, form.kaufdatum || undefined)
    : null;


  async function saveProperty() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const addressFull = [form.address, form.plz && form.city ? `${form.plz} ${form.city}` : form.city]
      .filter(Boolean).join(", ");

    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        user_id: user.id,
        name: form.name,
        type: form.type || null,
        address: addressFull || null,
        build_year: parseInt(form.build_year) || null,
        sqm: sqm || null,
        units: parseInt(form.units) || 1,
        purchase_price: kaufpreis || null,
        kaufdatum: form.kaufdatum || null,
        ancillary_costs_pct: nkPct / 100,
        rent_monthly: rentMonthly || null,
        hausgeld_monthly: hausgeld,
        heizungsart: form.heizungsart || null,
        energieklasse: form.energieklasse || null,
        denkmalschutz: form.denkmalschutz,
        aufzug: form.aufzug,
        keller: form.keller,
        parkplaetze: parseInt(form.parkplaetze) || 0,
        notes: form.notes || null,
        market_value_estimated: wert?.geschaetzter_marktwert ?? null,
        market_value_updated_at: wert ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error || !property) {
      console.error("Property save error:", error);
      alert("Fehler beim Speichern: " + (error?.message ?? "Unbekannter Fehler"));
      setSaving(false);
      return;
    }

    if (form.has_financing && form.loan_amount) {
      const loanAmount = parseFloat(form.loan_amount);
      const interestRate = parseFloat(form.interest_rate) / 100;
      const repaymentRate = parseFloat(form.repayment_rate) / 100;
      const rate = monthlyRate || (loanAmount * (interestRate + repaymentRate) / 12);

      await supabase.from("financings").insert({
        property_id: property.id,
        bank: form.bank || null,
        loan_amount: loanAmount,
        interest_rate: interestRate,
        repayment_rate: repaymentRate,
        rate_monthly: rate,
        fixed_until: form.fixed_until || null,
      });
    }

    router.push("/portfolio?new=" + property.id);
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "#F8F7F4" }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 w-full">
        <button
          onClick={() => step > 1 ? setStep((step - 1) as Step) : router.push("/portfolio")}
          className="w-9 h-9 bg-white border border-[rgba(16,20,24,0.08)] rounded-[8px] flex items-center justify-center hover:bg-[#1A1A1A] transition-all cursor-pointer flex-shrink-0"
        >
          <ArrowLeft size={16} color="#6A5A3A" />
        </button>
        <div>
          <p className="text-[20px] font-semibold text-[#101418]">Objekt anlegen</p>
          <p className="text-xs text-[#A89A7A] mt-0.5">Schritt {step} von 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full mb-8 w-full" style={{ background: "rgba(16,20,24,0.08)" }}>
        <motion.div
          className="h-full rounded-full bg-[#A07830]"
          animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 w-full">
        {/* LEFT – Form card */}
        <div
          ref={formRef}
          className="rounded-[16px] overflow-hidden flex flex-col"
          style={{ background: "#FFFFFF", border: "1px solid rgba(16,20,24,0.08)" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={prefersReduced ? {} : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="p-6 flex-1"
            >
              {/* ─── STEP 1 ─── */}
              {step === 1 && (
                <>
                  <p className="text-xs font-semibold text-[#A89A7A] uppercase tracking-widest mb-5">Grunddaten</p>

                  {/* Objekttyp */}
                  <div className="mb-5">
                    <label className="block text-[11px] text-[#6A5A3A] uppercase tracking-wider mb-2">
                      Objekttyp <span className="text-[#FF4444] ml-0.5">*</span>
                    </label>
                    <div
                      className="flex flex-wrap gap-2 p-1 rounded-[10px] -m-1"
                      style={errors.type ? { outline: "1px solid rgba(255,68,68,0.35)", outlineOffset: "2px" } : {}}
                    >
                      {PROPERTY_TYPES.map(t => (
                        <button
                          key={t}
                          onClick={() => { setField("type", t); }}
                          className="px-4 py-2 rounded-[8px] text-sm cursor-pointer transition-all"
                          style={form.type === t
                            ? { background: "#A07830", color: "#FFFFFF", fontWeight: 600 }
                            : { background: "#F0EDE4", border: "1px solid rgba(16,20,24,0.08)", color: "#6A5A3A" }
                          }
                          onMouseEnter={e => { if (form.type !== t) (e.currentTarget as HTMLButtonElement).style.color = "#101418"; }}
                          onMouseLeave={e => { if (form.type !== t) (e.currentTarget as HTMLButtonElement).style.color = "#6A5A3A"; }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {errors.type && <p className="text-xs text-[#B91C1C] mt-1">{errors.type}</p>}
                  </div>

                  <p className="text-[10px] text-[#A89A7A] mb-4">
                    <span className="text-[#B91C1C]">*</span> Pflichtfelder · Alle anderen Felder sind optional
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <DarkInput
                        label={<>Bezeichnung <span className="text-[#B91C1C] ml-0.5">*</span></>}
                        placeholder="z.B. Altbauwohnung Goslar"
                        value={form.name}
                        error={errors.name}
                        className={errors.name ? "error-field" : ""}
                        onChange={e => setField("name", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <DarkInput
                        label={<>Straße & Hausnummer <span className="text-[#B91C1C] ml-0.5">*</span></>}
                        placeholder="Rosentorstraße 12"
                        value={form.address}
                        error={errors.address}
                        className={errors.address ? "error-field" : ""}
                        onChange={e => setField("address", e.target.value)}
                      />
                    </div>
                    <DarkInput
                      label={<>PLZ <span className="text-[#B91C1C] ml-0.5">*</span></>}
                      placeholder="38640"
                      maxLength={5}
                      value={form.plz}
                      error={errors.plz}
                      className={errors.plz ? "error-field" : ""}
                      onChange={e => setField("plz", e.target.value)}
                    />
                    <DarkInput
                      label="Ort"
                      placeholder="wird automatisch erkannt"
                      value={form.city}
                      readOnly
                      className="bg-[#F0EDE4] cursor-not-allowed"
                    />
                    <DarkInput
                      label="Baujahr"
                      placeholder="1968"
                      type="number"
                      value={form.build_year}
                      onChange={e => setField("build_year", e.target.value)}
                    />
                    <DarkInput
                      label={<>Wohnfläche (m²) <span className="text-[#B91C1C] ml-0.5">*</span></>}
                      placeholder="68"
                      type="number"
                      value={form.sqm}
                      error={errors.sqm}
                      className={errors.sqm ? "error-field" : ""}
                      onChange={e => setField("sqm", e.target.value)}
                    />
                    <DarkInput
                      label="Einheiten (WE)"
                      placeholder="1"
                      type="number"
                      value={form.units}
                      onChange={e => setField("units", e.target.value)}
                    />
                    <DarkInput
                      label={<>Kaufpreis (€) <span className="text-[#B91C1C] ml-0.5">*</span></>}
                      placeholder="185000"
                      type="number"
                      value={form.kaufpreis}
                      error={errors.kaufpreis}
                      className={errors.kaufpreis ? "error-field" : ""}
                      onChange={e => setField("kaufpreis", e.target.value)}
                    />
                    <MonthYearPicker
                      label="Kaufdatum"
                      value={form.kaufdatum}
                      onChange={v => setField("kaufdatum", v)}
                    />
                    <DarkInput
                      label="Nebenkosten (%)"
                      placeholder="10"
                      type="number"
                      hint="Grunderwerbsteuer, Notar, Makler"
                      value={form.ancillary_costs_pct}
                      onChange={e => setField("ancillary_costs_pct", e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* ─── STEP 2 ─── */}
              {step === 2 && (
                <>
                  <p className="text-xs font-semibold text-[#A89A7A] uppercase tracking-widest mb-5">Technische Details</p>

                  <div className="grid grid-cols-2 gap-4">
                    <DarkSelect
                      label="Heizungsart"
                      value={form.heizungsart}
                      onChange={e => setField("heizungsart", e.target.value)}
                      options={[
                        { value: "", label: "Bitte wählen" },
                        { value: "gas", label: "Gasheizung" },
                        { value: "oel", label: "Ölheizung" },
                        { value: "waermepumpe", label: "Wärmepumpe" },
                        { value: "fernwaerme", label: "Fernwärme" },
                        { value: "pellets", label: "Pelletheizung" },
                        { value: "elektro", label: "Elektroheizung" },
                        { value: "solar", label: "Solar/Hybrid" },
                        { value: "sonstige", label: "Sonstige" },
                      ]}
                    />
                    <DarkSelect
                      label="Energieeffizienzklasse"
                      value={form.energieklasse}
                      onChange={e => setField("energieklasse", e.target.value)}
                      options={[
                        { value: "", label: "Bitte wählen" },
                        ...["A+", "A", "B", "C", "D", "E", "F", "G", "H"].map(v => ({ value: v, label: v })),
                      ]}
                    />
                    <DarkInput
                      label="Parkplätze"
                      type="number"
                      placeholder="0"
                      value={form.parkplaetze}
                      onChange={e => setField("parkplaetze", e.target.value)}
                    />
                    <DarkInput
                      label="Stockwerk / Lage"
                      placeholder="2. OG rechts"
                      value={form.lage}
                      onChange={e => setField("lage", e.target.value)}
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    {(
                      [
                        { key: "denkmalschutz" as const, label: "Denkmalschutz" },
                        { key: "aufzug" as const, label: "Aufzug vorhanden" },
                        { key: "keller" as const, label: "Keller vorhanden" },
                      ]
                    ).map(({ key, label }) => {
                      const checked = form[key] as boolean;
                      return (
                        <button
                          key={key}
                          onClick={() => setField(key, !checked)}
                          className="flex items-center gap-3 px-4 py-3 rounded-[10px] cursor-pointer transition-all text-left"
                          style={checked
                            ? { background: "rgba(160,120,48,0.06)", border: "1px solid rgba(160,120,48,0.25)" }
                            : { background: "#F0EDE4", border: "1px solid rgba(16,20,24,0.08)" }
                          }
                        >
                          <div
                            className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                            style={checked
                              ? { background: "#A07830", borderColor: "#A07830" }
                              : { background: "transparent", borderColor: "rgba(16,20,24,0.2)" }
                            }
                          >
                            {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm text-[#101418]">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Notes textarea */}
                  <div className="mt-5 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#6A5A3A] uppercase tracking-wide">Notizen</label>
                    <textarea
                      placeholder="Interne Anmerkungen..."
                      value={form.notes}
                      onChange={e => setField("notes", e.target.value)}
                      style={{ minHeight: 80 }}
                      className="w-full bg-white border border-[rgba(16,20,24,0.1)] rounded-[8px] px-3 py-2.5 text-sm text-[#101418] placeholder:text-[#A89A7A] focus:outline-none focus:ring-2 focus:ring-[rgba(160,120,48,0.2)] focus:border-[rgba(160,120,48,0.3)] transition-all duration-150 resize-none"
                    />
                  </div>
                </>
              )}

              {/* ─── STEP 3 ─── */}
              {step === 3 && (
                <>
                  <p className="text-xs font-semibold text-[#A89A7A] uppercase tracking-widest mb-5">Mieteinnahmen & Finanzierung</p>

                  <p className="text-[10px] text-[#A89A7A] mb-4">
                    <span className="text-[#B91C1C]">*</span> Pflichtfelder · Alle anderen Felder sind optional
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <DarkInput
                      label={<>Kaltmiete / Monat (€) <span className="text-[#B91C1C] ml-0.5">*</span></>}
                      placeholder="850"
                      type="number"
                      value={form.rent_monthly}
                      error={errors.rent_monthly}
                      className={errors.rent_monthly ? "error-field" : ""}
                      onChange={e => setField("rent_monthly", e.target.value)}
                    />
                    <DarkInput
                      label="Hausgeld / Monat (€)"
                      placeholder="180"
                      type="number"
                      hint="ETW: monatliches Hausgeld"
                      value={form.hausgeld_monthly}
                      onChange={e => setField("hausgeld_monthly", e.target.value)}
                    />
                  </div>

                  {/* Financing toggle */}
                  <div className="mt-5">
                    <button
                      onClick={() => setField("has_financing", !form.has_financing)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-[10px] cursor-pointer transition-all"
                      style={form.has_financing
                        ? { background: "#F0EDE4", border: "1px solid rgba(160,120,48,0.2)" }
                        : { background: "#F0EDE4", border: "1px solid rgba(16,20,24,0.08)" }
                      }
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#101418]">Finanzierung hinterlegen</p>
                        <p className="text-xs text-[#A89A7A] mt-0.5">Optional – für Zinsanalyse und DSCR</p>
                      </div>
                      <div
                        className="w-10 h-6 rounded-full flex items-center px-1 transition-all flex-shrink-0 ml-4"
                        style={{ background: form.has_financing ? "#A07830" : "rgba(16,20,24,0.1)" }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full shadow"
                          animate={{ x: form.has_financing ? 16 : 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    </button>
                  </div>

                  <AnimatePresence>
                    {form.has_financing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="col-span-2">
                            <DarkInput
                              label="Bank"
                              placeholder="Volksbank Goslar"
                              value={form.bank}
                              onChange={e => setField("bank", e.target.value)}
                            />
                          </div>
                          <DarkInput
                            label="Darlehensbetrag (€)"
                            type="number"
                            value={form.loan_amount}
                            onChange={e => setField("loan_amount", e.target.value)}
                          />
                          <DarkInput
                            label="Zinssatz (%)"
                            type="number"
                            placeholder="3.5"
                            value={form.interest_rate}
                            onChange={e => setField("interest_rate", e.target.value)}
                          />
                          <DarkInput
                            label="Tilgung (%)"
                            type="number"
                            placeholder="2.0"
                            value={form.repayment_rate}
                            onChange={e => setField("repayment_rate", e.target.value)}
                          />
                          <DarkInput
                            label="Rate / Monat (€)"
                            type="number"
                            hint="Wird auto-berechnet wenn leer"
                            value={form.monthly_rate}
                            onChange={e => setField("monthly_rate", e.target.value)}
                          />
                          <div className="col-span-2">
                            <MonthYearPicker
                              label="Zinsbindung bis"
                              value={form.fixed_until}
                              onChange={v => setField("fixed_until", v)}
                              minYear={new Date().getFullYear()}
                              maxYear={new Date().getFullYear() + 30}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action bar */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(16,20,24,0.06)", background: "#F8F7F4" }}
          >
            <button
              onClick={() => router.push("/portfolio")}
              className="text-sm text-[#A89A7A] hover:text-[#101418] transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <div className="flex gap-3">
              {step < 3 ? (
                <DarkButton
                  variant="primary"
                  onClick={() => { if (step === 1 && !validateStep(1)) return; setStep((step + 1) as Step); }}
                >
                  Weiter →
                </DarkButton>
              ) : (
                <DarkButton
                  variant="primary"
                  loading={saving}
                  onClick={() => { if (!validateStep(3)) return; saveProperty(); }}
                >
                  Objekt speichern
                </DarkButton>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT – Live preview */}
        <div className="sticky top-8 self-start space-y-4">
          {/* Preview card */}
          <div
            className="rounded-[14px] overflow-hidden"
            style={{ background: "#FFFFFF", border: "1px solid rgba(16,20,24,0.08)" }}
          >
            <div
              className="px-5 py-4"
              style={{ background: "#F0EDE4", borderBottom: "1px solid rgba(16,20,24,0.06)" }}
            >
              <p className="text-[10px] text-[#A89A7A] uppercase tracking-widest">Vorschau</p>
            </div>
            <div className="px-5 py-4">
              {form.type && (
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 bg-[rgba(160,120,48,0.1)] text-[#A07830]">
                  {form.type}
                </span>
              )}
              <p className="text-sm font-semibold text-[#101418]">
                {form.name || "Objektname"}
              </p>
              {(form.address || form.city) && (
                <p className="text-xs text-[#A89A7A] mt-0.5">
                  {[form.address, [form.plz, form.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                </p>
              )}
              {(form.build_year || form.sqm) && (
                <p className="text-xs text-[#A89A7A] mt-0.5">
                  {[
                    form.build_year ? `Baujahr ${form.build_year}` : "",
                    form.sqm ? `${form.sqm} m²` : "",
                  ].filter(Boolean).join(" · ")}
                </p>
              )}

              {rentMonthly > 0 && kaufpreis > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "KAUFPREIS",     value: formatCurrency(kaufpreis),              color: "#101418" },
                    { label: "BRUTTORENDITE", value: formatPercent(bruttorendite),            color: "#A07830" },
                    { label: "CF/MONAT",      value: formatCurrencySigned(cashflowMonthly),   color: cashflowMonthly >= 0 ? "#2D6A2D" : "#B91C1C" },
                    { label: "GESAMTINVEST.", value: formatCurrency(totalInvestment),         color: "#101418" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-[8px] px-3 py-2" style={{ background: "#F0EDE4" }}>
                      <p className="text-[9px] text-[#A89A7A]">{label}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Wertermittlung card */}
          {wert && (
            <div
              className="rounded-[14px] overflow-hidden"
              style={{ background: "#FFFFFF", border: "1px solid rgba(16,20,24,0.08)" }}
            >
              <div
                className="px-5 py-3 flex items-center gap-2"
                style={{ background: "#F0EDE4", borderBottom: "1px solid rgba(16,20,24,0.06)" }}
              >
                <ChartLine size={13} color="#A07830" />
                <p className="text-[10px] text-[#A89A7A] uppercase tracking-widest">Wertermittlung</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[10px] text-[#A89A7A] mb-1">Geschätzter Marktwert</p>
                <p className="text-[22px] font-semibold text-[#101418] tracking-[-0.02em]">
                  {formatCurrency(wert.geschaetzter_marktwert)}
                </p>

                {form.kaufdatum && wert.wertentwicklung_eur !== 0 && (
                  <>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-[#A89A7A]">Seit Kauf</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: wert.wertentwicklung_eur >= 0 ? "#2D6A2D" : "#B91C1C" }}
                        >
                          {formatCurrencySigned(wert.wertentwicklung_eur)}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: wert.wertentwicklung_eur >= 0 ? "#2D6A2D" : "#B91C1C" }}
                        >
                          ({formatPercent(wert.wertentwicklung_pct)})
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                      <span className="text-[#A89A7A]">Jährl. Steigerung</span>
                      <span style={{ color: "#A89A7A" }}>{formatPercent(wert.wertentwicklung_pa)}</span>
                    </div>
                  </>
                )}

                <div
                  className="mt-3 pt-3"
                  style={{ borderTop: "1px solid rgba(16,20,24,0.06)" }}
                >
                  <span
                    className="text-[10px] flex items-center gap-1.5"
                    style={{
                      color: wert.vertrauen === "hoch"   ? "#2D6A2D"
                           : wert.vertrauen === "mittel" ? "#92400E"
                           : "#B91C1C",
                    }}
                  >
                    {"● "}
                    {wert.vertrauen === "hoch"   ? "Hohe Datenqualität"
                     : wert.vertrauen === "mittel" ? "Mittlere Datenqualität"
                     : "Begrenzte Datenqualität"}
                  </span>
                  <p className="mt-2 text-[10px] text-[#A89A7A] leading-relaxed">{wert.hinweis}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
