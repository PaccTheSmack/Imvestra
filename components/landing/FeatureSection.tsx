"use client";

import {
  Calculator,
  Buildings,
  MapPin,
  FilePdf,
  UsersFour,
  Bank,
  Receipt,
  Warning,
} from "@phosphor-icons/react";
import FadeIn from "@/components/ui/FadeIn";
import HoverCard from "@/components/ui/HoverCard";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function FeatureSection() {
  return (
    <section id="features" className="bg-[#F8F7F4] py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-[44px] font-semibold tracking-[-0.03em] text-[#101418]">
              Vom Exposé zur<br />Steuererklärung.
            </h2>
            <p className="text-[#6A5A3A] text-lg max-w-[480px] mx-auto mt-5">
              Kein Tool-Chaos mehr. Rendite, Portfolio, Mieter, Finanzierung
              und Steuern – alles an einem Ort.
            </p>
          </div>
        </FadeIn>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* CARD 1 – Renditerechner (large) */}
          <FadeIn className="md:col-span-4" delay={0}>
            <HoverCard intensity={4} className="h-full">
              <div
                onClick={() => scrollTo("screenshots")}
                className="h-full bg-white border border-[rgba(16,20,24,0.08)] rounded-[20px] p-7 relative overflow-hidden hover:border-[rgba(160,120,48,0.2)] hover:shadow-[0_4px_24px_rgba(160,120,48,0.08)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <div className="w-10 h-10 bg-[rgba(160,120,48,0.08)] border border-[rgba(160,120,48,0.12)] rounded-[10px] flex items-center justify-center">
                  <Calculator size={18} color="#A07830" />
                </div>
                <h3 className="text-xl font-semibold text-[#101418] mt-4">Renditerechner</h3>
                <p className="text-sm text-[#6A5A3A] leading-relaxed max-w-[320px] mt-2">
                  Kaufpreis, Miete und Fläche eingeben – sofort Cashflow, ROE, LTV
                  und Rendite sehen. Live. Ohne Excel.
                </p>
                <div className="mt-5 grid grid-cols-4 gap-2">
                  {[
                    { label: "BRUTTO", value: "5,51 %", color: "#A07830" },
                    { label: "NETTO", value: "4,12 %", color: "#A07830" },
                    { label: "CF/MO.", value: "+148 €", color: "#A07830" },
                    { label: "LTV", value: "72 %", color: "#101418" },
                  ].map((m) => (
                    <div key={m.label} className="bg-[#F8F7F4] border border-[rgba(16,20,24,0.07)] rounded-[8px] px-2.5 py-2 text-center">
                      <p className="text-[9px] text-[#A89A7A] uppercase tracking-wide">{m.label}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: m.color }}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <div
                  className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: "rgba(160,120,48,0.04)", filter: "blur(60px)" }}
                />
              </div>
            </HoverCard>
          </FadeIn>

          {/* CARD 2 – Portfolio */}
          <FadeIn className="md:col-span-2" delay={0.05}>
            <HoverCard intensity={4} className="h-full">
              <div className="h-full bg-white border border-[rgba(16,20,24,0.08)] rounded-[20px] p-6 hover:border-[rgba(160,120,48,0.2)] hover:shadow-[0_4px_24px_rgba(160,120,48,0.08)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-10 h-10 bg-[rgba(160,120,48,0.08)] border border-[rgba(160,120,48,0.12)] rounded-[10px] flex items-center justify-center">
                  <Buildings size={18} color="#A07830" />
                </div>
                <h3 className="text-lg font-semibold text-[#101418] mt-4">Portfolio Dashboard</h3>
                <p className="text-sm text-[#6A5A3A] mt-2">
                  Alle Objekte, Gesamtcashflow und Performance auf einen Blick.
                </p>
                <div className="mt-4 flex flex-col gap-1.5">
                  {[
                    { name: "Altbauwohnung · Goslar", y: "5,51 %" },
                    { name: "MFH · Leipzig", y: "6,20 %" },
                    { name: "ETW · München", y: "3,80 %" },
                  ].map((r) => (
                    <div key={r.name} className="flex justify-between text-xs">
                      <span className="text-[#6A5A3A]">{r.name}</span>
                      <span className="text-[#A07830] font-semibold">{r.y}</span>
                    </div>
                  ))}
                  <div className="border-t border-[rgba(16,20,24,0.06)] mt-3 pt-3 flex justify-between text-xs">
                    <span className="text-[#A89A7A]">Ø Rendite</span>
                    <span className="text-[#A07830] font-semibold">5,17 %</span>
                  </div>
                </div>
              </div>
            </HoverCard>
          </FadeIn>

          {/* CARD 3 – Standortanalyse */}
          <FadeIn className="md:col-span-3" delay={0.1}>
            <HoverCard intensity={4} className="h-full">
              <div className="h-full bg-white border border-[rgba(16,20,24,0.08)] rounded-[20px] p-6 hover:border-[rgba(160,120,48,0.2)] hover:shadow-[0_4px_24px_rgba(160,120,48,0.08)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-10 h-10 bg-[rgba(160,120,48,0.08)] border border-[rgba(160,120,48,0.12)] rounded-[10px] flex items-center justify-center">
                  <MapPin size={18} color="#A07830" />
                </div>
                <h3 className="text-lg font-semibold text-[#101418] mt-4">Standortanalyse</h3>
                <p className="text-sm text-[#6A5A3A] mt-2">
                  PLZ eingeben – Marktdaten, Investoren-Score und Empfehlung sofort.
                </p>
                <div className="mt-4 bg-[#F8F7F4] border border-[rgba(16,20,24,0.07)] rounded-[10px] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={12} color="#A07830" />
                    <span className="text-xs text-[#6A5A3A]">38640 – Goslar</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[#A07830]">62 / 100</p>
                    <p className="text-[10px] text-[#A89A7A]">Prüfen</p>
                  </div>
                </div>
              </div>
            </HoverCard>
          </FadeIn>

          {/* CARD 4 – PDF Export */}
          <FadeIn className="md:col-span-3" delay={0.15}>
            <HoverCard intensity={4} className="h-full">
              <div className="h-full bg-white border border-[rgba(16,20,24,0.08)] rounded-[20px] p-6 hover:border-[rgba(160,120,48,0.2)] hover:shadow-[0_4px_24px_rgba(160,120,48,0.08)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-10 h-10 bg-[rgba(160,120,48,0.08)] border border-[rgba(160,120,48,0.12)] rounded-[10px] flex items-center justify-center">
                  <FilePdf size={18} color="#A07830" />
                </div>
                <h3 className="text-lg font-semibold text-[#101418] mt-4">PDF Bankpräsentation</h3>
                <p className="text-sm text-[#6A5A3A] mt-2">
                  Professionelle Objektanalyse in Sekunden. Für dein nächstes
                  Bankgespräch.
                </p>
                <div className="mt-4 bg-[#F8F7F4] border border-[rgba(16,20,24,0.07)] rounded-[10px] p-3">
                  <p className="text-xs text-[#A07830] font-semibold">Imvestra</p>
                  <p className="text-[10px] text-[#A89A7A] mt-0.5">Bankpräsentation · Objektanalyse</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {[
                      ["BRUTTO", "5,51%"],
                      ["CF/MO.", "+148€"],
                      ["NETTO", "4,12%"],
                      ["LTV", "72%"],
                    ].map(([l, v]) => (
                      <div key={l} className="bg-white border border-[rgba(16,20,24,0.06)] rounded-[6px] px-2 py-1.5 flex justify-between">
                        <span className="text-[9px] text-[#A89A7A]">{l}</span>
                        <span className="text-[9px] text-[#6A5A3A] font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </HoverCard>
          </FadeIn>

          {/* CARD 5 – Mietverwaltung */}
          <FadeIn className="md:col-span-2" delay={0.2}>
            <HoverCard intensity={4} className="h-full">
              <div className="h-full bg-white border border-[rgba(16,20,24,0.08)] rounded-[20px] p-6 hover:border-[rgba(160,120,48,0.2)] hover:shadow-[0_4px_24px_rgba(160,120,48,0.08)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-10 h-10 bg-[rgba(160,120,48,0.08)] border border-[rgba(160,120,48,0.12)] rounded-[10px] flex items-center justify-center">
                  <UsersFour size={18} color="#A07830" />
                </div>
                <h3 className="text-lg font-semibold text-[#101418] mt-4">Mietverwaltung</h3>
                <p className="text-sm text-[#6A5A3A] mt-2">
                  Mieter, Zahlungen und Verträge verwalten.
                </p>
              </div>
            </HoverCard>
          </FadeIn>

          {/* CARD 6 – Finanzen */}
          <FadeIn className="md:col-span-2" delay={0.25}>
            <HoverCard intensity={4} className="h-full">
              <div className="h-full bg-white border border-[rgba(16,20,24,0.08)] rounded-[20px] p-6 hover:border-[rgba(160,120,48,0.2)] hover:shadow-[0_4px_24px_rgba(160,120,48,0.08)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-10 h-10 bg-[rgba(160,120,48,0.08)] border border-[rgba(160,120,48,0.12)] rounded-[10px] flex items-center justify-center">
                  <Bank size={18} color="#A07830" />
                </div>
                <h3 className="text-lg font-semibold text-[#101418] mt-4">Zinsbindungsende-Tracker</h3>
                <p className="text-sm text-[#6A5A3A] mt-2">
                  Nie wieder eine Zinsbindung verpassen.
                </p>
                <div className="mt-4 bg-[rgba(185,28,28,0.05)] border border-[rgba(185,28,28,0.12)] rounded-[8px] px-3 py-2 flex items-center gap-2">
                  <Warning size={12} color="#B91C1C" />
                  <span className="text-[10px] text-[#B91C1C]">Läuft in 3 Monaten aus</span>
                </div>
              </div>
            </HoverCard>
          </FadeIn>

          {/* CARD 7 – Steuern */}
          <FadeIn className="md:col-span-2" delay={0.3}>
            <HoverCard intensity={4} className="h-full">
              <div className="h-full bg-white border border-[rgba(16,20,24,0.08)] rounded-[20px] p-6 hover:border-[rgba(160,120,48,0.2)] hover:shadow-[0_4px_24px_rgba(160,120,48,0.08)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-10 h-10 bg-[rgba(160,120,48,0.08)] border border-[rgba(160,120,48,0.12)] rounded-[10px] flex items-center justify-center">
                  <Receipt size={18} color="#A07830" />
                </div>
                <h3 className="text-lg font-semibold text-[#101418] mt-4">AfA &amp; Steuerübersicht</h3>
                <p className="text-sm text-[#6A5A3A] mt-2">
                  Anlage V Vorbereitung automatisch.
                </p>
              </div>
            </HoverCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
