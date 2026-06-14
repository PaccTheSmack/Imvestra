"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  UsersFour,
  X,
  DotsThree,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import DarkButton from "@/components/ui/DarkButton";
import DarkInput from "@/components/ui/DarkInput";
import DarkSelect from "@/components/ui/DarkSelect";
import { tokens } from "@/lib/tokens";
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
  paid:    { bg: "rgba(29,184,122,0.1)",  text: "#1DB87A",  label: "Bezahlt"     },
  pending: { bg: "rgba(255,184,0,0.1)",   text: "#FFB800",  label: "Ausstehend"  },
  late:    { bg: "rgba(255,68,68,0.1)",   text: "#FF4444",  label: "Uberfällig"  },
  partial: { bg: "rgba(255,184,0,0.1)",   text: "#FFB800",  label: "Teilzahlung" },
};

export default function MieterView({ tenants, properties }: MieterViewProps) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"mieter" | "zahlungen">("mieter");
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithPayments | null>(null);
  const [saving, setSaving] = useState(false);

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

  async function saveTenant() {
    if (!tenantForm.name || !tenantForm.move_in_date || !tenantForm.property_id) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

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
    }).select().single();

    if (!error && newTenant) {
      // Auto-generate current month payment
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
    setTenantForm({ property_id: properties[0]?.id ?? "", name: "", unit_number: "", email: "", phone: "", move_in_date: "", rent_monthly: "", deposit: "", notes: "" });
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
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]" style={{ color: tokens.color.text }}>
            Mietverwaltung
          </h1>
          <p className="text-xs mt-0.5" style={{ color: tokens.color.textSubtle }}>
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
            { label: "AKTIVE MIETER",  value: String(activeTenantsCount), color: tokens.color.text },
            { label: "SOLL / MONAT",   value: fmtCurrency(totalRentExpected), color: tokens.color.text },
            { label: "EINGEGANGEN",    value: fmtCurrency(paidAmt),   color: "#1DB87A" },
            { label: "AUSSTEHEND",     value: fmtCurrency(pendingAmt), color: pendingAmt > 0 ? "#FF4444" : tokens.color.text },
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
                  ? { background: "#1DB87A", color: "#080808", fontWeight: 600 }
                  : { background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", color: "#666" }
                }
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#666"; }}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      {tenants.length > 0 && (
        <div className="flex mb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {(["mieter", "zahlungen"] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="text-sm font-medium px-1 mr-6 pb-2 transition-colors duration-150 capitalize"
                style={{
                  color: active ? "#1DB87A" : "#444",
                  borderBottom: active ? "2px solid #1DB87A" : "2px solid transparent",
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
            <div className="mt-16 flex flex-col items-center text-center">
              <motion.div
                animate={prefersReduced ? {} : { y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 rounded-[14px] flex items-center justify-center mx-auto"
                style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <UsersFour size={24} color="#444" />
              </motion.div>
              <p className="text-base font-semibold mt-5" style={{ color: tokens.color.text }}>
                Noch keine Mieter
              </p>
              <p className="text-sm mt-2" style={{ color: "#555" }}>
                Fuege deinen ersten Mieter hinzu.
              </p>
              <div className="mt-5">
                <DarkButton variant="primary" onClick={() => setShowAddTenant(true)}>
                  Mieter hinzufugen
                </DarkButton>
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
                  className="rounded-[14px] overflow-hidden transition-all duration-150"
                  style={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  <div className="flex">
                    {/* Accent bar */}
                    <div
                      className="w-[3px] flex-shrink-0"
                      style={{ background: tenant.is_active ? "#1DB87A" : "#333" }}
                    />
                    {/* Content */}
                    <div className="flex-1 pl-5 pr-5 py-4 flex items-center justify-between gap-4">
                      {/* Left */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                          {tenant.name}
                          {tenant.unit_number && (
                            <span className="ml-2 text-[10px] font-normal" style={{ color: "#444" }}>
                              {tenant.unit_number}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#444" }}>
                          {propertyName(tenant.property_id)}
                        </p>
                        <p className="text-[11px]" style={{ color: "#444" }}>
                          Eingezogen: {fmtDate(tenant.move_in_date)}
                        </p>
                      </div>

                      {/* Center */}
                      <div className="flex gap-6 items-center flex-shrink-0">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#555" }}>
                            Kaltmiete
                          </p>
                          <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                            {fmtCurrency(tenant.rent_monthly)}/Mo
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-semibold px-2 py-1 rounded-full"
                          style={tenant.is_active
                            ? { background: "rgba(29,184,122,0.1)", color: "#1DB87A" }
                            : { background: "#1A1A1A", color: "#444" }
                          }
                        >
                          {tenant.is_active ? "Aktiv" : "Ausgezogen"}
                        </span>
                      </div>

                      {/* Right */}
                      <div className="flex gap-2 items-center flex-shrink-0">
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
                          className="p-1.5 transition-colors duration-150"
                          style={{ color: "#444" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#444"; }}
                        >
                          <DotsThree size={16} />
                        </button>
                      </div>
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
            <p className="text-sm text-center mt-12" style={{ color: "#444" }}>
              Noch keine Zahlungen erfasst.
            </p>
          ) : (
            allPaymentsSorted.map((p) => {
              const st = STATUS_STYLES[p.status] ?? STATUS_STYLES.pending;
              return (
                <div
                  key={p.id}
                  className="rounded-[12px] px-5 py-3.5 flex items-center justify-between"
                  style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                      {p.tenantName}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#444" }}>
                      Fallig: {fmtDate(p.due_date)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
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
                      <p className="text-[10px] mt-1" style={{ color: "#444" }}>
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
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-5 flex justify-between items-center"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-base font-semibold" style={{ color: tokens.color.text }}>
                  Mieter hinzufugen
                </p>
                <button
                  onClick={() => setShowAddTenant(false)}
                  className="transition-colors duration-150"
                  style={{ color: "#444" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#444"; }}
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
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
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
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-5 flex justify-between items-start"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p className="text-base font-semibold" style={{ color: tokens.color.text }}>
                    Zahlung erfassen
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#444" }}>
                    {selectedTenant.name} · {fmtCurrency(selectedTenant.rent_monthly)}/Mo
                  </p>
                </div>
                <button
                  onClick={() => { setShowAddPayment(false); setSelectedTenant(null); }}
                  className="transition-colors duration-150"
                  style={{ color: "#444" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#444"; }}
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
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
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
    </div>
  );
}
