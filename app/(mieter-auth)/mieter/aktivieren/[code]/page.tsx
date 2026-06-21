import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import MieterAktivierenForm from "@/components/mieter/MieterAktivierenForm";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function MieterAktivierenPage({ params }: PageProps) {
  const { code } = await params;
  const adminClient = createAdminClient();

  const { data: mieterAccount } = await adminClient
    .from("mieter_accounts")
    .select("mieter_name, mieter_email")
    .eq("invitation_code", code)
    .is("activated_at", null)
    .maybeSingle();

  if (!mieterAccount) {
    notFound();
  }

  return (
    <MieterAktivierenForm
      mieterName={mieterAccount.mieter_name}
      mieterEmail={mieterAccount.mieter_email}
      code={code}
    />
  );
}
