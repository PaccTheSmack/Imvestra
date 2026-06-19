import Sidebar from "@/components/layout/Sidebar";
import PageTransition from "@/components/layout/PageTransition";
import DashboardLayoutClient from "@/components/layout/DashboardLayoutClient";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <DashboardLayoutClient>
      <div className="flex min-h-screen bg-[#F8F7F4]">
        <Sidebar userEmail={user?.email} />
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#F8F7F4]">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </DashboardLayoutClient>
  );
}
