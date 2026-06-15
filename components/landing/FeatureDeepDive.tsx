"use client";

import {
  CheckCircle,
  ArrowRight,
  Warning,
  CheckSquare,
  X,
} from "@phosphor-icons/react";
import FadeIn from "@/components/ui/FadeIn";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function WindowBar({ title }: { title: string }) {
  return (
    <div className="bg-[#0C0C0C] border-b border-[rgba(255,255,255,0.06)] px-4 py-3 flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28CA41" }} />
      <span className="text-xs text-[#666] ml-2">{title}</span>
    </div>
  );
}

function TextSide({
  number,
  tag,
  title,
  description,
  features,
  direction,
}: {
  number: string;
  tag: string;
  title: string;
  description: string;
  features: string[];
  direction: "left" | "right";
}) {
  return (
    <FadeIn direction={direction}>
      <p className="text-[80px] font-semibold tracking-[-0.05em] text-[rgba(255,255,255,0.04)] leading-none mb-2">
        {number}
      </p>
      <span className="inline-flex bg-[rgba(0,224,215,0.08)] border border-[rgba(0,224,215,0.15)] text-[#00E0D7] text-xs px-3 py-1 rounded-full mb-4">
        {tag}
      </span>
      <h3 className="text-[32px] font-semibold tracking-[-0.02em] text-white leading-[1.2] mb-4">
        {title}
      </h3>
      <p className="text-base text-[#777] leading-relaxed mb-6">{description}</p>
      <div className="flex flex-col gap-3">
        {features.map((f) => (
          <div key={f} className="flex items-start gap-3">
            <CheckCircle size={15} color="#00E0D7" weight="fill" className="mt-0.5 flex-shrink-0" />
            <span className="text-sm text-[#888]">{f}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => scrollTo("waitlist")}
        className="mt-6 inline-flex items-center gap-2 text-sm text-[#00E0D7] font-medium hover:gap-3 transition-all"
      >
        Jetzt ausprobieren <ArrowRight size={14} />
      </button>
    </FadeIn>
  );
}

const HERO_METRICS = [
  { value: "5,51 %", color: "#00E0D7" },
  { value: "+148 €", color: "#00E0D7" },
  { value: "4,12 %", color: "#00E0D7" },
  { value: "18,1x", color: "#FFFFFF" },
];

export default function FeatureDeepDive() {
  return (
    <section id="feature-details" className="bg-[#080808] py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-20">
            <span className="inline-flex bg-[#1A1A1A] border border-[rgba(255,255,255,0.08)] text-[#777] text-xs px-3 py-1 rounded-full">
              Im Detail
            </span>
            <h2 className="text-[44px] font-semibold tracking-[-0.03em] text-white mt-4">
              Die besten Features erklärt.
            </h2>
            <p className="text-[#777] text-lg mt-4">
              Nicht nur ein Rechner. Eine komplette Investitionsplattform.
            </p>
          </div>
        </FadeIn>

        {/* ROW 1 – Renditerechner (text left, visual right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <TextSide
            direction="left"
            number="01"
            tag="Analyse"
            title="Rendite berechnen – in unter 2 Minuten."
            description="Gib Kaufpreis, Miete und Fläche ein – Imvestra berechnet sofort alle relevanten Kennzahlen. Bruttorendite, Nettomietrendite, Cashflow, ROE und LTV. Live. Ohne Excel. Ohne Fehler."
            features={[
              "Kaufpreisfaktor und 150er-Regel automatisch",
              "Instandhaltung, Verwaltung und Leerstand einkalkuliert",
              "Finanzierungsanalyse mit Tilgungsplan",
              "DSCR für Bankgespräche",
              "Qualitäts-Score für jedes Objekt",
            ]}
          />
          <FadeIn direction="right">
            <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[20px] overflow-hidden" style={{ boxShadow: "0 16px 64px rgba(0,0,0,0.6)" }}>
              <WindowBar title="Imvestra – Renditerechner" />
              <div className="px-5 py-5">
                <div className="flex gap-2 mb-4">
                  {["Übersicht", "Kosten", "Tilgung"].map((t, i) => (
                    <span
                      key={t}
                      className="text-xs px-3 py-1.5 rounded-[6px]"
                      style={i === 0 ? { background: "#00E0D7", color: "#080808", fontWeight: 600 } : { background: "#0C0C0C", color: "#777" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {HERO_METRICS.map((m, i) => (
                    <div key={i} className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-4 py-3">
                      <p className="text-2xl font-semibold tracking-[-0.02em]" style={{ color: m.color }}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-xs text-[#777] mb-1.5">Objektqualität</p>
                  <div className="h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: "78%", background: "#00E0D7" }} />
                  </div>
                  <p className="text-xs text-[#00E0D7] font-semibold mt-1.5">Stark</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* ROW 2 – Standortanalyse (text right, visual left) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <FadeIn direction="left" className="lg:order-1 order-2">
            <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[20px] overflow-hidden" style={{ boxShadow: "0 16px 64px rgba(0,0,0,0.6)" }}>
              <WindowBar title="Imvestra – Standortanalyse" />
              <div className="px-5 py-5">
                <div className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-3 py-2.5 text-sm text-white tracking-widest mb-3">
                  38640
                </div>
                <p className="text-sm font-semibold text-white">Goslar, Niedersachsen</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="text-center">
                    <span className="text-[48px] font-semibold tracking-[-0.05em] text-[#00E0D7] leading-none">62</span>
                    <span className="text-sm text-[#555]">/100</span>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[rgba(255,184,0,0.1)] text-[#FFB800] border border-[rgba(255,184,0,0.2)]">
                    Solider Standort mit Potenzial
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-5">
                  {[
                    ["Ø KAUFPREIS", "1.650 €/m²"],
                    ["Ø MIETE", "7,20 €/m²"],
                    ["FAKTOR", "19x"],
                    ["RENDITE", "5,2 %"],
                  ].map(([l, v]) => (
                    <div key={l} className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-3 py-2">
                      <p className="text-[9px] text-[#666] uppercase tracking-wide">{l}</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2"><CheckCircle size={12} color="#00E0D7" weight="fill" /><span className="text-xs text-[#888]">Günstiger Kaufpreisfaktor</span></div>
                  <div className="flex items-center gap-2"><CheckCircle size={12} color="#00E0D7" weight="fill" /><span className="text-xs text-[#888]">Überdurchschnittliche Rendite</span></div>
                  <div className="flex items-center gap-2"><X size={12} color="#FF4444" /><span className="text-xs text-[#888]">Schrumpfende Bevölkerung</span></div>
                </div>
              </div>
            </div>
          </FadeIn>
          <div className="lg:order-2 order-1">
            <TextSide
              direction="right"
              number="02"
              tag="Standort"
              title="Jede PLZ. Sofort bewertet."
              description="Gibt es in dieser Stadt genug Nachfrage? Ist der Kaufpreis fair? Wie ist das Leerstandsrisiko? Imvestra beantwortet alle Fragen mit echten Marktdaten – für jede PLZ in Deutschland."
              features={[
                "Ø Kaufpreis und Miete pro m² für jede Stadt",
                "Investoren-Score 0-100 mit Teilscores",
                "Bevölkerungstrend und Wirtschaftskraft",
                "Vergleich deines Objekts mit dem Markt",
                "Sofortige Empfehlung: Kaufen / Prüfen / Abwarten",
              ]}
            />
          </div>
        </div>

        {/* ROW 3 – Verwaltung (text left, visual right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <TextSide
            direction="left"
            number="03"
            tag="Verwaltung"
            title="Nichts übersehen. Alles im Blick."
            description="Imvestra erkennt automatisch wenn eine Zinsbindung ausläuft, eine Nebenkostenabrechnung fällig wird oder eine Mietzahlung ausbleibt. Die Smart Task Engine erstellt Aufgaben bevor du selbst daran denkst."
            features={[
              "Automatische Zinsbindungsende-Warnungen",
              "Mietzahlungen tracken (Soll vs. Ist)",
              "Smart Tasks aus Vertrags- und Finanzdaten",
              "Cashflow-Übersicht pro Monat",
              "Nebenkostenabrechnung im Blick",
            ]}
          />
          <FadeIn direction="right">
            <div className="bg-[rgba(255,68,68,0.06)] border border-[rgba(255,68,68,0.15)] rounded-[14px] p-4 flex items-start gap-3">
              <Warning size={16} color="#FF4444" className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Zinsbindung läuft ab</p>
                <p className="text-xs text-[#777] mt-0.5">MFH Leipzig · In 87 Tagen</p>
                <button className="text-xs text-[#FF4444] mt-2">Anschluss berechnen</button>
              </div>
            </div>
            <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-4 mt-3 flex items-start gap-3">
              <CheckSquare size={16} color="#00E0D7" className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[rgba(0,224,215,0.1)] text-[#00E0D7] text-[9px] font-bold px-1.5 py-0.5 rounded-full">AUTO</span>
                </div>
                <p className="text-sm font-semibold text-white">Nebenkostenabrechnung 2025 – M. Müller</p>
                <p className="text-xs text-[#777] mt-0.5">Fällig bis 31.03.2026</p>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* ROW 4 – PDF + Steuer (text right, visual left) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left" className="lg:order-1 order-2">
            <div className="bg-[#111] rounded-[16px] overflow-hidden" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}>
              <div className="bg-[#00E0D7] px-5 py-4 flex justify-between items-start">
                <div>
                  <p className="text-lg font-bold text-[#080808]">Imvestra</p>
                  <p className="text-xs text-[#080808] opacity-70">Bankpräsentation · Objektanalyse</p>
                </div>
                <p className="text-sm font-semibold text-[#080808] text-right">Altbauwohnung Goslar</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[9px] text-[#666] uppercase tracking-widest mb-3">Kerndaten</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["BRUTTO", "5,51 %"],
                    ["CF/MO.", "+148 €"],
                    ["NETTO", "4,12 %"],
                    ["LTV", "72 %"],
                  ].map(([l, v]) => (
                    <div key={l} className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-3 py-2">
                      <p className="text-[9px] text-[#666] uppercase tracking-wide">{l}</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-[#666] uppercase tracking-widest mb-2 mt-4">Steuer &amp; AfA</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#666]">AfA / Jahr</span>
                    <span className="text-[#888] font-medium">2.960 €</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#666]">Steuerersparnis</span>
                    <span className="text-[#00E0D7] font-semibold">1.243 €</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
          <div className="lg:order-2 order-1">
            <TextSide
              direction="right"
              number="04"
              tag="Export"
              title="Professionell auftreten. Bei jeder Bank."
              description="In Sekunden eine professionelle Bankpräsentation generieren. Mit allen Kennzahlen, Finanzierungsdetails und AfA-Berechnung. Dazu eine vollständige Steuerübersicht für die Anlage V – bereit für deinen Steuerberater."
              features={[
                "PDF Bankpräsentation mit einem Klick",
                "AfA-Rechner mit Steuerersparnis-Kalkulation",
                "Anlage V Vorbereitung automatisch",
                "Spekulationsfrist-Tracker",
                "KfW-Fördermöglichkeiten prüfen",
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
