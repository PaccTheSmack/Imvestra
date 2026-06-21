import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { kategorie, titel, beschreibung } = body as {
      kategorie: string;
      titel: string;
      beschreibung: string;
    };

    if (!kategorie || !titel || !beschreibung) {
      return NextResponse.json(
        { error: "kategorie, titel und beschreibung erforderlich" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("mieter_anfragen").insert({
      mieter_account_id: mieterAccount.id,
      tenant_id: mieterAccount.tenant_id,
      vermieter_id: mieterAccount.vermieter_id,
      kategorie,
      titel,
      beschreibung,
      status: "offen",
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
