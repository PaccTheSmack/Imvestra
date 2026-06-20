export interface MatchResult {
  tenant_id: string | null
  payment_id: string | null
  confidence: number
  reason: string
}

interface RentPaymentLike {
  id: string
  amount: number
  due_date: string
  status: string
}

interface TenantWithPayments {
  id: string
  name: string
  rent_payments: RentPaymentLike[]
}

export function matchTransaction(
  transaction: {
    betrag: number
    verwendungszweck: string
    auftraggeber_name: string
    transaction_date: string
  },
  tenants: TenantWithPayments[],
): MatchResult {
  let bestMatch: MatchResult = {
    tenant_id: null,
    payment_id: null,
    confidence: 0,
    reason: "Kein Match gefunden",
  }

  for (const tenant of tenants) {
    let score = 0
    const reasons: string[] = []

    const nameParts = tenant.name.toLowerCase().split(" ")
    const verwendung = transaction.verwendungszweck.toLowerCase()
    const auftraggeberLower = transaction.auftraggeber_name.toLowerCase()

    const nameMatchVerwend = nameParts.some(p => p.length > 2 && verwendung.includes(p))
    const nameMatchAuftr = nameParts.some(p => p.length > 2 && auftraggeberLower.includes(p))

    if (nameMatchVerwend) { score += 0.4; reasons.push("Name in Verwendungszweck") }
    if (nameMatchAuftr)   { score += 0.3; reasons.push("Name des Auftraggebers") }

    const pendingPayments = tenant.rent_payments.filter(p =>
      p.status === "pending" && Math.abs(p.amount - transaction.betrag) < 0.01
    )

    if (pendingPayments.length === 1) {
      score += 0.4
      reasons.push("Betrag exakt")
      const txDate = new Date(transaction.transaction_date)
      const dueDate = new Date(pendingPayments[0].due_date)
      const daysDiff = Math.abs((txDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff <= 10) {
        score += 0.2
        reasons.push(`Datum passt (${Math.round(daysDiff)} Tage)`)
      }
      if (score > bestMatch.confidence) {
        bestMatch = {
          tenant_id: tenant.id,
          payment_id: pendingPayments[0].id,
          confidence: Math.min(1, score),
          reason: reasons.join(" · "),
        }
      }
    } else if (pendingPayments.length > 1) {
      score += 0.2
      reasons.push("Betrag passt (mehrere offen)")
      if (score > bestMatch.confidence) {
        bestMatch = {
          tenant_id: tenant.id,
          payment_id: pendingPayments[0].id,
          confidence: Math.min(1, score),
          reason: reasons.join(" · "),
        }
      }
    }
  }

  return bestMatch
}

export function getConfidenceLabel(confidence: number): {
  label: string
  color: string
  bg: string
} {
  if (confidence >= 0.8) return { label: "Hohe Übereinstimmung", color: "#2D6A2D", bg: "rgba(45,106,45,0.08)" }
  if (confidence >= 0.5) return { label: "Mittlere Übereinstimmung", color: "#A07830", bg: "rgba(160,120,48,0.08)" }
  return { label: "Niedrige Übereinstimmung", color: "#B91C1C", bg: "rgba(185,28,28,0.08)" }
}
