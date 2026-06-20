"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  HouseLine, Calculator, MapPin, FilePdf, Buildings,
  UsersFour, CheckSquare, Receipt, Tag, SignOut,
  MagnifyingGlass, Gear, ChartBar, FolderOpen, Warning, FileText,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth-actions";

type NavItem = { Icon: PhosphorIcon; label: string; href: string; badge?: string };
type NavSection = { section?: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    items: [
      { Icon: HouseLine, label: "Übersicht", href: "/dashboard" },
    ],
  },
  {
    section: "VERWALTUNG",
    items: [
      { Icon: Buildings,   label: "Portfolio",  href: "/portfolio" },
      { Icon: UsersFour,   label: "Mieter",     href: "/mieter" },
      { Icon: FileText,    label: "Mietverträge", href: "/mietvertraege" },
      { Icon: Warning,     label: "Mahnwesen",  href: "/mahnwesen" },
      { Icon: ChartBar,    label: "Finanzen",         href: "/finanzen" },
      { Icon: Receipt,     label: "Nebenkostenabr.", href: "/nebenkostenabrechnung" },
      { Icon: FolderOpen,  label: "Dokumente",        href: "/dokumente" },
      { Icon: CheckSquare, label: "Aufgaben",   href: "/aufgaben" },
      { Icon: Receipt,     label: "Steuern",    href: "/steuern" },
    ],
  },
  {
    section: "ANALYSE",
    items: [
      { Icon: Calculator, label: "Renditerechner",   href: "/calculator" },
      { Icon: Tag,        label: "Verhandlung",       href: "/verhandlung" },
      { Icon: MapPin,     label: "Standortanalyse",   href: "/standort" },
      { Icon: FilePdf,    label: "PDF Export",        href: "/pdf-export" },
    ],
  },
  {
    section: "KONTO",
    items: [
      { Icon: Gear, label: "Einstellungen", href: "/settings" },
    ],
  },
];

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function NavLink({ Icon, label, href, taskCount, active }: NavItem & { taskCount?: number; active: boolean }) {
  const isAufgaben = href === "/aufgaben";
  const showBadge = isAufgaben && (taskCount ?? 0) > 0;

  return (
    <Link href={href} className="block mb-0.5">
      <div className="relative">
        {/* Active left bar */}
        {active && (
          <motion.div
            layoutId="nav-active-bar"
            className="absolute left-[-12px] rounded-[0_3px_3px_0]"
            style={{ top: "20%", bottom: "20%", width: 4, background: "#A07830" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
        )}
        <motion.div
          className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] cursor-pointer"
          animate={{
            backgroundColor: active ? "#A07830" : "rgba(0,0,0,0)",
            color: active ? "#FFFFFF" : "#6B7280",
          }}
          whileHover={active ? { backgroundColor: "#A07830" } : { backgroundColor: "rgba(0,0,0,0.04)", color: "#101418" }}
          transition={{ duration: 0.12 }}
        >
          <Icon size={16} weight={active ? "bold" : "regular"} color={active ? "#FFFFFF" : "#9CA3AF"} className="flex-shrink-0" />
          <span className="text-[14px] flex-1 font-medium leading-none" style={{ fontWeight: active ? 600 : 400 }}>
            {label}
          </span>
          {showBadge && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full leading-none flex-shrink-0 tabular-nums"
              style={active
                ? { background: "rgba(255,255,255,0.2)", color: "white" }
                : { background: "rgba(185,28,28,0.1)", color: "#B91C1C" }
              }
            >
              {taskCount}
            </span>
          )}
        </motion.div>
      </div>
    </Link>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const [openTaskCount, setOpenTaskCount] = useState(0);

  const openPalette = () => document.dispatchEvent(new CustomEvent("imvestra:palette:open"));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", false)
        .then(({ count }) => setOpenTaskCount(count ?? 0));
    });
  }, []);

  return (
    <aside
      className="w-[272px] h-screen sticky top-0 flex flex-col flex-shrink-0 overflow-hidden"
      style={{
        background: "#FFFFFF",
        borderRight: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo */}
      <div className="px-2 pt-6 pb-3 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/imvestra-logo-horizontal.svg"
          alt="Imvestra"
          className="w-full h-auto"
          draggable={false}
        />
      </div>

      {/* Search */}
      <div className="px-4 pb-5 flex-shrink-0">
        <button
          onClick={openPalette}
          aria-label="Suche (⌘K)"
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] transition-all duration-150"
          style={{ background: "#F5F5F5" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#EFEFEF"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
        >
          <MagnifyingGlass size={14} color="#9CA3AF" className="flex-shrink-0" />
          <span className="text-[13px] flex-1 text-left" style={{ color: "#9CA3AF" }}>Suchen...</span>
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded-[4px] leading-none ml-auto"
            style={{ background: "white", color: "#9CA3AF", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto py-1 space-y-0.5">
        {navSections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-5" : ""}>
            {section.section && (
              <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "#9CA3AF" }}>
                {section.section}
              </p>
            )}
            {section.items.map(item => (
              <NavLink
                key={item.href}
                {...item}
                taskCount={item.href === "/aufgaben" ? openTaskCount : 0}
                active={isActive(item.href, pathname)}
              />
            ))}
          </div>
        ))}

        {/* Sign out separate */}
        <div className="mt-1">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all duration-150 mb-0.5"
            style={{ color: "#6B7280" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,28,28,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#B91C1C"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; }}
          >
            <SignOut size={16} color="currentColor" className="flex-shrink-0" />
            <span className="text-[14px]">Abmelden</span>
          </button>
        </div>
      </nav>

      {/* Promo card */}
      <div className="px-4 pb-6 flex-shrink-0">
        <div
          className="rounded-[14px] p-5"
          style={{ background: "linear-gradient(135deg, #18160E 0%, #A07830 100%)" }}
        >
          <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            Aktueller Plan
          </p>
          <p className="text-[13px] font-semibold leading-snug mb-3" style={{ color: "white" }}>
            Upgrade für unbegrenzte Objekte & PDF-Export
          </p>
          <Link
            href="/settings"
            className="block w-full text-center text-[12px] font-bold py-2 rounded-[8px] transition-all duration-150"
            style={{ background: "white", color: "#A07830" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#F5F5F5"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "white"; }}
          >
            Jetzt upgraden →
          </Link>
        </div>
      </div>
    </aside>
  );
}
