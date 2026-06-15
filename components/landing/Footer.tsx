"use client";

import Image from "next/image";
import { tokens } from "@/lib/tokens";

export default function Footer() {
  return (
    <footer
      className="pt-8 pb-10"
      style={{
        background: tokens.color.bgSubtle,
        borderTop: `1px solid ${tokens.color.border}`,
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Image
            src="/logo.svg"
            alt="Imvestra"
            width={80}
            height={21}
          />
          <div className="flex items-center gap-6">
            {[
              { label: "Datenschutz", href: "/datenschutz" },
              { label: "Impressum",   href: "/impressum" },
              { label: "Kontakt",     href: "mailto:info@imvestra.de" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-xs transition-colors duration-150"
                style={{ color: tokens.color.textSubtle }}
                onMouseEnter={(e) => (e.currentTarget.style.color = tokens.color.textMuted)}
                onMouseLeave={(e) => (e.currentTarget.style.color = tokens.color.textSubtle)}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
        <div
          className="mt-6 pt-6 text-center"
          style={{ borderTop: `1px solid ${tokens.color.border}` }}
        >
          <p className="text-xs" style={{ color: tokens.color.textSubtle }}>
            © 2025 Imvestra. Alle Rechte vorbehalten. Nicht als Finanzberatung zu verstehen.
          </p>
        </div>
      </div>
    </footer>
  );
}
