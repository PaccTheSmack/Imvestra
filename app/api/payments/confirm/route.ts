import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { payment_id, transaction_id, task_id } = await request.json()

  const now = new Date().toISOString()

  const { error: paymentError } = await supabase
    .from("rent_payments")
    .update({
      status: "paid",
      paid_date: new Date().toISOString().split("T")[0],
      bank_transaction_id: transaction_id ?? null,
      confirmed_at: now,
      confirmed_by: user.id,
      booking_note: "Bestätigt via Imvestra",
    })
    .eq("id", payment_id)
    .eq("user_id", user.id)

  if (paymentError) {
    return NextResponse.json({ error: "Buchungsfehler" }, { status: 500 })
  }

  if (transaction_id) {
    await supabase
      .from("bank_transactions")
      .update({
        match_status: "confirmed",
        confirmed_payment_id: payment_id,
        confirmed_at: now,
        confirmed_by: user.id,
      })
      .eq("id", transaction_id)
  }

  if (task_id) {
    await supabase.from("tasks").update({ completed: true }).eq("id", task_id)
  }

  await supabase
    .from("mahnungen")
    .update({ status: "bezahlt" })
    .eq("rent_payment_id", payment_id)

  return NextResponse.json({ success: true })
}
