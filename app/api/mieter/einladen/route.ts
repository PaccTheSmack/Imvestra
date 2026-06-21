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

    const body = await request.json();
    const { tenant_id, email, name } = body as {
      tenant_id: string;
      email: string;
      name: string;
    };

    if (!tenant_id || !email || !name) {
      return NextResponse.json({ error: "tenant_id, email und name erforderlich" }, { status: 400 });
    }

    const invitation_code = crypto.randomUUID();

    const { error } = await supabase.from("mieter_accounts").insert({
      tenant_id,
      vermieter_id: user.id,
      mieter_email: email,
      mieter_name: name,
      invitation_code,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const activation_url = `/mieter/aktivieren/${invitation_code}`;

    return NextResponse.json({ success: true, invitation_code, activation_url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Interner Fehler" },
      { status: 500 }
    );
  }
}
