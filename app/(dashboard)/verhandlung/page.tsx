import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VerhandlungView from "@/components/dashboard/VerhandlungView";
import type { Property } from "@/types";

export default async function VerhandlungPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <VerhandlungView properties={(properties ?? []) as Property[]} />;
}
