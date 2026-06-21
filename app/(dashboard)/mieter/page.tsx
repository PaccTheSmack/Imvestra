import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import MieterView from "@/components/dashboard/MieterView";
import type { Tenant, RentPayment } from "@/types";

export default async function MieterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: properties }, { data: tenants }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, name, type")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tenants")
      .select("*, rent_payments(*)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <Suspense fallback={null}>
      <MieterView
        tenants={(tenants ?? []) as (Tenant & { rent_payments: RentPayment[] })[]}
        properties={(properties ?? []) as { id: string; name: string; type: string }[]}
      />
    </Suspense>
  );
}
