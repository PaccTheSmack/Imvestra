import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Sync transactions from GoCardless ───────────────────────────────────────
//
// POST /api/banking/sync
//   Body: { bank_account_id: string }
//   Fetches the last 90 days of transactions from GoCardless and upserts
//   them into bank_transactions. Runs auto-matching against rent_payments.
//
// Call this:
//   - On first connect (after callback)
//   - Manually via "Synchronisieren" button in UI
//   - Via a Vercel Cron job (once per day)
// ─────────────────────────────────────────────────────────────────────────────

const GC_BASE = "https://bankaccountdata.gocardless.com/api/v2";

async function getGoCardlessToken(): Promise<string> {
  const res = await fetch(`${GC_BASE}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret_id:  process.env.GOCARDLESS_SECRET_ID,
      secret_key: process.env.GOCARDLESS_SECRET_KEY,
    }),
  });
  const data = await res.json();
  return data.access as string;
}

// Simple heuristic: match transaction to a rent payment by amount + same month
function autoMatchPayment(
  amount: number,
  bookingDate: string,
  rentPayments: Array<{ id: string; amount: number; due_date: string; status: string }>
): { id: string; confidence: number } | null {
  const txMonth  = bookingDate.slice(0, 7); // "YYYY-MM"
  const positive = amount > 0;
  if (!positive) return null; // only match incoming money to rent

  const candidates = rentPayments.filter((p) => {
    const payMonth = p.due_date.slice(0, 7);
    const sameMonth = payMonth === txMonth;
    const closeAmount = Math.abs(p.amount - amount) < 10; // ±10€ tolerance
    return sameMonth && closeAmount && p.status !== "paid";
  });

  if (candidates.length === 1) {
    const diff = Math.abs(candidates[0].amount - amount);
    const confidence = diff === 0 ? 95 : diff < 5 ? 75 : 55;
    return { id: candidates[0].id, confidence };
  }
  return null;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GOCARDLESS_SECRET_ID) {
    return NextResponse.json(
      { error: "bank_not_configured" },
      { status: 503 }
    );
  }

  const { bank_account_id } = await req.json() as { bank_account_id: string };

  // Verify ownership
  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", bank_account_id)
    .eq("user_id", user.id)
    .single();

  if (!bankAccount || !bankAccount.external_id) {
    return NextResponse.json({ error: "Account not found or not active" }, { status: 404 });
  }

  try {
    const token = await getGoCardlessToken();

    // Fetch transactions (GoCardless returns last 90 days by default)
    const txRes = await fetch(
      `${GC_BASE}/accounts/${bankAccount.external_id}/transactions/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!txRes.ok) throw new Error(`GoCardless transactions error: ${txRes.status}`);
    const txData = await txRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const booked = (txData.transactions?.booked ?? []) as Array<Record<string, any>>;

    // Load existing rent payments for auto-matching
    const { data: rentPayments } = await supabase
      .from("rent_payments")
      .select("id, amount, due_date, status")
      .eq("user_id", user.id);

    // Upsert transactions
    let imported = 0;
    let matched  = 0;

    for (const tx of booked) {
      const amount  = parseFloat(tx.transactionAmount?.amount ?? "0");
      const extId   = tx.transactionId ?? tx.internalTransactionId;
      const booking = tx.bookingDate ?? tx.bookingDateTime?.slice(0, 10);
      const desc    = tx.remittanceInformationUnstructured ?? tx.additionalInformation;

      const autoMatch = autoMatchPayment(amount, booking, rentPayments ?? []);

      const { error: upsertErr } = await supabase
        .from("bank_transactions")
        .upsert(
          {
            user_id:             user.id,
            bank_account_id:     bank_account_id,
            external_id:         extId,
            booking_date:        booking,
            value_date:          tx.valueDate ?? booking,
            amount,
            currency:            tx.transactionAmount?.currency ?? "EUR",
            description:         desc ?? null,
            creditor_name:       tx.creditorName ?? null,
            debtor_name:         tx.debtorName ?? null,
            remittance_info:     tx.remittanceInformationStructured ?? null,
            matched_payment_id:  autoMatch?.id ?? null,
            match_status:        autoMatch ? "matched_rent" : "unmatched",
            match_confidence:    autoMatch?.confidence ?? null,
          },
          { onConflict: "bank_account_id,external_id", ignoreDuplicates: false }
        );

      if (!upsertErr) {
        imported++;
        if (autoMatch) matched++;
      }
    }

    // Update last_synced_at
    await supabase
      .from("bank_accounts")
      .update({ last_synced_at: new Date().toISOString(), status: "active", error_message: null })
      .eq("id", bank_account_id);

    return NextResponse.json({ imported, matched, total: booked.length });
  } catch (err) {
    console.error("[banking/sync]", err);
    await supabase
      .from("bank_accounts")
      .update({ status: "error", error_message: String(err) })
      .eq("id", bank_account_id);
    return NextResponse.json({ error: "sync_failed" }, { status: 500 });
  }
}
