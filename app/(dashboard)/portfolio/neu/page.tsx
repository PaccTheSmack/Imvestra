"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowLeft, ChartLine } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import DarkInput from "@/components/ui/DarkInput";
import DarkSelect from "@/components/ui/DarkSelect";
import DarkButton from "@/components/ui/DarkButton";
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

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
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

  const canProceedStep1 = form.name.trim().length > 0 && form.type !== "";
  const canProceedStep3 = rentMonthly > 0;

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
    <div className="min-h-screen bg-[#080808] p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 max-w-[1000px]">
        <button
          onClick={() => step > 1 ? setStep((step - 1) as Step) : router.push("/portfolio")}
          className="w-9 h-9 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[8px] flex items-center justify-center hover:bg-[#1A1A1A] transition-all cursor-pointer flex-shrink-0"
        >
          <ArrowLeft size={16} color="#666" />
        </button>
        <div>
          <p className="text-[20px] font-semibold text-white">Objekt anlegen</p>
          <p className="text-xs text-[#555] mt-0.5">Schritt {step} von 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-[rgba(255,255,255,0.06)] h-1 rounded-full mb-8 max-w-[1000px]">
        <motion.div
          className="h-full rounded-full bg-[#00E0D7]"
          animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 max-w-[1000px]">
        {/* LEFT – Form card */}
        <div
          className="rounded-[16px] overflow-hidden flex flex-col"
          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
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
                  <p className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-5">Grunddaten</p>

                  {/* Objekttyp */}
                  <div className="mb-5">
                    <label className="block text-[11px] text-[#666] uppercase tracking-wider mb-2">Objekttyp</label>
                    <div className="flex flex-wrap gap-2">
                      {PROPERTY_TYPES.map(t => (
                        <button
                          key={t}
                          onClick={() => setField("type", t)}
                          className="px-4 py-2 rounded-[8px] text-sm cursor-pointer transition-all"
                          style={form.type === t
                            ? { background: "#00E0D7", color: "#080808", fontWeight: 600 }
                            : { background: "#0C0C0C", border: "1px solid rgba(255,255,255,0.08)", color: "#666" }
                          }
                          onMouseEnter={e => { if (form.type !== t) (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                          onMouseLeave={e => { if (form.type !== t) (e.currentTarget as HTMLButtonElement).style.color = "#666"; }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <DarkInput
                        label="Bezeichnung"
                        placeholder="z.B. Altbauwohnung Goslar"
                        required
                        value={form.name}
                        onChange={e => setField("name", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <DarkInput
                        label="Straße & Hausnummer"
                        placeholder="Rosentorstraße 12"
                        value={form.address}
                        onChange={e => setField("address", e.target.value)}
                      />
                    </div>
                    <DarkInput
                      label="PLZ"
                      placeholder="38640"
                      maxLength={5}
                      value={form.plz}
                      onChange={e => setField("plz", e.target.value)}
                    />
                    <DarkInput
                      label="Ort"
                      placeholder="wird automatisch erkannt"
                      value={form.city}
                      readOnly
                      className="bg-[#0C0C0C] cursor-not-allowed"
                    />
                    <DarkInput
                      label="Baujahr"
                      placeholder="1968"
                      type="number"
                      value={form.build_year}
                      onChange={e => setField("build_year", e.target.value)}
                    />
                    <DarkInput
                      label="Wohnfläche (m²)"
                      placeholder="68"
                      type="number"
                      value={form.sqm}
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
                      label="Kaufpreis (€)"
                      placeholder="185000"
                      type="number"
                      value={form.kaufpreis}
                      onChange={e => setField("kaufpreis", e.target.value)}
                    />
                    <DarkInput
                      label="Kaufdatum"
                      type="date"
                      value={form.kaufdatum}
                      onChange={e => setField("kaufdatum", e.target.value)}
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
                  <p className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-5">Technische Details</p>

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
                            ? { background: "rgba(0,224,215,0.04)", border: "1px solid rgba(0,224,215,0.25)" }
                            : { background: "#0C0C0C", border: "1px solid rgba(255,255,255,0.08)" }
                          }
                        >
                          <div
                            className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                            style={checked
                              ? { background: "#00E0D7", borderColor: "#00E0D7" }
                              : { background: "transparent", borderColor: "rgba(255,255,255,0.2)" }
                            }
                          >
                            {checked && <div className="w-1.5 h-1.5 rounded-full bg-[#080808]" />}
                          </div>
                          <span className="text-sm text-white">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Notes textarea */}
                  <div className="mt-5 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#888888] uppercase tracking-wide">Notizen</label>
                    <textarea
                      placeholder="Interne Anmerkungen..."
                      value={form.notes}
                      onChange={e => setField("notes", e.target.value)}
                      style={{ minHeight: 80 }}
                      className="w-full bg-[#141414] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-3 py-2.5 text-sm text-white placeholder:text-[#777777] focus:outline-none focus:border-[rgba(0,224,215,0.4)] focus:bg-[#1A1A1A] transition-all duration-150 resize-none"
                    />
                  </div>
                </>
              )}

              {/* ─── STEP 3 ─── */}
              {step === 3 && (
                <>
                  <p className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-5">Mieteinnahmen & Finanzierung</p>

                  <div className="grid grid-cols-2 gap-4">
                    <DarkInput
                      label="Kaltmiete / Monat (€)"
                      placeholder="850"
                      type="number"
                      required
                      value={form.rent_monthly}
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
                        ? { background: "#0C0C0C", border: "1px solid rgba(0,224,215,0.2)" }
                        : { background: "#0C0C0C", border: "1px solid rgba(255,255,255,0.08)" }
                      }
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">Finanzierung hinterlegen</p>
                        <p className="text-xs text-[#555] mt-0.5">Optional – für Zinsanalyse und DSCR</p>
                      </div>
                      <div
                        className="w-10 h-6 rounded-full flex items-center px-1 transition-all flex-shrink-0 ml-4"
                        style={{ background: form.has_financing ? "#00E0D7" : "rgba(255,255,255,0.1)" }}
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
                            <DarkInput
                              label="Zinsbindung bis"
                              type="date"
                              value={form.fixed_until}
                              onChange={e => setField("fixed_until", e.target.value)}
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
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0C0C0C" }}
          >
            <button
              onClick={() => router.push("/portfolio")}
              className="text-sm text-[#555] hover:text-white transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <div className="flex gap-3">
              {step < 3 ? (
                <DarkButton
                  variant="primary"
                  disabled={step === 1 ? !canProceedStep1 : false}
                  onClick={() => setStep((step + 1) as Step)}
                >
                  Weiter →
                </DarkButton>
              ) : (
                <DarkButton
                  variant="primary"
                  loading={saving}
                  disabled={!canProceedStep3}
                  onClick={saveProperty}
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
            style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="px-5 py-4"
              style={{ background: "#0C0C0C", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-[10px] text-[#555] uppercase tracking-widest">Vorschau</p>
            </div>
            <div className="px-5 py-4">
              {form.type && (
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 bg-[rgba(0,224,215,0.1)] text-[#00E0D7]">
                  {form.type}
                </span>
              )}
              <p className="text-sm font-semibold text-white">
                {form.name || "Objektname"}
              </p>
              {(form.address || form.city) && (
                <p className="text-xs text-[#555] mt-0.5">
                  {[form.address, [form.plz, form.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                </p>
              )}
              {(form.build_year || form.sqm) && (
                <p className="text-xs text-[#555] mt-0.5">
                  {[
                    form.build_year ? `Baujahr ${form.build_year}` : "",
                    form.sqm ? `${form.sqm} m²` : "",
                  ].filter(Boolean).join(" · ")}
                </p>
              )}

              {rentMonthly > 0 && kaufpreis > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "KAUFPREIS",     value: formatCurrency(kaufpreis),              color: "#fff" },
                    { label: "BRUTTORENDITE", value: formatPercent(bruttorendite),            color: "#00E0D7" },
                    { label: "CF/MONAT",      value: formatCurrencySigned(cashflowMonthly),   color: cashflowMonthly >= 0 ? "#00E0D7" : "#FF4444" },
                    { label: "GESAMTINVEST.", value: formatCurrency(totalInvestment),         color: "#fff" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-[8px] px-3 py-2" style={{ background: "#0C0C0C" }}>
                      <p className="text-[9px] text-[#444]">{label}</p>
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
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="px-5 py-3 flex items-center gap-2"
                style={{ background: "#0C0C0C", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <ChartLine size={13} color="#00E0D7" />
                <p className="text-[10px] text-[#555] uppercase tracking-widest">Wertermittlung</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[10px] text-[#555] mb-1">Geschätzter Marktwert</p>
                <p className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                  {formatCurrency(wert.geschaetzter_marktwert)}
                </p>

                {form.kaufdatum && wert.wertentwicklung_eur !== 0 && (
                  <>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-[#555]">Seit Kauf</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: wert.wertentwicklung_eur >= 0 ? "#00E0D7" : "#FF4444" }}
                        >
                          {formatCurrencySigned(wert.wertentwicklung_eur)}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: wert.wertentwicklung_eur >= 0 ? "#00E0D7" : "#FF4444" }}
                        >
                          ({formatPercent(wert.wertentwicklung_pct)})
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                      <span className="text-[#555]">Jährl. Steigerung</span>
                      <span style={{ color: "#888" }}>{formatPercent(wert.wertentwicklung_pa)}</span>
                    </div>
                  </>
                )}

                <div
                  className="mt-3 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <span
                    className="text-[10px] flex items-center gap-1.5"
                    style={{
                      color: wert.vertrauen === "hoch"   ? "#00E0D7"
                           : wert.vertrauen === "mittel" ? "#FFB800"
                           : "#FF4444",
                    }}
                  >
                    {"● "}
                    {wert.vertrauen === "hoch"   ? "Hohe Datenqualität"
                     : wert.vertrauen === "mittel" ? "Mittlere Datenqualität"
                     : "Begrenzte Datenqualität"}
                  </span>
                  <p className="mt-2 text-[10px] text-[#333] leading-relaxed">{wert.hinweis}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
