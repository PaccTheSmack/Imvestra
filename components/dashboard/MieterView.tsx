"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  UsersFour,
  X,
  DotsThree,
  Warning,
  FileText,
  Globe,
  CheckCircle,
  Copy,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import DarkButton from "@/components/ui/DarkButton";
import DarkInput from "@/components/ui/DarkInput";
import DarkSelect from "@/components/ui/DarkSelect";
import type { Tenant, RentPayment } from "@/types";

type TenantWithPayments = Tenant & { rent_payments: RentPayment[] };

interface MieterViewProps {
  tenants: TenantWithPayments[];
  properties: { id: string; name: string; type: string }[];
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " €";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function firstOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  paid:    { bg: "rgba(45,106,45,0.1)",   text: "#2D6A2D",  label: "Bezahlt"     },
  pending: { bg: "rgba(146,64,14,0.1)",   text: "#92400E",  label: "Ausstehend"  },
  late:    { bg: "rgba(185,28,28,0.1)",   text: "#B91C1C",  label: "Uberfällig"  },
  partial: { bg: "rgba(146,64,14,0.1)",   text: "#92400E",  label: "Teilzahlung" },
};

export default function MieterView({ tenants, properties }: MieterViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReduced = useReducedMotion();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"mieter" | "zahlungen">("mieter");
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithPayments | null>(null);
  const [saving, setSaving] = useState(false);

  // Portal invite state
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [portalTenant, setPortalTenant] = useState<TenantWithPayments | null>(null);
  const [portalStatus, setPortalStatus] = useState<Record<string, { active: boolean; email?: string; activationUrl?: string }>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [portalToast, setPortalToast] = useState<string | null>(null);

  useEffect(() => {
    if (!portalToast) return;
    const t = setTimeout(() => setPortalToast(null), 3000);
    return () => clearTimeout(t);
  }, [portalToast]);

  // Filter by property_id from URL param
  useEffect(() => {
    const propertyId = searchParams.get("property_id");
    if (propertyId) {
      setSelectedPropertyId(propertyId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tenant form state
  const [tenantForm, setTenantForm] = useState({
    property_id: properties[0]?.id ?? "",
    name: "",
    unit_number: "",
    email: "",
    phone: "",
    move_in_date: "",
    rent_monthly: "",
    deposit: "",
    notes: "",
    nk_vorauszahlung: 0,
    wohnflaeche: null as number | null,
    einwohnerzahl: 1,
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    due_date: firstOfMonth(),
    paid_date: "",
    status: "paid",
    notes: "",
  });

  const filtered = selectedPropertyId === "all"
    ? tenants
    : tenants.filter((t) => t.property_id === selectedPropertyId);

  // Summary stats
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const activeTenantsCount = filtered.filter((t) => t.is_active).length;
  const totalRentExpected = filtered.filter((t) => t.is_active).reduce((s, t) => s + t.rent_monthly, 0);

  const allPayments = filtered.flatMap((t) => t.rent_payments.map((p) => ({ ...p, tenantName: t.name })));
  const thisMonthPayments = allPayments.filter((p) => p.due_date.startsWith(thisMonth));
  const paidAmt = thisMonthPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingAmt = thisMonthPayments.filter((p) => p.status === "pending" || p.status === "late").reduce((s, p) => s + p.amount, 0);

  const allPaymentsSorted = [...allPayments].sort(
    (a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  );

  const propertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? "-";

  function openPortalModal(tenant: TenantWithPayments) {
    setPortalTenant(tenant);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setInviteEmail((tenant as any).email ?? "");
    setInviteSuccess(false);
    setShowPortalModal(true);
  }

  async function sendInvite() {
    if (!portalTenant || !inviteEmail) return;
    setInviteLoading(true);
    const res = await fetch("/api/mieter/einladen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: portalTenant.id, email: inviteEmail, name: portalTenant.name }),
    });
    const data = await res.json();
    setInviteLoading(false);
    if (res.ok) {
      setInviteSuccess(true);
      setPortalStatus(prev => ({
        ...prev,
        [portalTenant.id]: { active: false, email: inviteEmail, activationUrl: data.activationUrl ?? data.activation_url ?? "" },
      }));
      setPortalToast("Einladung gesendet");
    } else {
      setPortalToast("Fehler beim Senden");
    }
  }

  async function saveTenant() {
    if (!tenantForm.property_id) {
      alert("Bitte ein Objekt auswählen");
      return;
    }
    if (!tenantForm.name.trim()) {
      alert("Bitte einen Namen eingeben");
      return;
    }
    if (!tenantForm.move_in_date) {
      alert("Bitte ein Einzugsdatum eingeben");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      setSaving(false);
      return;
    }

    const rent = parseFloat(tenantForm.rent_monthly) || 0;

    const { data: newTenant, error } = await supabase.from("tenants").insert({
      property_id: tenantForm.property_id,
      user_id: user.id,
      name: tenantForm.name,
      unit_number: tenantForm.unit_number || null,
      email: tenantForm.email || null,
      phone: tenantForm.phone || null,
      move_in_date: tenantForm.move_in_date,
      rent_monthly: rent,
      deposit: parseFloat(tenantForm.deposit) || 0,
      notes: tenantForm.notes || null,
      is_active: true,
      nk_vorauszahlung: tenantForm.nk_vorauszahlung || 0,
      wohnflaeche: tenantForm.wohnflaeche ?? null,
      einwohnerzahl: tenantForm.einwohnerzahl || 1,
    }).select().single();

    if (error) {
      console.error("Tenant save error:", error);
      alert("Fehler beim Speichern: " + error.message);
      setSaving(false);
      return;
    }

    if (newTenant) {
      await supabase.from("rent_payments").insert({
        tenant_id: newTenant.id,
        property_id: tenantForm.property_id,
        user_id: user.id,
        amount: rent,
        due_date: firstOfMonth(),
        status: "pending",
      });
    }

    setSaving(false);
    setShowAddTenant(false);
    setTenantForm({ property_id: properties[0]?.id ?? "", name: "", unit_number: "", email: "", phone: "", move_in_date: "", rent_monthly: "", deposit: "", notes: "", nk_vorauszahlung: 0, wohnflaeche: null, einwohnerzahl: 1 });
    router.refresh();
  }

  async function savePayment() {
    if (!selectedTenant || !paymentForm.amount || !paymentForm.due_date) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("rent_payments").insert({
      tenant_id: selectedTenant.id,
      property_id: selectedTenant.property_id,
      user_id: user.id,
      amount: parseFloat(paymentForm.amount),
      due_date: paymentForm.due_date,
      paid_date: paymentForm.paid_date || null,
      status: paymentForm.status,
      notes: paymentForm.notes || null,
    });

    setSaving(false);
    setShowAddPayment(false);
    setSelectedTenant(null);
    setPaymentForm({ amount: "", due_date: firstOfMonth(), paid_date: "", status: "paid", notes: "" });
    router.refresh();
  }

  return (
    <div className="px-8 py-7 w-full" style={{ background: "#F8F7F4", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]" style={{ color: "#101418" }}>
            Mietverwaltung
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            {tenants.length} Mieter
          </p>
        </div>
        {tenants.length > 0 && (
          <div className="flex gap-3">
            <DarkButton variant="primary" onClick={() => setShowAddTenant(true)}>
              Mieter hinzufugen
            </DarkButton>
          </div>
        )}
      </div>

      {/* Summary cards */}
      {tenants.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "AKTIVE MIETER",  value: String(activeTenantsCount), color: "#101418", hero: false },
            { label: "SOLL / MONAT",   value: fmtCurrency(totalRentExpected), color: "#FFFFFF", hero: true },
            { label: "EINGEGANGEN",    value: fmtCurrency(paidAmt),   color: "#2D6A2D", hero: false },
            { label: "AUSSTEHEND",     value: fmtCurrency(pendingAmt), color: pendingAmt > 0 ? "#B91C1C" : "#101418", hero: false },
          ].map(({ label, value, color, hero }) => (
            <div
              key={label}
              className="rounded-[14px] px-4 py-3.5"
              style={hero
                ? { background: "#A07830", border: "1px solid rgba(0,0,0,0.07)" }
                : { background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)" }
              }
            >
              <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: hero ? "rgba(255,255,255,0.7)" : "#9CA3AF" }}>
                {label}
              </p>
              <p className="text-xl font-semibold tracking-tight" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Property filter */}
      {tenants.length > 0 && properties.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {[{ id: "all", name: "Alle Objekte" }, ...properties].map(({ id, name }) => {
            const active = selectedPropertyId === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedPropertyId(id)}
                className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-150"
                style={active
                  ? { background: "#A07830", color: "#FFFFFF", fontWeight: 600 }
                  : { background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.07)", color: "#6B7280" }
                }
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#101418"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; }}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      {tenants.length > 0 && (
        <div className="flex mb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          {(["mieter", "zahlungen"] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="text-sm font-medium px-1 mr-6 pb-2 transition-colors duration-150 capitalize"
                style={{
                  color: active ? "#A07830" : "#9CA3AF",
                  borderBottom: active ? "2px solid #A07830" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {tab === "mieter" ? "Mieter" : "Zahlungen"}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab: Mieter */}
      {(activeTab === "mieter" || tenants.length === 0) && (
        <>
          {tenants.length === 0 ? (
            // Empty state
            <div className="mt-10 flex flex-col items-center text-center px-6">
              <motion.div
                animate={prefersReduced ? {} : { y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 rounded-[20px] flex items-center justify-center mx-auto"
                style={{ background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.07)" }}
              >
                <UsersFour size={36} color="#9CA3AF" />
              </motion.div>

              <h2 className="text-[24px] font-semibold tracking-[-0.02em] mt-8" style={{ color: "#101418" }}>
                Noch keine Mieter
              </h2>
              <p className="text-sm mt-3 max-w-[340px] leading-relaxed" style={{ color: "#6B7280" }}>
                Erfasse Mieter, verfolge Zahlungen und behalte jeden Vertrag im Blick.
              </p>

              <div className="mt-6">
                <DarkButton variant="primary" onClick={() => setShowAddTenant(true)}>
                  Ersten Mieter hinzufügen
                </DarkButton>
              </div>

              {/* Ghost preview rows */}
              <div className="mt-10 w-full max-w-[500px] flex flex-col gap-2 select-none pointer-events-none">
                {[
                  { name: "Maria Mustermann", unit: "EG links",  rent: "850 €/Mo" },
                  { name: "Thomas Beispiel",  unit: "OG rechts", rent: "920 €/Mo" },
                ].map((t, i) => (
                  <div
                    key={t.name}
                    className="rounded-[14px] px-5 py-4 flex items-center justify-between"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.07)",
                      opacity: i === 0 ? 0.35 : 0.2,
                      filter: "blur(1.5px)",
                    }}
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[#101418]">{t.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{t.unit}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-[#101418]">{t.rent}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(45,106,45,0.1)", color: "#2D6A2D" }}>
                        Aktiv
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Tenant list
            <div className="flex flex-col gap-3">
              {filtered.map((tenant, i) => (
                <motion.div
                  key={tenant.id}
                  initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prefersReduced ? 0 : i * 0.05, duration: 0.3 }}
                  className="rounded-[14px]"
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${tenant.is_active ? "rgba(160,120,48,0.18)" : "rgba(0,0,0,0.07)"}`,
                  }}
                  whileHover={prefersReduced ? {} : {
                    y: -1,
                    borderColor: tenant.is_active ? "rgba(160,120,48,0.32)" : "rgba(0,0,0,0.14)",
                  }}
                  whileTap={prefersReduced ? {} : { scale: 0.99 }}
                >
                  <div className="flex-1 px-5 py-4 flex items-center justify-between gap-4">
                      {/* Left */}
                      <div className="min-w-0">
                        {(() => {
                          const hasOverdue = tenant.rent_payments.some((p) => p.status === "late");
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold" style={{ color: "#101418" }}>
                                {tenant.name}
                                {tenant.unit_number && (
                                  <span className="ml-2 text-[10px] font-normal" style={{ color: "#9CA3AF" }}>
                                    {tenant.unit_number}
                                  </span>
                                )}
                              </p>
                              {hasOverdue && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: "#B91C1C", background: "rgba(185,28,28,0.08)", padding: "2px 7px", borderRadius: 99, border: "1px solid rgba(185,28,28,0.15)" }}>
                                  Zahlung überfällig
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
                          {propertyName(tenant.property_id)}
                        </p>
                        <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
                          Eingezogen: {fmtDate(tenant.move_in_date)}
                        </p>
                      </div>

                      {/* Center */}
                      <div className="flex gap-6 items-center flex-shrink-0">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#6B7280" }}>
                            Kaltmiete
                          </p>
                          <p className="text-sm font-semibold" style={{ color: "#101418" }}>
                            {fmtCurrency(tenant.rent_monthly)}/Mo
                          </p>
                          {tenant.nk_vorauszahlung != null && tenant.nk_vorauszahlung > 0 && (
                            <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                              NK-Vorauszahlung: <strong style={{ color: "#101418" }}>{tenant.nk_vorauszahlung}€/Mo</strong>
                            </p>
                          )}
                          <button
                            onClick={() => router.push(`/mietvertraege?tenant_id=${tenant.id}`)}
                            style={{ fontSize: 11, color: "#A07830", padding: "3px 0", cursor: "pointer", textAlign: "left" }}
                          >
                            Mietvertrag erstellen →
                          </button>
                        </div>
                        <span
                          className="text-[10px] font-semibold px-2 py-1 rounded-full"
                          style={tenant.is_active
                            ? { background: "rgba(45,106,45,0.1)", color: "#2D6A2D" }
                            : { background: "#F5F5F5", color: "#9CA3AF" }
                          }
                        >
                          {tenant.is_active ? "Aktiv" : "Ausgezogen"}
                        </span>
                      </div>

                      {/* Right */}
                      <div className="flex gap-2 items-center flex-shrink-0">
                        {tenant.rent_payments.some((p) => p.status === "late") && (
                          <button
                            onClick={() => router.push("/mahnwesen")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition-all"
                            style={{
                              background: "rgba(185,28,28,0.08)",
                              border: "1px solid rgba(185,28,28,0.15)",
                              color: "#B91C1C",
                            }}
                          >
                            <Warning size={12} color="#B91C1C" />
                            Mahnen
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/nebenkostenabrechnung?tenant_id=${tenant.id}&property_id=${tenant.property_id}`)}
                          style={{ fontSize: 11, fontWeight: 500, color: "#A07830", padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(160,120,48,0.2)", background: "rgba(160,120,48,0.05)" }}
                        >
                          NKA erstellen
                        </button>
                        <button
                          onClick={() => router.push(`/uebergabe?tenant_id=${tenant.id}`)}
                          style={{ fontSize: 11, fontWeight: 500, color: "#A07830", padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(160,120,48,0.2)", background: "rgba(160,120,48,0.05)", cursor: "pointer" }}
                        >
                          Übergabe
                        </button>
                        <button
                          onClick={() => router.push(`/mietvertraege?tenant_id=${tenant.id}`)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            fontSize: 11, fontWeight: 500, color: "#A07830",
                            padding: "5px 10px", borderRadius: 7,
                            border: "1px solid rgba(160,120,48,0.2)",
                            background: "rgba(160,120,48,0.05)", cursor: "pointer",
                          }}
                        >
                          <FileText size={12} />
                          Mietvertrag
                        </button>
                        <DarkButton
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setPaymentForm((f) => ({ ...f, amount: String(tenant.rent_monthly), due_date: firstOfMonth() }));
                            setShowAddPayment(true);
                          }}
                        >
                          Zahlung
                        </DarkButton>
                        <button
                          onClick={() => openPortalModal(tenant)}
                          title="Mieterportal"
                          className="p-1.5 transition-colors duration-150"
                          style={{ color: portalStatus[tenant.id]?.active ? "#00897B" : "#9CA3AF" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#00897B"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = portalStatus[tenant.id]?.active ? "#00897B" : "#9CA3AF"; }}
                        >
                          <Globe size={16} />
                        </button>
                        <button
                          className="p-1.5 transition-colors duration-150"
                          style={{ color: "#9CA3AF" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#101418"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
                        >
                          <DotsThree size={16} />
                        </button>
                      </div>
                    </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Zahlungen */}
      {activeTab === "zahlungen" && tenants.length > 0 && (
        <div className="flex flex-col gap-2">
          {allPaymentsSorted.length === 0 ? (
            <p className="text-sm text-center mt-12" style={{ color: "#9CA3AF" }}>
              Noch keine Zahlungen erfasst.
            </p>
          ) : (
            allPaymentsSorted.map((p) => {
              const st = STATUS_STYLES[p.status] ?? STATUS_STYLES.pending;
              return (
                <div
                  key={p.id}
                  className="rounded-[14px] px-5 py-3.5 flex items-center justify-between"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#101418" }}>
                      {p.tenantName}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
                      Fallig: {fmtDate(p.due_date)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#101418" }}>
                    {fmtCurrency(p.amount)}
                  </p>
                  <div className="text-right">
                    <span
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: st.bg, color: st.text }}
                    >
                      {st.label}
                    </span>
                    {p.paid_date && (
                      <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>
                        Eingegangen: {fmtDate(p.paid_date)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal: Add Tenant */}
      <AnimatePresence>
        {showAddTenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddTenant(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="w-full max-w-[480px] rounded-[20px] overflow-hidden"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.12)",
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-5 flex justify-between items-center"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
              >
                <p className="text-base font-semibold" style={{ color: "#101418" }}>
                  Mieter hinzufugen
                </p>
                <button
                  onClick={() => setShowAddTenant(false)}
                  className="transition-colors duration-150"
                  style={{ color: "#9CA3AF" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#101418"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                <DarkSelect
                  label="Objekt"
                  value={tenantForm.property_id}
                  onChange={(e) => setTenantForm((f) => ({ ...f, property_id: e.target.value }))}
                  options={properties.map((p) => ({ value: p.id, label: p.name }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput
                    label="Name"
                    placeholder="Max Mustermann"
                    required
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <DarkInput
                    label="Einheit / WE"
                    placeholder="EG links"
                    value={tenantForm.unit_number}
                    onChange={(e) => setTenantForm((f) => ({ ...f, unit_number: e.target.value }))}
                  />
                  <DarkInput
                    label="E-Mail"
                    type="email"
                    placeholder="mieter@email.de"
                    value={tenantForm.email}
                    onChange={(e) => setTenantForm((f) => ({ ...f, email: e.target.value }))}
                  />
                  <DarkInput
                    label="Telefon"
                    placeholder="+49 123 456789"
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                  <DarkInput
                    label="Einzugsdatum"
                    type="date"
                    required
                    value={tenantForm.move_in_date}
                    onChange={(e) => setTenantForm((f) => ({ ...f, move_in_date: e.target.value }))}
                  />
                  <DarkInput
                    label="Kaltmiete (€)"
                    type="number"
                    placeholder="850"
                    value={tenantForm.rent_monthly}
                    onChange={(e) => setTenantForm((f) => ({ ...f, rent_monthly: e.target.value }))}
                  />
                  <DarkInput
                    label="Kaution (€)"
                    type="number"
                    placeholder="2550"
                    value={tenantForm.deposit}
                    onChange={(e) => setTenantForm((f) => ({ ...f, deposit: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {/* NK-Vorauszahlung */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>
                      NK-Vorauszahlung (€/Mo)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tenantForm.nk_vorauszahlung ?? ""}
                      onChange={e => setTenantForm(f => ({ ...f, nk_vorauszahlung: parseFloat(e.target.value) || 0 }))}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>
                      Wohnfläche (m²)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tenantForm.wohnflaeche ?? ""}
                      onChange={e => setTenantForm(f => ({ ...f, wohnflaeche: parseFloat(e.target.value) || null }))}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>
                      Personenzahl
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={tenantForm.einwohnerzahl ?? 1}
                      onChange={e => setTenantForm(f => ({ ...f, einwohnerzahl: parseInt(e.target.value) || 1 }))}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13 }}
                    />
                  </div>
                </div>
                <DarkInput
                  label="Notizen"
                  placeholder="Interne Notizen..."
                  value={tenantForm.notes}
                  onChange={(e) => setTenantForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {/* Footer */}
              <div
                className="px-6 py-4 flex justify-end gap-3"
                style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
              >
                <DarkButton variant="ghost" onClick={() => setShowAddTenant(false)}>
                  Abbrechen
                </DarkButton>
                <DarkButton variant="primary" loading={saving} onClick={saveTenant}>
                  Mieter speichern
                </DarkButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Mieterportal */}
      <AnimatePresence>
        {showPortalModal && portalTenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowPortalModal(false); setPortalTenant(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="w-full max-w-[440px] rounded-[20px] overflow-hidden"
              style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 24px 80px rgba(0,0,0,0.12)" }}
            >
              {/* Header */}
              <div className="px-6 py-5 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(0,137,123,0.08)", border: "1px solid rgba(0,137,123,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Globe size={16} color="#00897B" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#101418" }}>Mieterportal</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{portalTenant.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowPortalModal(false); setPortalTenant(null); }}
                  style={{ color: "#9CA3AF" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#101418"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {portalStatus[portalTenant.id]?.active ? (
                  /* Already active */
                  <div className="flex items-center gap-3 p-4 rounded-[12px]" style={{ background: "rgba(45,106,45,0.06)", border: "1px solid rgba(45,106,45,0.15)" }}>
                    <CheckCircle size={20} color="#2D6A2D" weight="fill" />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#2D6A2D" }}>Portal aktiv</p>
                      <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{portalStatus[portalTenant.id]?.email}</p>
                    </div>
                  </div>
                ) : inviteSuccess && portalStatus[portalTenant.id]?.activationUrl ? (
                  /* Success — show activation URL */
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle size={18} color="#2D6A2D" weight="fill" />
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#2D6A2D" }}>Einladung gesendet!</p>
                    </div>
                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>Aktivierungs-Link:</p>
                    <div className="flex items-center gap-2" style={{ background: "#F8F7F4", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "10px 14px" }}>
                      <p style={{ fontSize: 11, color: "#101418", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {portalStatus[portalTenant.id]?.activationUrl}
                      </p>
                      <button
                        onClick={() => {
                          const url = portalStatus[portalTenant.id]?.activationUrl ?? "";
                          navigator.clipboard.writeText(url);
                          setPortalToast("Link kopiert");
                        }}
                        style={{ color: "#A07830", flexShrink: 0 }}
                        className="transition-opacity hover:opacity-70"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No portal yet — invite form */
                  <div>
                    <div className="mb-4 p-3 rounded-[10px]" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>
                        Dieser Mieter hat noch keinen Portal-Zugang. Sende eine Einladung, damit er seine Dokumente, Anfragen und Abrechnungen einsehen kann.
                      </p>
                    </div>
                    <div className="mb-4">
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6 }}>
                        E-Mail-Adresse
                      </label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="mieter@email.de"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 13, color: "#101418", outline: "none", fontFamily: "inherit" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!portalStatus[portalTenant.id]?.active && (
                <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                  <button
                    onClick={() => { setShowPortalModal(false); setPortalTenant(null); }}
                    style={{ fontSize: 13, fontWeight: 500, color: "#6B7280", padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)" }}
                    className="transition-colors hover:bg-gray-50"
                  >
                    {inviteSuccess ? "Schließen" : "Abbrechen"}
                  </button>
                  {!inviteSuccess && (
                    <button
                      onClick={sendInvite}
                      disabled={inviteLoading || !inviteEmail}
                      className="flex items-center gap-2 transition-all"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: (inviteLoading || !inviteEmail) ? "#9CA3AF" : "white",
                        background: (inviteLoading || !inviteEmail) ? "rgba(0,0,0,0.06)" : "#00897B",
                        padding: "9px 20px",
                        borderRadius: 10,
                        boxShadow: (inviteLoading || !inviteEmail) ? "none" : "0 4px 14px rgba(0,137,123,0.2)",
                        cursor: (inviteLoading || !inviteEmail) ? "not-allowed" : "pointer",
                      }}
                    >
                      {inviteLoading ? (
                        <>
                          <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" strokeOpacity=".3"/>
                            <path d="M12 2a10 10 0 0 1 10 10"/>
                          </svg>
                          Senden...
                        </>
                      ) : "Portal-Einladung senden"}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Add Payment */}
      <AnimatePresence>
        {showAddPayment && selectedTenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowAddPayment(false); setSelectedTenant(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="w-full max-w-[420px] rounded-[20px] overflow-hidden"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.12)",
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-5 flex justify-between items-start"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
              >
                <div>
                  <p className="text-base font-semibold" style={{ color: "#101418" }}>
                    Zahlung erfassen
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                    {selectedTenant.name} · {fmtCurrency(selectedTenant.rent_monthly)}/Mo
                  </p>
                </div>
                <button
                  onClick={() => { setShowAddPayment(false); setSelectedTenant(null); }}
                  className="transition-colors duration-150"
                  style={{ color: "#9CA3AF" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#101418"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <div className="px-6 py-5 flex flex-col gap-4">
                <DarkInput
                  label="Betrag (€)"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <DarkInput
                    label="Falligkeitsdatum"
                    type="date"
                    value={paymentForm.due_date}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, due_date: e.target.value }))}
                  />
                  <DarkInput
                    label="Eingangsdatum"
                    type="date"
                    placeholder="Leer = noch nicht bezahlt"
                    value={paymentForm.paid_date}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, paid_date: e.target.value }))}
                  />
                </div>
                <DarkSelect
                  label="Status"
                  value={paymentForm.status}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, status: e.target.value }))}
                  options={[
                    { value: "paid",    label: "Bezahlt"     },
                    { value: "pending", label: "Ausstehend"  },
                    { value: "late",    label: "Uberfällig"  },
                    { value: "partial", label: "Teilzahlung" },
                  ]}
                />
                <DarkInput
                  label="Notizen"
                  placeholder="optional"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {/* Footer */}
              <div
                className="px-6 py-4 flex justify-end gap-3"
                style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
              >
                <DarkButton variant="ghost" onClick={() => { setShowAddPayment(false); setSelectedTenant(null); }}>
                  Abbrechen
                </DarkButton>
                <DarkButton variant="primary" loading={saving} onClick={savePayment}>
                  Zahlung speichern
                </DarkButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portal toast */}
      <AnimatePresence>
        {portalToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]"
            style={{
              background: "#101418",
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              padding: "10px 20px",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              whiteSpace: "nowrap",
            }}
          >
            {portalToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
