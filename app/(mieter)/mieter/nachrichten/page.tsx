import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NachrichtenThread from "./NachrichtenThread";

export default async function NachrichtenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "mieter") {
    redirect("/mieter/login");
  }

  const { data: mieterAccount } = await supabase
    .from("mieter_accounts")
    .select("id")
    .eq("supabase_user_id", user.id)
    .maybeSingle();

  const mieterAccountId = mieterAccount?.id ?? null;

  const { data: nachrichten } = mieterAccountId
    ? await supabase
        .from("mieter_nachrichten")
        .select("*")
        .eq("mieter_account_id", mieterAccountId)
        .order("created_at", { ascending: true })
    : { data: [] };

  return (
    <div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#111827",
          letterSpacing: "-0.4px",
          marginBottom: 24,
        }}
      >
        Nachrichten
      </h1>

      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 14,
          overflow: "hidden",
          maxWidth: 680,
        }}
      >
        <NachrichtenThread messages={nachrichten ?? []} />
      </div>
    </div>
  );
}
