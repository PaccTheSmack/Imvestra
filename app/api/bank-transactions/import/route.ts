import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { matchTransaction } from "@/lib/payment-matching"
import type { ParsedTransaction } from "@/lib/csv-import"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { transactions } = await request.json() as { transactions: ParsedTransaction[] }
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return NextResponse.json({ error: "No transactions" }, { status: 400 })
  }

  // Load tenants + pending payments for matching
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, rent_payments(id, amount, due_date, status)")
    .eq("user_id", user.id)

  const rows = transactions.map((tx) => {
    const match = matchTransaction(
      {
        betrag: tx.betrag,
        verwendungszweck: tx.verwendungszweck,
        auftraggeber_name: tx.auftraggeber_name,
        transaction_date: tx.transaction_date,
      },
      (tenants ?? []) as Parameters<typeof matchTransaction>[1]
    )

    return {
      user_id: user.id,
      transaction_date: tx.transaction_date,
      booking_date: tx.booking_date ?? tx.transaction_date,
      betrag: tx.betrag,
      waehrung: tx.waehrung ?? "EUR",
      verwendungszweck: tx.verwendungszweck,
      auftraggeber_name: tx.auftraggeber_name,
      auftraggeber_iban: tx.auftraggeber_iban ?? null,
      bank_account_iban: tx.bank_account_iban ?? null,
      source: "csv_import" as const,
      match_status: match.confidence >= 0.5 ? "suggested" : "unmatched",
      suggested_tenant_id: match.tenant_id,
      suggested_payment_id: match.payment_id,
      match_confidence: match.confidence,
      match_reason: match.reason,
    }
  })

  const { data, error } = await supabase
    .from("bank_transactions")
    .insert(rows)
    .select("id")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ count: data?.length ?? 0, success: true })
}
