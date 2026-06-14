"use client";

import {
  Calculator,
  ChartLine,
  FilePdf,
  CurrencyEur,
  ArrowsLeftRight,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { IconProps } from "@phosphor-icons/react";
import type { FC } from "react";
import { tokens } from "@/lib/tokens";

const features: { Icon: FC<IconProps>; title: string; text: string }[] = [
  {
    Icon: Calculator,
    title: "Renditerechner",
    text: "Bruttorendite, Nettomietrendite, Cashflow und ROE auf einen Blick.",
  },
  {
    Icon: ChartLine,
    title: "Portfolio Dashboard",
    text: "Alle Objekte im Überblick. Gesamtperformance und Cashflow-Summe.",
  },
  {
    Icon: FilePdf,
    title: "PDF Bankpräsentation",
    text: "Professioneller Export für Bankgespräche - in Sekunden.",
  },
  {
    Icon: CurrencyEur,
    title: "Finanzierungsanalyse",
    text: "Zinslast, Tilgungsplan und Zinsbindungsende im Griff.",
  },
  {
    Icon: ArrowsLeftRight,
    title: "Szenario-Vergleich",
    text: "Eigenkapital-Varianten und Tilgungsszenarien vergleichen.",
  },
  {
    Icon: ShieldCheck,
    title: "DSGVO-konform",
    text: "Deine Daten bleiben in Europa. Keine Weitergabe an Dritte.",
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="py-24" style={{ background: tokens.color.bg }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="mb-14">
          <h2
            className="text-[34px] font-semibold tracking-[-0.03em]"
            style={{ color: tokens.color.text }}
          >
            Alles was du brauchst.
          </h2>
          <p className="mt-3 text-base" style={{ color: tokens.color.textMuted }}>
            Vom ersten Anruf beim Makler bis zum Bankgespräch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="rounded-[14px] p-6 transition-all duration-200 group cursor-default"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = tokens.color.borderAccent;
                (e.currentTarget as HTMLDivElement).style.background = tokens.color.surfaceHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = tokens.color.border;
                (e.currentTarget as HTMLDivElement).style.background = tokens.color.surface;
              }}
            >
              <div
                className="w-9 h-9 rounded-[8px] mb-4 flex items-center justify-center"
                style={{ background: tokens.color.accentMuted }}
              >
                <Icon size={18} color={tokens.color.accent} />
              </div>
              <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                {title}
              </p>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: tokens.color.textMuted }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
