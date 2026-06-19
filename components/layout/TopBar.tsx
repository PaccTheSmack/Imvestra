"use client";

import { usePathname } from "next/navigation";
import { Bell, Plus } from "@phosphor-icons/react";
import Link from "next/link";

const PAGE_META: Record<string, { title: string; sub: string; ctaLabel?: string; ctaHref?: string }> = {
  "/dashboard":   { title: "Übersicht",       sub: "Deine Immobilien auf einen Blick",       ctaLabel: "Objekt anlegen", ctaHref: "/portfolio/neu" },
  "/portfolio":   { title: "Portfolio",        sub: "Alle deine Objekte im Überblick",         ctaLabel: "Objekt anlegen", ctaHref: "/portfolio/neu" },
  "/mieter":      { title: "Mietverwaltung",   sub: "Mieter, Zahlungen & Verträge",            ctaLabel: "Mieter anlegen", ctaHref: "/mieter" },
  "/finanzen":    { title: "Finanzen",          sub: "Cashflow, Ausgaben & Finanzierungen",     ctaLabel: "Ausgabe erfassen" },
  "/aufgaben":    { title: "Aufgaben",          sub: "Deine offenen To-dos",                    ctaLabel: "Aufgabe anlegen" },
  "/steuern":     { title: "Steuern",           sub: "AfA, Einnahmen & steuerliche Übersicht" },
  "/calculator":  { title: "Rechner",           sub: "Deal-Analyse & Renditerechner" },
  "/verhandlung": { title: "Verhandlung",       sub: "Preisfindung & Kaufpreisanalyse" },
  "/standort":    { title: "Standortanalyse",   sub: "Lage, Infrastruktur & Marktdaten" },
  "/pdf-export":  { title: "PDF Export",        sub: "Portfolio-Bericht generieren" },
  "/settings":    { title: "Einstellungen",     sub: "Konto, Plan & Datenschutz" },
};

function getPageMeta(pathname: string) {
  for (const [key, val] of Object.entries(PAGE_META)) {
    if (pathname === key || (key !== "/dashboard" && pathname.startsWith(key))) return val;
  }
  return { title: "Imvestra", sub: "" };
}

interface TopBarProps {
  userEmail?: string;
}

export default function TopBar({ userEmail }: TopBarProps) {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);
  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : "?";
  const displayName = userEmail ? userEmail.split("@")[0] : "Nutzer";

  return (
    <header
      className="sticky top-0 z-10 h-[64px] px-8 flex items-center justify-between flex-shrink-0"
      style={{
        background: "white",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
      }}
    >
      {/* Left */}
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em]" style={{ color: "#101418" }}>
          {meta.title}
        </h1>
        {meta.sub && (
          <p className="text-[12px] mt-0.5" style={{ color: "#9CA3AF" }}>{meta.sub}</p>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button
          className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all duration-150"
          style={{ background: "#F5F5F5", color: "#6B7280" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(160,120,48,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#A07830"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; }}
        >
          <Bell size={17} />
        </button>

        {/* CTA */}
        {meta.ctaLabel && (
          <Link
            href={meta.ctaHref ?? "#"}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all duration-150 active:scale-[0.98]"
            style={{
              background: "#A07830",
              color: "white",
              boxShadow: "0 4px 14px rgba(160,120,48,0.2)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#8A6420"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(160,120,48,0.35)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#A07830"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 14px rgba(160,120,48,0.2)"; }}
          >
            <Plus size={14} weight="bold" />
            {meta.ctaLabel}
          </Link>
        )}

        {/* User pill */}
        <Link
          href="/settings"
          className="flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-[24px] transition-all duration-150"
          style={{ background: "#F5F5F5" }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(160,120,48,0.06)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#F5F5F5"; }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
            style={{
              background: "rgba(160,120,48,0.12)",
              border: "1px solid rgba(160,120,48,0.2)",
              color: "#A07830",
            }}
          >
            {avatarLetter}
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-tight" style={{ color: "#101418" }}>{displayName}</p>
            <p className="text-[10px] leading-tight" style={{ color: "#9CA3AF" }}>{userEmail ?? ""}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
