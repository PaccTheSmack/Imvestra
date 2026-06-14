"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-actions";
import { motion, useReducedMotion } from "motion/react";
import {
  HouseLine,
  Calculator,
  Buildings,
  UsersFour,
  FilePdf,
  GearSix,
  SignOut,
} from "@phosphor-icons/react";
import { tokens } from "@/lib/tokens";

const nav = [
  { Icon: HouseLine,  label: "Übersicht",    href: "/dashboard",   badge: null },
  { Icon: Calculator, label: "Rechner",       href: "/calculator",  badge: "NEU" },
  { Icon: Buildings,  label: "Portfolio",     href: "/portfolio",   badge: null },
  { Icon: UsersFour,  label: "Mieter",        href: "/mieter",      badge: null },
  { Icon: FilePdf,    label: "PDF Export",    href: "/pdf-export",  badge: null },
  { Icon: GearSix,    label: "Einstellungen", href: "/settings",    badge: null },
];

interface SidebarProps {
  userEmail?: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();
  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : "?";

  return (
    <aside
      className="w-[220px] flex-shrink-0 h-screen sticky top-0 flex flex-col"
      style={{
        background: tokens.color.bgSubtle,
        borderRight: `1px solid ${tokens.color.border}`,
      }}
    >
      <div className="px-5 pt-6 pb-5">
        <Image
          src="/logo.svg"
          alt="Imvestra"
          width={100}
          height={26}
          style={{ filter: tokens.logoFilter }}
        />
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 py-1 px-2">
        {nav.map(({ Icon, label, href, badge }) => {
          const active = pathname === href;
          return (
            <Link key={label} href={href} className="relative block">
              {active &&
                (prefersReduced ? (
                  <div
                    className="absolute inset-0 rounded-[8px]"
                    style={{ background: tokens.color.accentSubtle, border: `1px solid ${tokens.color.borderAccent}` }}
                  />
                ) : (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-[8px]"
                    style={{ background: tokens.color.accentSubtle, border: `1px solid ${tokens.color.borderAccent}` }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                ))}
              <motion.div
                className={`relative z-10 flex items-center gap-3 py-2.5 px-3 text-sm rounded-[8px] transition-colors duration-150 ${
                  active ? "font-medium" : "hover:bg-[rgba(255,255,255,0.03)]"
                }`}
                style={{ color: active ? tokens.color.accent : tokens.color.textMuted }}
                whileHover={active || prefersReduced ? {} : { x: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <Icon
                  size={16}
                  color={active ? tokens.color.accent : tokens.color.textSubtle}
                />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                    style={{ background: tokens.color.accentMuted, color: tokens.color.accent }}
                  >
                    {badge}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div
        className="px-4 pb-5 pt-4"
        style={{ borderTop: `1px solid ${tokens.color.border}` }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: tokens.color.accentMuted }}
          >
            <span className="text-xs font-semibold" style={{ color: tokens.color.accent }}>
              {avatarLetter}
            </span>
          </div>
          <p className="text-xs truncate" style={{ color: tokens.color.textSubtle }}>
            {userEmail ?? ""}
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-xs px-1 py-1 w-full transition-colors duration-150"
          style={{ color: tokens.color.textSubtle }}
          onMouseEnter={(e) => (e.currentTarget.style.color = tokens.color.danger)}
          onMouseLeave={(e) => (e.currentTarget.style.color = tokens.color.textSubtle)}
        >
          <SignOut size={13} />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
