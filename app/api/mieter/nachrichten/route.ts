import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isMieter = user.user_metadata?.role === "mieter";
    if (!isMieter) {
      return NextResponse.json({ error: "Nur für Mieter" }, { status: 403 });
    }

    const { data: mieterAccount, error: accountError } = await supabase
      .from("mieter_accounts")
      .select("id")
      .eq("supabase_user_id", user.id)
      .maybeSingle();

    if (accountError || !mieterAccount) {
      return NextResponse.json({ error: "Mieterkonto nicht gefunden" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("mieter_nachrichten")
      .select("*")
      .eq("mieter_account_id", mieterAccount.id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Interner Fehler" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isMieter = user.user_metadata?.role === "mieter";
    if (!isMieter) {
      return NextResponse.json({ error: "Nur für Mieter" }, { status: 403 });
    }

    const { data: mieterAccount, error: accountError } = await supabase
      .from("mieter_accounts")
      .select("id, tenant_id, vermieter_id")
      .eq("supabase_user_id", user.id)
      .maybeSingle();

    if (accountError || !mieterAccount) {
      return NextResponse.json({ error: "Mieterkonto nicht gefunden" }, { status: 404 });
    }

    const body = await request.json();
    const { text } = body as { text: string };

    if (!text?.trim()) {
      return NextResponse.json({ error: "text erforderlich" }, { status: 400 });
    }

    const { error } = await supabase.from("mieter_nachrichten").insert({
      mieter_account_id: mieterAccount.id,
      tenant_id: mieterAccount.tenant_id,
      vermieter_id: mieterAccount.vermieter_id,
      text: text.trim(),
      sender: "mieter",
      gelesen_vermieter: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Interner Fehler" },
      { status: 500 }
    );
  }
}
