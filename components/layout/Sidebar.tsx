"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth-actions";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { tokens } from "@/lib/tokens";

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

const navSections: NavSection[] = [
  {
    items: [
      { Icon: HouseLine, label: "Übersicht", href: "/dashboard" },
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
];

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

interface SidebarProps {
  userEmail?: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname       = usePathname();
  const prefersReduced = useReducedMotion();
  const avatarLetter   = userEmail ? userEmail[0].toUpperCase() : "?";
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapsed state, but init after mount to avoid hydration mismatch
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // Cmd+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.getElementById("sidebar-search-btn")?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

  const spring = prefersReduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 280, damping: 28 };

  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 220 }}
      transition={spring}
      className="flex-shrink-0 h-screen sticky top-0 flex flex-col overflow-hidden"
      style={{
        background: "#0C0C0C",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo + collapse toggle */}
      <div className="h-[68px] px-4 flex items-center justify-between flex-shrink-0">
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-shrink-0"
            >
              <Image src="/logo.svg" alt="Imvestra" width={100} height={26} />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-6 h-6 rounded-[6px] flex items-center justify-center flex-shrink-0 transition-colors duration-150"
          style={{ color: "#555" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#1A1A1A";
            (e.currentTarget as HTMLButtonElement).style.color = "#888";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "#555";
          }}
          aria-label={collapsed ? "Sidebar aufklappen" : "Sidebar einklappen"}
        >
          {collapsed ? <CaretRight size={12} /> : <CaretLeft size={12} />}
        </button>
      </div>

      {/* Cmd+K search trigger */}
      <div className="px-3 pb-3 flex-shrink-0">
        <button
          id="sidebar-search-btn"
          className="w-full flex items-center gap-2 rounded-[8px] transition-colors duration-150"
          style={{
            padding: collapsed ? "7px 0" : "7px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            background: "#141414",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "#555",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
            (e.currentTarget as HTMLButtonElement).style.color = "#777";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLButtonElement).style.color = "#555";
          }}
          title={collapsed ? "Suchen (⌘K)" : undefined}
          aria-label="Suche (⌘K)"
        >
          <MagnifyingGlass size={13} className="flex-shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="search-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-[11px] flex-1 text-left whitespace-nowrap overflow-hidden"
              >
                Suchen...
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="kbd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-[10px] px-1 py-0.5 rounded flex-shrink-0"
                style={{ background: "#1A1A1A", color: "#444", fontFamily: "monospace" }}
              >
                ⌘K
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto py-1">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.section && (
              <div style={{ height: collapsed ? 12 : "auto" }}>
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.p
                      key="section-label"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="px-3 pt-4 pb-1.5 text-[9px] font-semibold uppercase whitespace-nowrap overflow-hidden"
                      style={{ color: "#555", letterSpacing: "0.12em" }}
                    >
                      {section.section}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}

            {section.items.map(({ Icon, label, href, badge }) => {
              const active         = isActive(href, pathname);
              const isAufgaben     = href === "/aufgaben";
              const taskBadgeCount = isAufgaben ? openTaskCount : 0;

              return (
                <Link
                  key={href}
                  href={href}
                  className="block mb-0.5"
                  title={collapsed ? label : undefined}
                >
                  <motion.div
                    className="relative flex items-center gap-3 py-2 rounded-[8px] text-sm transition-colors duration-150 border"
                    style={{
                      padding: collapsed ? "8px 0" : "8px 12px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      ...(active ? {
                        color: tokens.color.accent,
                        fontWeight: 500,
                        background: tokens.color.accentSubtle,
                        borderColor: "rgba(0,224,215,0.12)",
                      } : {
                        color: "#777",
                        background: "transparent",
                        borderColor: "transparent",
                      }),
                    }}
                    whileHover={active || prefersReduced || collapsed ? {} : { x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLDivElement).style.color = "#888";
                        (e.currentTarget as HTMLDivElement).style.background = "#141414";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLDivElement).style.color = "#777";
                        (e.currentTarget as HTMLDivElement).style.background = "transparent";
                      }
                    }}
                  >
                    <Icon size={16} color={active ? tokens.color.accent : "#666"} className="flex-shrink-0" />

                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.12 }}
                          className="flex-1 whitespace-nowrap overflow-hidden"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Static badge (NEU etc.) – only expanded */}
                    {badge && !isAufgaben && !collapsed && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0"
                        style={badge === "NEU"
                          ? { background: tokens.color.accentSubtle, color: tokens.color.accent }
                          : { background: "#1A1A1A", color: "#555" }
                        }
                      >
                        {badge}
                      </span>
                    )}

                    {/* Task count – expanded: full badge; collapsed: dot */}
                    {isAufgaben && taskBadgeCount > 0 && (
                      collapsed ? (
                        <span
                          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                          style={{ background: "#FF4444" }}
                        />
                      ) : (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0"
                          style={{ background: "rgba(255,68,68,0.1)", color: "#FF4444" }}
                        >
                          {taskBadgeCount}
                        </span>
                      )
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom – user info */}
      <div
        className="px-3 pb-5 pt-4 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="flex items-center gap-3"
          style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          title={collapsed ? (userEmail ?? "") : undefined}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
            style={{
              background: "rgba(0,224,215,0.1)",
              border: "1px solid rgba(0,224,215,0.15)",
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
                transition={{ duration: 0.15 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="text-[10px] truncate" style={{ color: "#666", maxWidth: 120 }}>
                  {userEmail ?? ""}
                </p>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 text-[9px] mt-0.5 transition-colors duration-150 whitespace-nowrap"
                  style={{ color: "#666" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#FF4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
                >
                  <SignOut size={10} />
                  Abmelden
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
