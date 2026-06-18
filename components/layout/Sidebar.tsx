"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth-actions";
import { motion, AnimatePresence } from "motion/react";
import {
  HouseLine,
  Calculator,
  MapPin,
  FilePdf,
  Buildings,
  UsersFour,
  Bank,
  CheckSquare,
  Receipt,
  Tag,
  SignOut,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Gear,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { tokens } from "@/lib/tokens";

// ─── Types ───────────────────────────────────────────────────────────────────

type NavItem = {
  Icon: PhosphorIcon;
  label: string;
  href: string;
  badge?: string;
};

type NavSection = {
  section?: string;
  items: NavItem[];
};

// ─── Nav config — VERWALTUNG first, ANALYSE second ───────────────────────────

const navSections: NavSection[] = [
  {
    items: [
      { Icon: HouseLine, label: "Übersicht", href: "/dashboard" },
    ],
  },
  {
    section: "VERWALTUNG",
    items: [
      { Icon: Buildings,   label: "Portfolio", href: "/portfolio" },
      { Icon: UsersFour,   label: "Mieter",    href: "/mieter" },
      { Icon: Bank,        label: "Finanzen",  href: "/finanzen" },
      { Icon: CheckSquare, label: "Aufgaben",  href: "/aufgaben" },
      { Icon: Receipt,     label: "Steuern",   href: "/steuern" },
    ],
  },
  {
    section: "ANALYSE",
    items: [
      { Icon: Calculator, label: "Rechner",     href: "/calculator" },
      { Icon: Tag,        label: "Verhandlung", href: "/verhandlung" },
      { Icon: MapPin,     label: "Standort",    href: "/standort" },
      { Icon: FilePdf,    label: "PDF Export",  href: "/pdf-export" },
    ],
  },
];

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

// ─── NavItem Component ────────────────────────────────────────────────────────

function NavLink({
  Icon,
  label,
  href,
  badge,
  taskCount,
  collapsed,
  active,
}: NavItem & { taskCount?: number; collapsed: boolean; active: boolean }) {
  const isAufgaben = href === "/aufgaben";
  const showBadge = isAufgaben && (taskCount ?? 0) > 0;

  return (
    <Link href={href} className="block mb-[2px]" title={collapsed ? label : undefined}>
      <div
        className="relative flex items-center rounded-[7px] transition-all duration-100 group"
        style={{
          padding: collapsed ? "7px 0" : "7px 10px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 10,
          background: active ? "rgba(0,224,215,0.05)" : "transparent",
          color: active ? tokens.color.accent : tokens.color.textSubtle,
        }}
      >
        {/* Left accent bar */}
        {active && (
          <div
            className="absolute left-0 top-[5px] bottom-[5px] w-[2px] rounded-full"
            style={{ background: tokens.color.accent }}
          />
        )}

        {/* Icon */}
        <Icon
          size={15}
          weight={active ? "bold" : "regular"}
          color={active ? tokens.color.accent : "#575757"}
          className="flex-shrink-0 transition-colors duration-100"
        />

        {/* Label */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="label"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.14 }}
              className="text-[13px] flex-1 whitespace-nowrap overflow-hidden leading-none"
              style={{ fontWeight: active ? 500 : 400 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Static badge (NEU) */}
        {badge && !isAufgaben && !collapsed && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0"
            style={{ background: "rgba(0,224,215,0.1)", color: tokens.color.accent }}
          >
            {badge}
          </span>
        )}

        {/* Task badge */}
        {showBadge && (
          collapsed ? (
            <span
              className="absolute top-[5px] right-[5px] w-[5px] h-[5px] rounded-full"
              style={{ background: tokens.color.danger }}
            />
          ) : (
            !collapsed && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0 tabular-nums"
                style={{ background: "rgba(255,68,68,0.1)", color: tokens.color.danger }}
              >
                {taskCount}
              </span>
            )
          )
        )}

        {/* Hover bg overlay — CSS only, no inline JS */}
        {!active && (
          <div
            className="absolute inset-0 rounded-[7px] opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
        )}
      </div>
    </Link>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  userEmail?: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname       = usePathname();
  const avatarLetter   = userEmail ? userEmail[0].toUpperCase() : "?";
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const openPalette = () =>
    document.dispatchEvent(new CustomEvent("imvestra:palette:open"));

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
    <motion.aside
      animate={{ width: collapsed ? 56 : 216 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex-shrink-0 h-screen sticky top-0 flex flex-col overflow-hidden"
      style={{
        background: "#0A0A0A",
        borderRight: `1px solid ${tokens.color.border}`,
      }}
    >
      {/* ── Logo + collapse ── */}
      <div
        className="h-[60px] flex items-center flex-shrink-0 px-4"
        style={{ borderBottom: `1px solid ${tokens.color.border}` }}
      >
        <div className="flex items-center justify-between w-full">
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Image src="/logo.svg" alt="Imvestra" width={96} height={22} priority />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center flex-shrink-0 transition-colors duration-100 hover:bg-[#1A1A1A]"
            style={{ color: "#404040", marginLeft: collapsed ? "auto" : 0, marginRight: collapsed ? "auto" : 0 }}
            aria-label={collapsed ? "Sidebar aufklappen" : "Sidebar einklappen"}
          >
            {collapsed
              ? <CaretRight size={11} />
              : <CaretLeft size={11} />
            }
          </button>
        </div>
      </div>

      {/* ── Search / ⌘K ── */}
      <div className="px-3 py-3 flex-shrink-0">
        <button
          onClick={openPalette}
          aria-label="Suche (⌘K)"
          title={collapsed ? "Suchen (⌘K)" : undefined}
          className="w-full flex items-center rounded-[7px] transition-colors duration-100 hover:border-[rgba(255,255,255,0.1)]"
          style={{
            padding: collapsed ? "7px 0" : "7px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : 8,
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            color: "#444",
          }}
        >
          <MagnifyingGlass size={13} className="flex-shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="search-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-[12px] flex-1 text-left whitespace-nowrap"
              >
                Suchen...
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.kbd
                key="kbd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-[10px] px-1.5 py-0.5 rounded-[4px] flex-shrink-0 leading-none"
                style={{
                  background: "#1A1A1A",
                  color: "#3A3A3A",
                  fontFamily: "var(--font-mono)",
                  border: "1px solid #222",
                }}
              >
                ⌘K
              </motion.kbd>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 overflow-y-auto overflow-x-hidden py-1 space-y-[2px]">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.section && (
              <div style={{ height: collapsed ? 12 : "auto", overflow: "hidden" }}>
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.p
                      key={`section-${si}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="px-[10px] pt-5 pb-2 text-[9px] font-semibold uppercase tracking-[0.13em] whitespace-nowrap"
                      style={{ color: "#383838" }}
                    >
                      {section.section}
                    </motion.p>
                  )}
                </AnimatePresence>
                {collapsed && si > 0 && (
                  <div
                    className="mx-auto my-3"
                    style={{ width: 20, height: 1, background: "rgba(255,255,255,0.05)" }}
                  />
                )}
              </div>
            )}

            {section.items.map(item => (
              <NavLink
                key={item.href}
                {...item}
                taskCount={item.href === "/aufgaben" ? openTaskCount : 0}
                collapsed={collapsed}
                active={isActive(item.href, pathname)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: `1px solid ${tokens.color.border}` }}
      >
        {/* Settings link */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="mb-2"
            >
              <Link
                href="/settings"
                className="flex items-center gap-2.5 px-[10px] py-[7px] rounded-[7px] transition-colors duration-100 hover:bg-[rgba(255,255,255,0.03)] group"
                style={{ color: "#444" }}
              >
                <Gear size={14} className="flex-shrink-0" />
                <span className="text-[12px]">Einstellungen</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User row */}
        <div
          className="flex items-center rounded-[7px] px-[10px] py-[7px] transition-colors duration-100 hover:bg-[rgba(255,255,255,0.03)] group cursor-default"
          style={{
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : 10,
          }}
          title={collapsed ? (userEmail ?? "") : undefined}
        >
          {/* Avatar */}
          <div
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold leading-none"
            style={{
              background: "rgba(0,224,215,0.08)",
              border: `1px solid rgba(0,224,215,0.14)`,
              color: tokens.color.accent,
            }}
          >
            {avatarLetter}
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="user-info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <p
                  className="text-[11px] truncate leading-tight"
                  style={{ color: "#444", maxWidth: 120 }}
                >
                  {userEmail ?? ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.button
                key="signout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                onClick={() => signOut()}
                className="flex-shrink-0 p-1 rounded-[5px] transition-colors duration-100 hover:bg-[rgba(255,68,68,0.08)]"
                style={{ color: "#383838" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = tokens.color.danger }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#383838" }}
                title="Abmelden"
                aria-label="Abmelden"
              >
                <SignOut size={13} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
