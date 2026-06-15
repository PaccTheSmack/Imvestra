"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth-actions";
import { motion, useReducedMotion } from "motion/react";
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
  SignOut,
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
    section: "ANALYSE",
    items: [
      { Icon: Calculator, label: "Rechner",   href: "/calculator", badge: "NEU" },
      { Icon: MapPin,     label: "Standort",  href: "/standort"                 },
      { Icon: FilePdf,    label: "PDF Export", href: "/pdf-export"              },
    ],
  },
  {
    section: "VERWALTUNG",
    items: [
      { Icon: Buildings,   label: "Portfolio", href: "/portfolio" },
      { Icon: UsersFour,   label: "Mieter",    href: "/mieter"    },
      { Icon: Bank,        label: "Finanzen",  href: "/finanzen"  },
      { Icon: CheckSquare, label: "Aufgaben",  href: "/aufgaben"  },
      { Icon: Receipt,     label: "Steuern",   href: "/steuern"   },
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
  const pathname      = usePathname();
  const prefersReduced = useReducedMotion();
  const avatarLetter  = userEmail ? userEmail[0].toUpperCase() : "?";
  const [openTaskCount, setOpenTaskCount] = useState(0);

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
      className="w-[220px] flex-shrink-0 h-screen sticky top-0 flex flex-col"
      style={{
        background: "#0C0C0C",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Image
          src="/logo.svg"
          alt="Imvestra"
          width={100}
          height={26}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto py-2">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.section && (
              <p
                className="px-3 pt-4 pb-1.5 text-[9px] font-semibold uppercase"
                style={{ color: "#333", letterSpacing: "0.12em" }}
              >
                {section.section}
              </p>
            )}
            {section.items.map(({ Icon, label, href, badge }) => {
              const active          = isActive(href, pathname);
              const isAufgaben      = href === "/aufgaben";
              const taskBadgeCount  = isAufgaben ? openTaskCount : 0;

              return (
                <Link key={href} href={href} className="block mb-0.5">
                  <motion.div
                    className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-colors duration-150 border"
                    style={active ? {
                      color: "#00E0D7",
                      fontWeight: 500,
                      background: "rgba(0,224,215,0.08)",
                      borderColor: "rgba(0,224,215,0.12)",
                    } : {
                      color: "#555",
                      background: "transparent",
                      borderColor: "transparent",
                    }}
                    whileHover={active || prefersReduced ? {} : { x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLDivElement).style.color = "#888";
                        (e.currentTarget as HTMLDivElement).style.background = "#141414";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLDivElement).style.color = "#555";
                        (e.currentTarget as HTMLDivElement).style.background = "transparent";
                      }
                    }}
                  >
                    <Icon size={16} color={active ? "#00E0D7" : "#444"} />
                    <span className="flex-1">{label}</span>
                    {/* Static badge (NEU etc.) */}
                    {badge && !isAufgaben && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                        style={badge === "NEU"
                          ? { background: "rgba(0,224,215,0.1)", color: "#00E0D7" }
                          : { background: "#1A1A1A", color: "#333" }
                        }
                      >
                        {badge}
                      </span>
                    )}
                    {/* Dynamic task count badge */}
                    {isAufgaben && taskBadgeCount > 0 && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                        style={{ background: "rgba(255,68,68,0.1)", color: "#FF4444" }}
                      >
                        {taskBadgeCount}
                      </span>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div
        className="px-4 pb-5 pt-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
            style={{
              background: "rgba(0,224,215,0.1)",
              border: "1px solid rgba(0,224,215,0.15)",
              color: "#00E0D7",
            }}
          >
            {avatarLetter}
          </div>
          <div className="min-w-0">
            <p
              className="text-[10px] truncate"
              style={{ color: "#444", maxWidth: 120 }}
            >
              {userEmail ?? ""}
            </p>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 text-[9px] mt-0.5 transition-colors duration-150"
              style={{ color: "#333" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FF4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
            >
              <SignOut size={10} />
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
