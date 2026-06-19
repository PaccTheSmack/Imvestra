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
      <motion.div
        className="relative flex items-center rounded-[8px] cursor-pointer"
        style={{
          padding: collapsed ? "7px 0" : "7px 10px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 10,
          background: active ? "rgba(201,168,106,0.1)" : "transparent",
          border: active ? "1px solid rgba(201,168,106,0.15)" : "1px solid transparent",
          color: active ? "#C9A86A" : "#4A3A2A",
        }}
        whileHover={active ? {} : { backgroundColor: "rgba(255,255,255,0.04)" }}
        transition={{ duration: 0.15 }}
      >
        {/* Active indicator pill */}
        {active && (
          <motion.div
            layoutId="sidebar-active-bar"
            className="absolute left-0 top-[5px] bottom-[5px] w-[2px] rounded-full"
            style={{ background: "#C9A86A" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
        )}

        <Icon
          size={15}
          weight={active ? "bold" : "regular"}
          color={active ? "#C9A86A" : "#4A3A2A"}
          className="flex-shrink-0 transition-colors duration-150"
        />

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="label"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.14 }}
              className="text-[13px] flex-1 whitespace-nowrap overflow-hidden leading-none"
              style={{
                fontWeight: active ? 500 : 400,
                color: active ? "#C9A86A" : "#6A5A4A",
              }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {badge && !isAufgaben && !collapsed && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0"
            style={{ background: "rgba(160,120,48,0.15)", color: "#C9A86A" }}
          >
            {badge}
          </span>
        )}

        {showBadge && !collapsed && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0 tabular-nums"
            style={{ background: "rgba(185,28,28,0.15)", color: "#EF4444" }}
          >
            {taskCount}
          </span>
        )}

        {showBadge && collapsed && (
          <span
            className="absolute top-[5px] right-[5px] w-[5px] h-[5px] rounded-full"
            style={{ background: "#EF4444" }}
          />
        )}
      </motion.div>
    </Link>
  );
}

interface SidebarProps {
  userEmail?: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname     = usePathname();
  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : "?";
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
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex-shrink-0 h-screen sticky top-0 flex flex-col overflow-hidden"
      style={{
        background: "#18160E",
        borderRight: "1px solid rgba(201,168,106,0.08)",
      }}
    >
      {/* Logo + collapse */}
      <div
        className="h-[60px] flex items-center flex-shrink-0 px-4"
        style={{ borderBottom: "1px solid rgba(201,168,106,0.08)" }}
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
                <Image
                  src="/logo.svg"
                  alt="Imvestra"
                  width={96}
                  height={22}
                  priority
                  style={{
                    filter: "brightness(0) saturate(100%) invert(75%) sepia(40%) saturate(600%) hue-rotate(15deg) brightness(90%)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center flex-shrink-0 transition-colors duration-150"
            style={{
              color: "#4A3A2A",
              marginLeft: collapsed ? "auto" : 0,
              marginRight: collapsed ? "auto" : 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,106,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#C9A86A"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#4A3A2A"; }}
            aria-label={collapsed ? "Sidebar aufklappen" : "Sidebar einklappen"}
          >
            {collapsed ? <CaretRight size={11} /> : <CaretLeft size={11} />}
          </button>
        </div>
      </div>

      {/* Search / ⌘K */}
      <div className="px-3 py-3 flex-shrink-0">
        <button
          onClick={openPalette}
          aria-label="Suche (⌘K)"
          title={collapsed ? "Suchen (⌘K)" : undefined}
          className="w-full flex items-center rounded-[7px] transition-all duration-150"
          style={{
            padding: collapsed ? "7px 0" : "7px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(201,168,106,0.08)",
            color: "#4A3A2A",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,106,0.2)"; (e.currentTarget as HTMLButtonElement).style.color = "#6A5A3A"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,106,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#4A3A2A"; }}
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
                style={{ color: "#4A3A2A" }}
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
                  background: "rgba(201,168,106,0.06)",
                  color: "#6A5A3A",
                  border: "1px solid rgba(201,168,106,0.1)",
                }}
              >
                ⌘K
              </motion.kbd>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Nav */}
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
                      className="px-[10px] pt-5 pb-2 text-[9px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap"
                      style={{ color: "#2E2618" }}
                    >
                      {section.section}
                    </motion.p>
                  )}
                </AnimatePresence>
                {collapsed && si > 0 && (
                  <div
                    className="mx-auto my-3"
                    style={{ width: 20, height: 1, background: "rgba(201,168,106,0.08)" }}
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

      {/* Bottom */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: "1px solid rgba(201,168,106,0.08)" }}
      >
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
                className="flex items-center gap-2.5 px-[10px] py-[7px] rounded-[7px] transition-colors duration-150"
                style={{ color: "#4A3A2A" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLAnchorElement).style.color = "#6A5A3A"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#4A3A2A"; }}
              >
                <Gear size={14} className="flex-shrink-0" />
                <span className="text-[12px]">Einstellungen</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User row */}
        <div
          className="flex items-center rounded-[7px] px-[10px] py-[7px] transition-colors duration-150 cursor-default"
          style={{
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : 10,
          }}
          title={collapsed ? (userEmail ?? "") : undefined}
        >
          <div
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold leading-none"
            style={{
              background: "rgba(160,120,48,0.15)",
              border: "1px solid rgba(201,168,106,0.2)",
              color: "#C9A86A",
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
                  style={{ color: "#4A3A2A", maxWidth: 120 }}
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
                className="flex-shrink-0 p-1 rounded-[5px] transition-all duration-150"
                style={{ color: "#3A2A1A" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,28,28,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#3A2A1A"; }}
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
