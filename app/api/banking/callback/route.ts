import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GoCardless OAuth callback ────────────────────────────────────────────────
//
// After the user authenticates with their bank, GoCardless redirects here.
// Query params: ?ref=<reference>&error=<error_code>
//
// This route:
//   1. Looks up the bank_account by requisition reference
//   2. Fetches the GoCardless accounts linked to the requisition
//   3. Stores account details (IBAN, institution name, etc.)
//   4. Redirects to /finanzen with a success/error flag
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref   = searchParams.get("ref");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error || !ref) {
    return NextResponse.redirect(`${appUrl}/finanzen?bank_error=${error ?? "unknown"}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  try {
    const token = await getGoCardlessToken();

    // Find requisition by reference prefix
    const { data: accounts } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .ilike("requisition_id", `%${ref.split("-").slice(-1)[0]}%`)
      .limit(1);

    const bankAccount = accounts?.[0];
    if (!bankAccount) {
      return NextResponse.redirect(`${appUrl}/finanzen?bank_error=not_found`);
    }

    // Fetch requisition to get linked account IDs
    const reqRes = await fetch(
      `${GC_BASE}/requisitions/${bankAccount.requisition_id}/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const requisition = await reqRes.json();
    const [accountId] = requisition.accounts as string[];

    if (!accountId) {
      await supabase
        .from("bank_accounts")
        .update({ status: "error", error_message: "No accounts returned" })
        .eq("id", bankAccount.id);
      return NextResponse.redirect(`${appUrl}/finanzen?bank_error=no_accounts`);
    }

    // Fetch account details
    const detailRes = await fetch(
      `${GC_BASE}/accounts/${accountId}/details/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { account: detail } = await detailRes.json();

    // Update bank_account with real data
    await supabase
      .from("bank_accounts")
      .update({
        external_id:       accountId,
        iban:              detail.iban ?? null,
        account_name:      detail.name ?? null,
        currency:          detail.currency ?? "EUR",
        institution_name:  requisition.institution_id ?? null,
        status:            "active",
        last_synced_at:    new Date().toISOString(),
      })
      .eq("id", bankAccount.id);

    return NextResponse.redirect(`${appUrl}/finanzen?bank_connected=1`);
  } catch (err) {
    console.error("[banking/callback]", err);
    return NextResponse.redirect(`${appUrl}/finanzen?bank_error=callback_failed`);
  }
}
