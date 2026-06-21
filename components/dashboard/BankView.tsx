"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Bank,
  UploadSimple,
  CurrencyCircleDollar,
  MagnifyingGlass,
  Check,
  X,
  CheckCircle,
  Warning,
} from "@phosphor-icons/react"
import TransaktionenImport from "@/components/dashboard/TransaktionenImport"

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface BankTx {
  id: string
  transaction_date: string
  booking_date?: string | null
  betrag: number
  waehrung?: string | null
  verwendungszweck: string
  auftraggeber_name: string
  auftraggeber_iban?: string | null
  bank_account_iban?: string | null
  match_status: "unmatched" | "suggested" | "confirmed" | "rejected" | "ignored"
  suggested_tenant_id?: string | null
  suggested_payment_id?: string | null
  match_confidence?: number | null
  match_reason?: string | null
  confirmed_payment_id?: string | null
  confirmed_at?: string | null
  source: string
  created_at: string
}

interface TenantWithPayments {
  id: string
  name: string
  rent_monthly?: number
  rent_payments: { id: string; amount: number; due_date: string; status: string }[]
}

interface PendingPayment {
  id: string
  amount: number
  due_date: string
  tenant_id: string
  tenants: { name: string } | null
}

interface BankAccountRow {
  id: string
  bank_name: string
  iban?: string | null
  kontoinhaber?: string | null
  letzter_import?: string | null
  transaktionen_count?: number | null
  created_at: string
}

interface BankViewProps {
  transactions: BankTx[]
  tenants: TenantWithPayments[]
  bankAccounts: BankAccountRow[]
  pendingPayments: PendingPayment[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("de-DE").format(new Date(iso))
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n)
}

function maskIban(iban: string) {
  if (!iban || iban.length < 8) return iban
  return iban.slice(0, 4) + " **** **** " + iban.slice(-4)
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BankTx["match_status"] }) {
  const map: Record<BankTx["match_status"], { label: string; bg: string; color: string }> = {
    unmatched: { label: "Kein Match", bg: "rgba(0,0,0,0.06)", color: "#6B7280" },
    suggested: { label: "Vorschlag", bg: "rgba(160,120,48,0.12)", color: "#A07830" },
    confirmed: { label: "Bestätigt", bg: "rgba(45,106,45,0.1)", color: "#2D6A2D" },
    rejected: { label: "Abgelehnt", bg: "rgba(185,28,28,0.08)", color: "#B91C1C" },
    ignored: { label: "Ignoriert", bg: "rgba(0,0,0,0.05)", color: "#9CA3AF" },
  }
  const s = map[status]
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        borderRadius: 6,
        padding: "3px 8px",
        whiteSpace: "nowrap" as const,
      }}
    >
      {s.label}
    </span>
  )
}

// ─── AddAccountForm ───────────────────────────────────────────────────────────

function AddAccountForm({
  onClose,
  onAdded,
}: {
  onClose: () => void
  onAdded: (acct: BankAccountRow) => void
}) {
  const [bankName, setBankName] = useState("")
  const [iban, setIban] = useState("")
  const [kontoinhaber, setKontoinhaber] = useState("")
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!bankName) return
    setSaving(true)
    try {
      const res = await fetch("/api/bank/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: bankName,
          iban: iban || null,
          kontoinhaber: kontoinhaber || null,
        }),
      })
      if (res.ok) {
        const { data } = await res.json()
        onAdded(data)
      }
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 9,
    fontSize: 13,
    color: "#101418",
    background: "white",
    outline: "none",
    boxSizing: "border-box",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 6,
    display: "block",
  }

  return (
    <div
      style={{
        background: "white",
        border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: 14,
        padding: "20px 24px",
        marginTop: 12,
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 600, color: "#101418", marginBottom: 16 }}>
        Neues Konto hinzufügen
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={labelStyle}>Bankname *</label>
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="z.B. Sparkasse, Deutsche Bank..."
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>IBAN</label>
          <input
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="DE00 0000 0000 0000 0000 00"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Kontoinhaber</label>
          <input
            value={kontoinhaber}
            onChange={(e) => setKontoinhaber(e.target.value)}
            placeholder="Name des Kontoinhabers"
            style={inputStyle}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          onClick={save}
          disabled={saving || !bankName}
          style={{
            flex: 1,
            padding: "10px 0",
            background: bankName ? "#A07830" : "rgba(0,0,0,0.08)",
            color: bankName ? "white" : "#9CA3AF",
            border: "none",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            cursor: bankName ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "Speichern..." : "Konto speichern"}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "10px 16px",
            background: "rgba(0,0,0,0.05)",
            color: "#6B7280",
            border: "none",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}

// ─── BankView ─────────────────────────────────────────────────────────────────

export default function BankView({
  transactions,
  tenants,
  bankAccounts,
  pendingPayments,
}: BankViewProps) {
  // ── State ──
  const [tab, setTab] = useState<"transaktionen" | "konten" | "import">("transaktionen")
  const [filterStatus, setFilterStatus] = useState<
    "all" | "unmatched" | "suggested" | "confirmed" | "ignored"
  >("all")
  const [filterSearch, setFilterSearch] = useState("")
  const [txList, setTxList] = useState<BankTx[]>(transactions)
  const [bankAccountList, setBankAccountList] = useState<BankAccountRow[]>(bankAccounts)
  const [selectedTx, setSelectedTx] = useState<BankTx | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [manualTenantId, setManualTenantId] = useState("")
  const [manualPaymentId, setManualPaymentId] = useState("")
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)
  const [showAddAccount, setShowAddAccount] = useState(false)

  // ── Derived ──
  const suggested = txList.filter((t) => t.match_status === "suggested")
  const unmatched = txList.filter((t) => t.match_status === "unmatched")
  const confirmed = txList.filter((t) => t.match_status === "confirmed")

  const filtered = txList.filter((tx) => {
    const statusMatch = filterStatus === "all" || tx.match_status === filterStatus
    const search = filterSearch.toLowerCase()
    const searchMatch =
      !search ||
      tx.auftraggeber_name?.toLowerCase().includes(search) ||
      tx.verwendungszweck?.toLowerCase().includes(search)
    return statusMatch && searchMatch
  })

  // ── Toast auto-dismiss ──
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // ── Reset manual selects when selectedTx changes ──
  useEffect(() => {
    setManualTenantId("")
    setManualPaymentId("")
  }, [selectedTx])

  // ── Functions ──
  const openDrawer = useCallback((tx: BankTx) => {
    setSelectedTx(tx)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedTx(null), 300)
  }, [])

  const confirmTx = useCallback(
    async (tx: BankTx, paymentId?: string) => {
      if (confirming) return
      setConfirming(true)
      const pid = paymentId ?? tx.suggested_payment_id
      if (!pid) {
        setToast({ msg: "Keine Zahlung ausgewählt", type: "err" })
        setConfirming(false)
        return
      }
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_id: pid, transaction_id: tx.id, task_id: null }),
        })
        if (res.ok) {
          setTxList((prev) =>
            prev.map((t) =>
              t.id === tx.id ? { ...t, match_status: "confirmed" as const } : t
            )
          )
          setToast({ msg: "Zahlung bestätigt", type: "ok" })
          closeDrawer()
        } else {
          const d = await res.json()
          setToast({ msg: d.error ?? "Fehler", type: "err" })
        }
      } catch {
        setToast({ msg: "Netzwerkfehler", type: "err" })
      }
      setConfirming(false)
    },
    [confirming, closeDrawer]
  )

  const ignoreTx = useCallback(
    async (txId: string) => {
      await fetch(`/api/bank-transactions/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_status: "ignored" }),
      })
      setTxList((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, match_status: "ignored" as const } : t))
      )
      if (selectedTx?.id === txId) closeDrawer()
    },
    [selectedTx, closeDrawer]
  )

  // ── Drawer content ──
  function DrawerContent() {
    if (!selectedTx) return null
    const tx = selectedTx

    const suggestedTenant = tx.suggested_tenant_id
      ? tenants.find((t) => t.id === tx.suggested_tenant_id) ?? null
      : null

    const suggestedPayment = suggestedTenant && tx.suggested_payment_id
      ? suggestedTenant.rent_payments.find((p) => p.id === tx.suggested_payment_id) ?? null
      : null

    const manualPendingPayments = manualTenantId
      ? pendingPayments.filter((p) => p.tenant_id === manualTenantId)
      : []

    const rowStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 10,
    }
    const rowIconStyle: React.CSSProperties = {
      marginTop: 1,
      flexShrink: 0,
    }
    const rowLabelStyle: React.CSSProperties = {
      fontSize: 11,
      color: "#9CA3AF",
      marginBottom: 2,
    }
    const rowValueStyle: React.CSSProperties = {
      fontSize: 13,
      color: "#101418",
      fontWeight: 500,
      wordBreak: "break-word",
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Drawer header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            flexShrink: 0,
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 700, color: "#101418" }}>Transaktion prüfen</p>
          <button
            onClick={closeDrawer}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(0,0,0,0.06)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color="#6B7280" weight="bold" />
          </button>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {/* Transaction card */}
          <div
            style={{
              background: "#F8F7F4",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#2D6A2D",
                letterSpacing: "-0.03em",
                marginBottom: 14,
              }}
            >
              +{formatCurrency(tx.betrag)}
            </p>

            <div style={rowStyle}>
              <span style={rowIconStyle}>
                <CurrencyCircleDollar size={15} color="#9CA3AF" />
              </span>
              <div>
                <p style={rowLabelStyle}>Datum</p>
                <p style={rowValueStyle}>{formatDate(tx.transaction_date)}</p>
              </div>
            </div>

            <div style={rowStyle}>
              <span style={rowIconStyle}>
                <Bank size={15} color="#9CA3AF" />
              </span>
              <div>
                <p style={rowLabelStyle}>Auftraggeber</p>
                <p style={rowValueStyle}>{tx.auftraggeber_name || "—"}</p>
                {tx.auftraggeber_iban && (
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                    {maskIban(tx.auftraggeber_iban)}
                  </p>
                )}
              </div>
            </div>

            {tx.verwendungszweck && (
              <div style={rowStyle}>
                <span style={rowIconStyle}>
                  <MagnifyingGlass size={15} color="#9CA3AF" />
                </span>
                <div>
                  <p style={rowLabelStyle}>Verwendungszweck</p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                      fontFamily: "monospace",
                      wordBreak: "break-word",
                      lineHeight: 1.5,
                    }}
                  >
                    {tx.verwendungszweck}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Suggested state */}
          {tx.match_status === "suggested" && (
            <div
              style={{
                background: "rgba(160,120,48,0.04)",
                border: "1px solid rgba(160,120,48,0.18)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#A07830",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                Imvestra-Vorschlag
              </p>

              {tx.match_reason && (
                <p style={{ fontSize: 13, color: "#101418", marginBottom: 12 }}>
                  {tx.match_reason}
                </p>
              )}

              {/* Confidence bar */}
              {tx.match_confidence != null && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>Konfidenz</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#A07830" }}>
                      {Math.round(tx.match_confidence * 100)}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 4,
                      background: "rgba(0,0,0,0.08)",
                      borderRadius: 2,
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round((tx.match_confidence ?? 0) * 100)}%`,
                        height: "100%",
                        background: "#A07830",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Tenant + Payment info */}
              {suggestedTenant && (
                <div
                  style={{
                    background: "white",
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 12,
                  }}
                >
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#101418", marginBottom: 4 }}>
                    {suggestedTenant.name}
                  </p>
                  {suggestedPayment && (
                    <>
                      <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 10 }}>
                        Miete {formatCurrency(suggestedPayment.amount)} fällig{" "}
                        {formatDate(suggestedPayment.due_date)}
                      </p>
                      {/* Amount comparison */}
                      {(() => {
                        const diff = tx.betrag - suggestedPayment.amount
                        if (Math.abs(diff) < 0.01) {
                          return (
                            <p
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#2D6A2D",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Check size={12} weight="bold" />
                              Betrag stimmt überein
                            </p>
                          )
                        }
                        return (
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#A07830",
                            }}
                          >
                            Abweichung: {diff > 0 ? "+" : ""}
                            {formatCurrency(diff)}
                          </p>
                        )
                      })()}
                    </>
                  )}
                </div>
              )}

              <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 14, lineHeight: 1.5 }}>
                Imvestra ordnet Zahlungen zu — du buchst.
              </p>

              <button
                onClick={() => confirmTx(tx)}
                disabled={confirming}
                style={{
                  width: "100%",
                  height: 46,
                  background: confirming ? "rgba(160,120,48,0.5)" : "#A07830",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: confirming ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Check size={16} weight="bold" />
                {confirming ? "Bestätigen..." : "Bestätigen"}
              </button>

              <button
                onClick={() => {
                  ignoreTx(tx.id)
                  closeDrawer()
                }}
                style={{
                  width: "100%",
                  height: 36,
                  background: "transparent",
                  color: "#6B7280",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Ignorieren
              </button>
            </div>
          )}

          {/* Unmatched state — manual assignment */}
          {tx.match_status === "unmatched" && (
            <div
              style={{
                background: "rgba(0,0,0,0.02)",
                border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 14,
                }}
              >
                Kein automatischer Match
              </p>

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Mieter
                </label>
                <select
                  value={manualTenantId}
                  onChange={(e) => {
                    setManualTenantId(e.target.value)
                    setManualPaymentId("")
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 9,
                    fontSize: 13,
                    color: "#101418",
                    background: "white",
                    outline: "none",
                  }}
                >
                  <option value="">Mieter wählen...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {manualTenantId && (
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    Zahlung
                  </label>
                  <select
                    value={manualPaymentId}
                    onChange={(e) => setManualPaymentId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: 9,
                      fontSize: 13,
                      color: "#101418",
                      background: "white",
                      outline: "none",
                    }}
                  >
                    <option value="">Zahlung wählen...</option>
                    {manualPendingPayments.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatCurrency(p.amount)} — fällig {formatDate(p.due_date)}
                      </option>
                    ))}
                    {manualPendingPayments.length === 0 && (
                      <option value="" disabled>
                        Keine offenen Zahlungen
                      </option>
                    )}
                  </select>
                </div>
              )}

              <button
                onClick={() => {
                  if (!manualPaymentId) return
                  confirmTx(tx, manualPaymentId)
                }}
                disabled={!manualPaymentId || confirming}
                style={{
                  width: "100%",
                  height: 42,
                  background: manualPaymentId && !confirming ? "#A07830" : "rgba(0,0,0,0.08)",
                  color: manualPaymentId && !confirming ? "white" : "#9CA3AF",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: manualPaymentId && !confirming ? "pointer" : "not-allowed",
                }}
              >
                {confirming ? "Zuordnen..." : "Zuordnen"}
              </button>
            </div>
          )}

          {/* Confirmed state */}
          {tx.match_status === "confirmed" && (
            <div
              style={{
                background: "rgba(45,106,45,0.04)",
                border: "1px solid rgba(45,106,45,0.15)",
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
              }}
            >
              <CheckCircle size={32} color="#2D6A2D" weight="fill" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: "#2D6A2D", marginBottom: 6 }}>
                Bestätigt
              </p>
              {tx.confirmed_at && (
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                  Gebucht am {formatDate(tx.confirmed_at)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Render ──
  return (
    <div style={{ padding: "40px 40px 60px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, #A07830 0%, #C4973D 100%)",
              borderRadius: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(160,120,48,0.25)",
              flexShrink: 0,
            }}
          >
            <Bank size={22} color="white" weight="bold" />
          </div>
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#101418",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Bankanbindung
            </h1>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2, marginBottom: 0 }}>
              Transaktionen importieren und Mietzahlungen zuordnen
            </p>
          </div>
        </div>
        <button
          onClick={() => setTab("import")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#A07830",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(160,120,48,0.25)",
            flexShrink: 0,
          }}
        >
          <UploadSimple size={16} />
          CSV importieren
        </button>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #18160E 0%, #A07830 100%)",
            borderRadius: 14,
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
              margin: 0,
            }}
          >
            Neue Transaktionen
          </p>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.03em",
              margin: "8px 0 4px",
            }}
          >
            {unmatched.length + suggested.length}
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Warten auf Prüfung
          </p>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 14,
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
              margin: 0,
            }}
          >
            Zu bestätigen
          </p>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#A07830",
              letterSpacing: "-0.03em",
              margin: "8px 0 4px",
            }}
          >
            {suggested.length}
          </p>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Vorschläge vorhanden</p>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 14,
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
              margin: 0,
            }}
          >
            Bestätigt
          </p>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#2D6A2D",
              letterSpacing: "-0.03em",
              margin: "8px 0 4px",
            }}
          >
            {confirmed.length}
          </p>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Diesen Monat</p>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 14,
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
              margin: 0,
            }}
          >
            Offene Mieten
          </p>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#B91C1C",
              letterSpacing: "-0.03em",
              margin: "8px 0 4px",
            }}
          >
            {pendingPayments.length}
          </p>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Noch ausstehend</p>
        </div>
      </div>

      {/* Alert Banner */}
      {suggested.length > 0 && (
        <div
          style={{
            background: "rgba(160,120,48,0.04)",
            border: "1px solid rgba(160,120,48,0.15)",
            borderRadius: 12,
            padding: "14px 20px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CurrencyCircleDollar size={20} color="#A07830" weight="fill" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#A07830", margin: 0 }}>
                {suggested.length} Zahlungseingang{suggested.length !== 1 ? "e" : ""}{" "}
                warte{suggested.length === 1 ? "t" : "n"} auf Bestätigung
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1, marginBottom: 0 }}>
                Bitte prüfen und bestätigen — keine automatische Buchung
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus("suggested")}
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#A07830",
              background: "rgba(160,120,48,0.1)",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Jetzt prüfen
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          marginBottom: 20,
        }}
      >
        {(
          [
            { id: "transaktionen", label: "Transaktionen" },
            { id: "konten", label: "Konten" },
            { id: "import", label: "CSV Import" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "#A07830" : "#6B7280",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t.id ? "#A07830" : "transparent"}`,
              padding: "10px 16px",
              cursor: "pointer",
              marginBottom: -1,
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Transaktionen */}
      {tab === "transaktionen" && (
        <div>
          {/* Filter row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(0,0,0,0.04)",
                borderRadius: 10,
                padding: 4,
              }}
            >
              {(
                [
                  { id: "all", label: "Alle" },
                  { id: "unmatched", label: "Zu prüfen" },
                  { id: "suggested", label: "Vorschlag" },
                  { id: "confirmed", label: "Bestätigt" },
                  { id: "ignored", label: "Ignoriert" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  style={{
                    fontSize: 12,
                    fontWeight: filterStatus === f.id ? 600 : 400,
                    color: filterStatus === f.id ? "white" : "#6B7280",
                    background: filterStatus === f.id ? "#A07830" : "transparent",
                    border: "none",
                    borderRadius: 7,
                    padding: "5px 12px",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, maxWidth: 280, position: "relative" }}>
              <MagnifyingGlass
                size={14}
                color="#9CA3AF"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Auftraggeber, Verwendungszweck..."
                style={{
                  width: "100%",
                  paddingLeft: 32,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 9,
                  fontSize: 12,
                  color: "#101418",
                  background: "white",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <p style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto" }}>
              {filtered.length} Einträge
            </p>
          </div>

          {/* Table */}
          <div
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 1fr 100px 120px 80px",
                padding: "10px 20px",
                background: "#F8F7F4",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {["DATUM", "AUFTRAGGEBER", "VERWENDUNGSZWECK", "BETRAG", "STATUS", ""].map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#9CA3AF",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Keine Transaktionen gefunden</p>
              </div>
            ) : (
              filtered.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => openDrawer(tx)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr 1fr 100px 120px 80px",
                    padding: "13px 20px",
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.background = "#F8F7F4"
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.background = "transparent"
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatDate(tx.transaction_date)}
                  </span>

                  <div style={{ minWidth: 0, paddingRight: 16 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#101418",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        margin: 0,
                      }}
                    >
                      {tx.auftraggeber_name || "—"}
                    </p>
                    {tx.auftraggeber_iban && (
                      <p
                        style={{
                          fontSize: 10,
                          color: "#9CA3AF",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          margin: 0,
                        }}
                      >
                        {maskIban(tx.auftraggeber_iban)}
                      </p>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      paddingRight: 12,
                      margin: 0,
                    }}
                  >
                    {tx.verwendungszweck || "—"}
                  </p>

                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#2D6A2D",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    +{formatCurrency(tx.betrag)}
                  </span>

                  <StatusBadge status={tx.match_status} />

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {tx.match_status === "suggested" && (
                      <>
                        <button
                          onClick={() => confirmTx(tx)}
                          disabled={confirming}
                          title="Bestätigen"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: "rgba(45,106,45,0.1)",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Check size={14} color="#2D6A2D" weight="bold" />
                        </button>
                        <button
                          onClick={() => ignoreTx(tx.id)}
                          title="Ignorieren"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: "rgba(0,0,0,0.05)",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <X size={14} color="#6B7280" weight="bold" />
                        </button>
                      </>
                    )}
                    {tx.match_status === "unmatched" && (
                      <button
                        onClick={() => openDrawer(tx)}
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#6B7280",
                          background: "rgba(0,0,0,0.05)",
                          border: "none",
                          borderRadius: 7,
                          padding: "5px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Zuordnen
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Konten */}
      {tab === "konten" && (
        <div style={{ maxWidth: 600 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: "#101418", margin: 0 }}>
              Verknüpfte Konten
            </p>
            <button
              onClick={() => setShowAddAccount(true)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#A07830",
                background: "rgba(160,120,48,0.1)",
                border: "none",
                borderRadius: 8,
                padding: "7px 14px",
                cursor: "pointer",
              }}
            >
              + Konto hinzufügen
            </button>
          </div>

          {bankAccountList.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "white",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.07)",
              }}
            >
              <Bank size={32} color="#E5E7EB" style={{ marginBottom: 12 }} />
              <p
                style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", margin: "0 0 6px" }}
              >
                Noch kein Konto hinterlegt
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
                Füge dein erstes Bankkonto hinzu, um Importe zu organisieren.
              </p>
            </div>
          ) : (
            bankAccountList.map((acct) => (
              <div
                key={acct.id}
                style={{
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: 14,
                  padding: "20px 24px",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        background: "#F0EDE4",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Bank size={20} color="#A07830" />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#101418",
                          margin: 0,
                        }}
                      >
                        {acct.bank_name}
                      </p>
                      {acct.iban && (
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
                          {maskIban(acct.iban)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {acct.letzter_import && (
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
                        Letzter Import: {formatDate(acct.letzter_import)}
                      </p>
                    )}
                    {acct.transaktionen_count != null && (
                      <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                        {acct.transaktionen_count} Transaktionen
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {showAddAccount && (
            <AddAccountForm
              onClose={() => setShowAddAccount(false)}
              onAdded={(acct) => {
                setBankAccountList((prev) => [acct, ...prev])
                setShowAddAccount(false)
              }}
            />
          )}
        </div>
      )}

      {/* Tab: Import */}
      {tab === "import" && (
        <div style={{ maxWidth: 600 }}>
          <div
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: 14,
              padding: 32,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#101418",
                marginBottom: 20,
                marginTop: 0,
              }}
            >
              Kontoauszug importieren
            </h2>
            <TransaktionenImport
              onImported={() => {
                setTab("transaktionen")
                setFilterStatus("suggested")
              }}
            />
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: "1px solid rgba(0,0,0,0.06)",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>
                Kein Kontoauszug zur Hand?
              </p>
              <a
                href="/sample-kontoauszug.csv"
                download
                style={{
                  fontSize: 12,
                  color: "#A07830",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                Beispiel-CSV herunterladen
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && selectedTx && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.3)",
                zIndex: 50,
                backdropFilter: "blur(2px)",
              }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: 480,
                background: "white",
                boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
                zIndex: 51,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              <DrawerContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 100,
              background: toast.type === "ok" ? "#2D6A2D" : "#B91C1C",
              color: "white",
              borderRadius: 10,
              padding: "12px 20px",
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            {toast.type === "ok" ? (
              <CheckCircle size={16} weight="fill" />
            ) : (
              <Warning size={16} weight="fill" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
