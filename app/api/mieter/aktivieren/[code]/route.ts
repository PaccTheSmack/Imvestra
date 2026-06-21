import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const { password } = (await request.json()) as { password: string };

    if (!password) {
      return NextResponse.json({ error: "Passwort erforderlich" }, { status: 400 });
    }

    // Use admin client throughout — this route is public (no logged-in user)
    // so anon client is blocked by RLS on mieter_accounts
    const adminClient = createAdminClient();

    const { data: account } = await adminClient
      .from("mieter_accounts")
      .select("id, mieter_email, mieter_name")
      .eq("invitation_code", code)
      .is("activated_at", null)
      .maybeSingle();

    if (!account) {
      return NextResponse.json(
        { error: "Einladungscode ungültig oder bereits verwendet" },
        { status: 404 }
      );
    }

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: account.mieter_email,
        password,
        user_metadata: {
          role: "mieter",
          mieter_account_id: account.id,
          name: account.mieter_name,
        },
        email_confirm: true,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? "Benutzer konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    const { error: updateError } = await adminClient
      .from("mieter_accounts")
      .update({
        supabase_user_id: authData.user.id,
        activated_at: new Date().toISOString(),
      })
      .eq("id", account.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Interner Fehler" },
      { status: 500 }
    );
  }
}
