import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MieterLoginForm from "@/components/mieter/MieterLoginForm";

export default async function MieterLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.user_metadata?.role === "mieter") {
    redirect("/mieter/dashboard");
  }

  return <MieterLoginForm />;
}
