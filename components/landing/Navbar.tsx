"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react";
import { tokens } from "@/lib/tokens";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "rgba(8,8,8,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${tokens.color.border}`,
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between">
        <Image
          src="/logo.svg"
          alt="Imvestra"
          width={100}
          height={26}
          priority
          style={{ filter: "brightness(0) saturate(100%) invert(75%) sepia(60%) saturate(500%) hue-rotate(155deg) brightness(95%)" }}
        />

        {/* Center nav – desktop */}
        <div className="hidden lg:flex items-center gap-8">
          {["features", "preise", "waitlist"].map((id) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-sm transition-colors duration-150 cursor-pointer capitalize"
              style={{ color: tokens.color.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = tokens.color.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = tokens.color.textMuted)}
            >
              {id === "waitlist" ? "FAQ" : id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>

        {/* Right – desktop */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm px-3 py-1.5 transition-colors duration-150"
            style={{ color: tokens.color.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = tokens.color.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = tokens.color.textMuted)}
          >
            Anmelden
          </Link>
          <button
            onClick={() => scrollTo("waitlist")}
            className="text-sm px-4 py-2 rounded-[8px] font-semibold transition-all active:scale-[0.97]"
            style={{
              background: tokens.color.accent,
              color: tokens.color.bg,
            }}
          >
            Früher Zugang
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-1 transition-colors"
          style={{ color: tokens.color.textMuted }}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <List size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="lg:hidden absolute top-[60px] left-4 right-4 rounded-[10px] p-2"
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.borderStrong}`,
            boxShadow: tokens.shadow.lg,
          }}
        >
          {[
            { label: "Features", id: "features" },
            { label: "Preise",   id: "preise" },
            { label: "FAQ",      id: "waitlist" },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => { scrollTo(id); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm rounded-[6px] transition-colors duration-150"
              style={{ color: tokens.color.textMuted }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = tokens.color.text;
                (e.currentTarget as HTMLButtonElement).style.background = tokens.color.surfaceHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = tokens.color.textMuted;
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {label}
            </button>
          ))}
          <div
            className="mt-1 pt-1 flex flex-col gap-1"
            style={{ borderTop: `1px solid ${tokens.color.border}` }}
          >
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-sm rounded-[6px] transition-colors"
              style={{ color: tokens.color.textMuted }}
            >
              Anmelden
            </Link>
            <button
              onClick={() => { scrollTo("waitlist"); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm rounded-[8px] font-semibold"
              style={{ background: tokens.color.accent, color: tokens.color.bg }}
            >
              Früher Zugang sichern
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
