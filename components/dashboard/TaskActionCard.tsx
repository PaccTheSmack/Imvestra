"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  CurrencyDollar,
  Warning,
  Check,
  ArrowSquareOut,
  Lock,
  X,
} from "@phosphor-icons/react"
import { getConfidenceLabel } from "@/lib/payment-matching"
import { getMahngebuehr, calculateVerzugszinsen, getZahlungsfrist } from "@/lib/mahnwesen"

interface TaskPayload {
  transaction_id?: string
  suggested_tenant_id?: string
  betrag?: number
  confidence?: number
  payment_id?: string
  tenant_id?: string
  tage_ueberfaellig?: number
  existing_mahnung_id?: string
  new_mahnstufe?: number
  financing_id?: string
}

interface Task {
  id: string
  title: string
  description: string
  priority: string
  action_type: string | null
  action_payload: TaskPayload
  due_date: string | null
}

interface TaskActionCardProps {
  task: Task
  onComplete: (taskId: string) => void
  onDismiss: (taskId: string) => void
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n)
}

export default function TaskActionCard({ task, onComplete, onDismiss }: TaskActionCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const payload = task.action_payload ?? {}

  const confirmPayment = async () => {
    if (!payload.payment_id && !payload.transaction_id) return
    setLoading("confirm")
    try {
      await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: payload.payment_id,
          transaction_id: payload.transaction_id,
          task_id: task.id,
        }),
      })
      onComplete(task.id)
    } finally {
      setLoading(null)
    }
  }

  const createMahnung = async () => {
    if (!payload.payment_id && !payload.existing_mahnung_id) return
    setLoading("mahnung")
    try {
      const selectedIds = payload.payment_id ? [payload.payment_id] : []
      if (selectedIds.length > 0) {
        await fetch("/api/mahnwesen/erstellen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedIds, versand_methode: "email" }),
        })
      }
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      })
      onComplete(task.id)
      if (payload.existing_mahnung_id) {
        router.push(`/mahnwesen?mahnung_id=${payload.existing_mahnung_id}`)
      } else if (payload.payment_id) {
        router.push(`/mahnwesen?payment_id=${payload.payment_id}`)
      } else {
        router.push("/mahnwesen")
      }
    } finally {
      setLoading(null)
    }
  }

  const ignoreTransaction = async () => {
    if (!payload.transaction_id) return
    setLoading("ignore")
    try {
      await fetch(`/api/bank-transactions/${payload.transaction_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_status: "ignored" }),
      })
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      })
      onComplete(task.id)
    } finally {
      setLoading(null)
    }
  }

  const priorityColor = task.priority === "high" ? "#B91C1C" : task.priority === "medium" ? "#A07830" : "#6B7280"

  // ── CONFIRM PAYMENT CARD
  if (task.action_type === "confirm_payment") {
    const conf = getConfidenceLabel(payload.confidence ?? 0)
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: "white", border: "1px solid rgba(45,106,45,0.15)", borderRadius: 14, padding: 20 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(45,106,45,0.08)", border: "1px solid rgba(45,106,45,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CurrencyDollar size={16} color="#2D6A2D" />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 600, color: "#101418" }}>Zahlung prüfen</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{task.title.replace("Zahlung prüfen — ", "")}</p>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: `${priorityColor}15`, color: priorityColor, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            {task.priority === "high" ? "Dringend" : task.priority === "medium" ? "Mittel" : "Niedrig"}
          </span>
        </div>

        {/* Transaction box */}
        <div style={{ background: "#F8F7F4", borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Eingang</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#2D6A2D", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(payload.betrag ?? 0)}</p>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: conf.bg, color: conf.color }}>
              {conf.label}
            </span>
          </div>
        </div>

        {/* Match suggestion */}
        <div style={{ background: "rgba(160,120,48,0.04)", border: "1px solid rgba(160,120,48,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
          <p style={{ fontSize: 9, color: "#A07830", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>Vorgeschlagene Zuordnung</p>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#101418" }}>{task.title.replace("Zahlung prüfen — ", "")}</p>
        </div>

        {/* Trust notice */}
        <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
          <p style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center" as const }}>
            <Lock size={10} style={{ display: "inline", marginRight: 4 }} />
            Imvestra ordnet Zahlungen zu — die Buchung erfolgt erst nach deiner Bestätigung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={confirmPayment}
            disabled={loading !== null}
            className="flex items-center gap-1.5 flex-1 justify-center"
            style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#A07830", padding: "9px 16px", borderRadius: 9, boxShadow: "0 4px 12px rgba(160,120,48,0.2)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading === "confirm" ? (
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            ) : <Check size={13} weight="bold" />}
            Bestätigen
          </button>
          <button
            onClick={ignoreTransaction}
            disabled={loading !== null}
            className="flex items-center gap-1.5"
            style={{ fontSize: 12, fontWeight: 500, color: "#9CA3AF", padding: "9px 14px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <X size={13} />
            Ignorieren
          </button>
          <button
            onClick={() => onDismiss(task.id)}
            style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <X size={13} />
          </button>
        </div>
      </motion.div>
    )
  }

  // ── CREATE MAHNUNG CARD
  if (task.action_type === "create_mahnung") {
    const tage = payload.tage_ueberfaellig ?? 0
    const betrag = payload.betrag ?? 0
    const today = new Date().toISOString().split("T")[0]
    const mahnstufe = (payload.new_mahnstufe ?? (tage >= 28 ? 3 : tage >= 7 ? 2 : 1)) as 1 | 2 | 3
    const mahngebuehr = getMahngebuehr(mahnstufe)
    const verzugszinsen = calculateVerzugszinsen(betrag, new Date(Date.now() - tage * 86400000).toISOString().split("T")[0])
    const gesamt = betrag + mahngebuehr + verzugszinsen

    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: "white", border: "1px solid rgba(185,28,28,0.15)", borderRadius: 14, padding: 20 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(185,28,28,0.08)", border: "1px solid rgba(185,28,28,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Warning size={16} color="#B91C1C" />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 600, color: "#101418" }}>Mahnung empfohlen</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{task.title.replace("Mahnung empfohlen — ", "").replace(/^\d+\. Mahnung empfohlen$/, task.title)}</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(185,28,28,0.1)", color: "#B91C1C" }}>
            {tage} Tage überfällig
          </span>
        </div>

        <div style={{ background: "rgba(185,28,28,0.04)", border: "1px solid rgba(185,28,28,0.1)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
          <p style={{ fontSize: 9, color: "#B91C1C", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Vorgeschlagene Mahnung</p>
          <div className="flex items-center justify-between">
            <div>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: mahnstufe === 3 ? "rgba(185,28,28,0.15)" : "rgba(185,28,28,0.1)", color: "#B91C1C" }}>
                {mahnstufe}. Mahnung{mahnstufe === 3 ? " — Letzte" : ""}
              </span>
              <p style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
                Offener Betrag: {formatCurrency(betrag)}
                {mahngebuehr > 0 && ` + ${mahngebuehr.toFixed(2)}€ Gebühr`}
              </p>
            </div>
            <div style={{ textAlign: "right" as const }}>
              <p style={{ fontSize: 10, color: "#9CA3AF" }}>Gesamt</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#B91C1C" }}>{formatCurrency(gesamt)}</p>
            </div>
          </div>
          <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 8 }}>
            Zahlungsfrist: {new Date(getZahlungsfrist(today, mahnstufe)).toLocaleDateString("de-DE")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={createMahnung}
            disabled={loading !== null}
            className="flex items-center gap-1.5 flex-1 justify-center"
            style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#B91C1C", padding: "9px 16px", borderRadius: 9, boxShadow: "0 4px 12px rgba(185,28,28,0.2)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading === "mahnung" ? (
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            ) : <Warning size={13} />}
            Mahnung erstellen
          </button>
          <button
            onClick={() => router.push("/mahnwesen")}
            className="flex items-center gap-1.5"
            style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", padding: "9px 14px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <ArrowSquareOut size={13} />
            Mahnwesen
          </button>
        </div>
      </motion.div>
    )
  }

  // ── ZINSBINDUNG CARD
  if (task.action_type === "check_zinsbindung") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: "white", border: "1px solid rgba(160,120,48,0.2)", borderRadius: 14, padding: 20 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Warning size={16} color="#A07830" />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 600, color: "#101418" }}>{task.title}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{task.description}</p>
          </div>
        </div>
        <button
          onClick={() => router.push(payload.financing_id ? `/finanzen?financing_id=${payload.financing_id}` : "/finanzen")}
          className="flex items-center gap-1.5 w-full justify-center"
          style={{ fontSize: 13, fontWeight: 600, color: "#A07830", background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.2)", padding: "9px 16px", borderRadius: 9 }}
        >
          <ArrowSquareOut size={13} />
          Zinsbindung prüfen
        </button>
      </motion.div>
    )
  }

  // Fallback — should not render for generic tasks (those use simple rows)
  return null
}
