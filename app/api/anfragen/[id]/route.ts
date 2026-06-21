import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, antwort } = body as { status: string; antwort?: string };

    if (!status) {
      return NextResponse.json({ error: "status erforderlich" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = { status };
    if (antwort !== undefined) {
      updatePayload.antwort = antwort;
      updatePayload.answered_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("mieter_anfragen")
      .update(updatePayload)
      .eq("id", id)
      .eq("vermieter_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Anfrage nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Interner Fehler" },
      { status: 500 }
    );
  }
}
