import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GoCardless (Nordigen) connect flow ───────────────────────────────────────
//
// Step 1: POST /api/banking/connect
//   Body: { institution_id: string, redirect_uri: string }
//   Creates a GoCardless requisition and returns a link for the user to
//   authenticate with their bank. The requisition_id is stored in bank_accounts.
//
// Required env vars (set in .env.local, never commit):
//   GOCARDLESS_SECRET_ID=...
//   GOCARDLESS_SECRET_KEY=...
//   NEXT_PUBLIC_APP_URL=https://your-domain.com
//
// GoCardless sandbox: https://bankaccountdata.gocardless.com/api/v2/
// Docs: https://developer.gocardless.com/bank-account-data/overview
// ─────────────────────────────────────────────────────────────────────────────

const GC_BASE = "https://bankaccountdata.gocardless.com/api/v2";

async function getGoCardlessToken(): Promise<string> {
  const secretId  = process.env.GOCARDLESS_SECRET_ID;
  const secretKey = process.env.GOCARDLESS_SECRET_KEY;
  if (!secretId || !secretKey) {
    throw new Error("GoCardless credentials not configured (GOCARDLESS_SECRET_ID / GOCARDLESS_SECRET_KEY)");
  }
  const res = await fetch(`${GC_BASE}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
  });
  if (!res.ok) throw new Error(`GoCardless token error: ${res.status}`);
  const data = await res.json();
  return data.access as string;
}

export async function POST(req: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: remove this guard once GoCardless env vars are set
  if (!process.env.GOCARDLESS_SECRET_ID) {
    return NextResponse.json(
      { error: "bank_not_configured", message: "GoCardless integration not yet configured." },
      { status: 503 }
    );
  }

  try {
    const { institution_id, property_id } = await req.json() as {
      institution_id: string;
      property_id?: string;
    };

    const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const redirectUri = `${appUrl}/api/banking/callback`;

    // 1. Get access token
    const token = await getGoCardlessToken();

    // 2. Create requisition (links user to institution)
    const reqRes = await fetch(`${GC_BASE}/requisitions/`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        redirect:       redirectUri,
        institution_id: institution_id,
        reference:      `imvestra-${user.id}-${Date.now()}`,
        user_language:  "DE",
      }),
    });
    if (!reqRes.ok) throw new Error(`GoCardless requisition error: ${reqRes.status}`);
    const requisition = await reqRes.json();

    // 3. Create pending bank_account record
    await supabase.from("bank_accounts").insert({
      user_id:          user.id,
      provider:         "gocardless",
      requisition_id:   requisition.id,
      institution_id:   institution_id,
      status:           "pending",
      property_id:      property_id ?? null,
    });

    return NextResponse.json({ link: requisition.link });
  } catch (err) {
    console.error("[banking/connect]", err);
    return NextResponse.json({ error: "connect_failed" }, { status: 500 });
  }
}
