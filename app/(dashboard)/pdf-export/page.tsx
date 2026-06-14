import { createClient } from "@/lib/supabase/server";
import PDFExportView from "@/components/dashboard/PDFExportView";
import type { Property, Plan } from "@/types";

export default async function PDFExportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: properties }, { data: profile }] = await Promise.all([
    supabase
      .from("properties")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", user!.id)
      .single(),
  ]);

  const plan = (profile?.plan ?? "free") as Plan;

  return (
    <PDFExportView
      properties={(properties ?? []) as Property[]}
      plan={plan}
    />
  );
}
