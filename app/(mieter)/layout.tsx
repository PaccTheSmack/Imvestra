import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MieterSidebar from "@/components/mieter/MieterSidebar";

export default async function MieterPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "mieter") {
    redirect("/mieter/login");
  }

  let mieterName = "Mieter";
  let propertyName = "";

  try {
    const { data: mieterAccount } = await supabase
      .from("mieter_accounts")
      .select("mieter_name, tenant_id, property_id, tenants(name, property_id, properties(name))")
      .eq("supabase_user_id", user.id)
      .maybeSingle();

    if (mieterAccount) {
      mieterName = mieterAccount.mieter_name || mieterName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tenant = mieterAccount.tenants as any;
      if (tenant?.properties?.name) {
        propertyName = tenant.properties.name;
      }
    }
  } catch {
    // Table may not exist yet
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F0FDFB" }}>
      <MieterSidebar mieterName={mieterName} propertyName={propertyName} />
      <main
        style={{
          flex: 1,
          marginLeft: 240,
          padding: "32px 36px",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}
