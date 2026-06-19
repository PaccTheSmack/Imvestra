import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
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
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar userEmail={user?.email} />
          <main className="flex-1 overflow-y-auto bg-[#F8F7F4]">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </DashboardLayoutClient>
  );
}
