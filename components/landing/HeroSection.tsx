"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { tokens } from "@/lib/tokens";

export default function HeroSection() {
  return (
    <section
      className="pt-24 pb-20"
      style={{ background: tokens.color.bg }}
    >
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left column */}
        <div>
          <h1
            className="text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] text-balance"
            style={{ color: tokens.color.text }}
          >
            Das Tool das du brauchst -<br />bevor du kaufst.
          </h1>

          <p className="mt-5 text-lg leading-relaxed max-w-[440px]" style={{ color: tokens.color.textMuted }}>
            Renditerechner, Finanzierungsanalyse und Portfolio-Übersicht.
            Klar. Schnell. Präzise.
          </p>

          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <a
              href="#waitlist"
              className="px-6 py-3 rounded-[10px] font-semibold text-sm transition-all active:scale-[0.97]"
              style={{
                background: tokens.color.accent,
                color: tokens.color.bg,
                boxShadow: tokens.shadow.accent,
              }}
            >
              Auf Warteliste eintragen
            </a>
            <a
              href="#features"
              className="text-sm font-medium transition-colors duration-150"
              style={{ color: tokens.color.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = tokens.color.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = tokens.color.textMuted)}
            >
              Features entdecken
            </a>
          </div>

          <div className="mt-7 flex items-center gap-5 flex-wrap">
            {["Kostenlos starten", "Keine Kreditkarte", "DSGVO-konform"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs" style={{ color: tokens.color.textSubtle }}>
                <CheckCircle size={13} color={tokens.color.positive} weight="fill" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right column – app mockup */}
        <div
          className="rounded-[20px] overflow-hidden"
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.borderStrong}`,
            boxShadow: tokens.shadow.lg,
          }}
        >
          {/* Browser chrome */}
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{
              background: tokens.color.bgSubtle,
              borderBottom: `1px solid ${tokens.color.border}`,
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
            <span className="text-xs ml-2" style={{ color: tokens.color.textSubtle }}>
              Imvestra - Renditerechner
            </span>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
              Altbauwohnung Goslar
            </p>
            <p className="text-xs mt-0.5" style={{ color: tokens.color.textMuted }}>
              Kaufpreis: 185.000 € · 68 m²
            </p>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: "BRUTTORENDITE",    value: "5,51 %", positive: true  },
                { label: "CASHFLOW/MO.",     value: "+148 €", positive: true  },
                { label: "NETTOMIETRENDIT.", value: "4,12 %", positive: true  },
                { label: "LTV",              value: "72 %",   positive: false },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-[8px] px-3 py-2.5"
                  style={{
                    background: tokens.color.surfaceHover,
                    border: `1px solid ${tokens.color.border}`,
                  }}
                >
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: tokens.color.textSubtle }}>
                    {m.label}
                  </p>
                  <p
                    className="text-sm font-semibold mt-0.5"
                    style={{ color: m.positive ? tokens.color.positive : tokens.color.text }}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4" style={{ borderTop: `1px solid ${tokens.color.border}` }} />

            <div className="mt-3 flex flex-col gap-1.5">
              {[
                { label: "Gesamtinvestition", value: "203.500 €", positive: false },
                { label: "Eff. Jahresmiete",  value: "9.720 €",   positive: false },
                { label: "NOI",               value: "7.596 €",   positive: false },
                { label: "Cashflow/Jahr",     value: "+1.776 €",  positive: true  },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-xs">
                  <span style={{ color: tokens.color.textMuted }}>{r.label}</span>
                  <span
                    className="font-medium"
                    style={{ color: r.positive ? tokens.color.positive : tokens.color.text }}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
