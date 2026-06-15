"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calculator,
  Buildings,
  MapPin,
  Bank,
  Receipt,
  Warning,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import FadeIn from "@/components/ui/FadeIn";

const TABS: { Icon: PhosphorIcon; label: string; title: string }[] = [
  { Icon: Calculator, label: "Rechner", title: "Imvestra – Renditerechner" },
  { Icon: Buildings, label: "Portfolio", title: "Imvestra – Portfolio" },
  { Icon: MapPin, label: "Standort", title: "Imvestra – Standortanalyse" },
  { Icon: Bank, label: "Finanzen", title: "Imvestra – Finanzen" },
  { Icon: Receipt, label: "Steuern", title: "Imvestra – Steuerübersicht" },
];

const DESCRIPTIONS = [
  { title: "Vollständiger Renditerechner", sub: "Alle Kennzahlen live. Kein Excel. Keine Fehler." },
  { title: "Portfolio Dashboard", sub: "Alle Objekte auf einen Blick." },
  { title: "Standortanalyse", sub: "Marktdaten für jede PLZ in Deutschland." },
  { title: "Finanzen & Zinsbindung", sub: "Nie wieder eine Frist verpassen." },
  { title: "Steuerübersicht", sub: "Anlage V Vorbereitung in Minuten." },
];

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

function MockInput({ value }: { value: string }) {
  return (
    <div className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-3 py-2.5 text-xs text-[#888]">
      {value}
    </div>
  );
}

function RechnerScreen() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[10px] text-[#777] uppercase tracking-widest mb-2">Objekt</p>
          <div className="flex flex-col gap-2">
            <MockInput value="Altbauwohnung Goslar" />
            <MockInput value="185.000" />
            <MockInput value="68" />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-[#777] uppercase tracking-widest mb-2">Finanzen</p>
          <div className="flex flex-col gap-2">
            <MockInput value="850" />
            <MockInput value="0" />
          </div>
        </div>
      </div>
      <div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["BRUTTORENDITE", "5,51 %", "#00E0D7"],
            ["CASHFLOW/MO.", "+148 €", "#00E0D7"],
            ["NETTORENDITE", "4,12 %", "#00E0D7"],
            ["LTV", "72 %", "#FFFFFF"],
          ].map(([l, v, c]) => (
            <div key={l} className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-4 py-3">
              <p className="text-[9px] text-[#666] uppercase tracking-wide">{l}</p>
              <p className="text-xl font-semibold tracking-[-0.02em] mt-1" style={{ color: c }}>{v}</p>
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
        <div className="mt-4 flex flex-col gap-1.5">
          {[
            ["Gesamtinvestition", "203.500 €"],
            ["NOI", "7.596 €"],
            ["Cashflow / Jahr", "+1.776 €"],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-xs">
              <span className="text-[#666]">{l}</span>
              <span className="text-[#888] font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PortfolioScreen() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          ["3 OBJEKTE", "Gesamt"],
          ["+892 €/Mo", "Cashflow"],
          ["5,17 %", "Ø Rendite"],
        ].map(([v, l]) => (
          <div key={l} className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-4 py-3">
            <p className="text-base font-semibold text-white">{v}</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wide mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {[
          { name: "Altbauwohnung · Goslar", cf: "+148 €/Mo", y: "5,51 %", accent: "#00E0D7" },
          { name: "ETW · München", cf: "−92 €/Mo", y: "3,80 %", accent: "#FF4444" },
        ].map((c) => (
          <div key={c.name} className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[12px] overflow-hidden flex">
            <div className="w-1 flex-shrink-0" style={{ background: c.accent }} />
            <div className="flex-1 px-4 py-3 flex justify-between items-center">
              <p className="text-sm font-medium text-white">{c.name}</p>
              <div className="flex items-center gap-4">
                <span className="text-xs" style={{ color: c.accent }}>{c.cf}</span>
                <span className="text-sm font-semibold text-white">{c.y}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StandortScreen() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
      <div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Ø KAUFPREIS", "1.650 €/m²"],
            ["Ø MIETE", "7,20 €/m²"],
            ["FAKTOR", "19x"],
            ["RENDITE", "5,2 %"],
          ].map(([l, v]) => (
            <div key={l} className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-3 py-2.5">
              <p className="text-[9px] text-[#666] uppercase tracking-wide">{l}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-[#0C0C0C] border border-[rgba(255,255,255,0.06)] rounded-[10px] px-4 py-3">
          <p className="text-xs text-[#888] leading-relaxed">
            Goslar (Niedersachsen) ist ein Kleinstadtstandort mit günstigen
            Kaufpreisen und überdurchschnittlichen Renditen.
          </p>
        </div>
      </div>
      <div className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-4 text-center">
        <p className="text-[10px] text-[#777] uppercase tracking-widest mb-3">Score</p>
        <div>
          <span className="text-[44px] font-semibold tracking-[-0.05em] text-[#FFB800] leading-none">62</span>
          <span className="text-sm text-[#555]">/100</span>
        </div>
        <div className="flex flex-col gap-2 mt-4 text-left">
          {[
            ["Rendite", 22],
            ["Nachfrage", 15],
            ["Sicherheit", 14],
            ["Wachstum", 11],
          ].map(([l, v]) => (
            <div key={l as string}>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-[#777]">{l}</span>
                <span className="text-white">{v}/25</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${((v as number) / 25) * 100}%`, background: "#00E0D7" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinanzenScreen() {
  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          ["540.000 €", "Restschuld"],
          ["3,5 %", "Ø Zins"],
          ["+892 €", "Cashflow"],
          ["1", "Warnung"],
        ].map(([v, l]) => (
          <div key={l} className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-3 py-2.5">
            <p className="text-sm font-semibold text-white">{v}</p>
            <p className="text-[9px] text-[#666] uppercase tracking-wide mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        {["Cashflow", "Ausgaben", "Zinsbindung", "Darlehen"].map((t, i) => (
          <span key={t} className="text-xs px-3 py-1.5 rounded-[6px]" style={i === 2 ? { background: "#00E0D7", color: "#080808", fontWeight: 600 } : { background: "#0C0C0C", color: "#777" }}>
            {t}
          </span>
        ))}
      </div>
      <div className="bg-[rgba(255,68,68,0.06)] border border-[rgba(255,68,68,0.15)] rounded-[10px] px-4 py-3 flex items-center gap-2 mb-3">
        <Warning size={14} color="#FF4444" />
        <span className="text-xs text-[#FF4444]">Zinsbindung MFH Leipzig läuft in 87 Tagen aus</span>
      </div>
      <div className="flex flex-col gap-3">
        {[
          { name: "MFH Leipzig", pct: 38, end: "2026" },
          { name: "Altbauwohnung Goslar", pct: 64, end: "2031" },
        ].map((f) => (
          <div key={f.name} className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-4 py-3">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[#888] font-medium">{f.name}</span>
              <span className="text-[#777]">Bindung bis {f.end}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: "#00E0D7" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SteuernScreen() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
      <div>
        <p className="text-[10px] text-[#777] uppercase tracking-widest mb-3">Anlage V – Vorbereitung</p>
        <div className="flex flex-col gap-1.5">
          {[
            ["Mieteinnahmen", "11.664 €", "#888"],
            ["Werbungskosten", "−3.240 €", "#888"],
            ["Zinsen", "−6.180 €", "#888"],
            ["AfA", "−2.960 €", "#888"],
            ["Überschuss", "−716 €", "#00E0D7"],
          ].map(([l, v, c], i) => (
            <div key={l} className="flex justify-between text-xs py-2" style={i === 4 ? { borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 4, fontWeight: 600 } : {}}>
              <span className="text-[#777]">{l}</span>
              <span style={{ color: c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0C0C0C] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-4">
        <p className="text-[10px] text-[#777] uppercase tracking-widest mb-3">AfA pro Objekt</p>
        {[
          ["Goslar", "2.960 €"],
          ["Leipzig", "4.120 €"],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between text-xs py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0">
            <span className="text-[#888]">{l}</span>
            <span className="text-white font-medium">{v}</span>
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] flex justify-between text-xs">
          <span className="text-[#666]">Steuerersparnis</span>
          <span className="text-[#00E0D7] font-semibold">2.978 €</span>
        </div>
      </div>
    </div>
  );
}

const SCREENS = [RechnerScreen, PortfolioScreen, StandortScreen, FinanzenScreen, SteuernScreen];

export default function ScreenshotSection() {
  const [activeTab, setActiveTab] = useState(0);
  const Screen = SCREENS[activeTab];

  return (
    <section id="screenshots" className="bg-[#0C0C0C] py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <span className="inline-flex bg-[#1A1A1A] border border-[rgba(255,255,255,0.08)] text-[#777] text-xs px-3 py-1 rounded-full">
              Produkt-Tour
            </span>
            <h2 className="text-[44px] font-semibold tracking-[-0.03em] text-white mt-4">
              Sieh Imvestra in Aktion.
            </h2>
            <p className="text-[#777] text-lg mt-4">
              Klick dich durch die wichtigsten Features.
            </p>
          </div>
        </FadeIn>

        {/* Tab selector */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {TABS.map(({ Icon, label }, i) => (
            <button
              key={label}
              onClick={() => setActiveTab(i)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-sm cursor-pointer transition-all duration-200"
              style={
                activeTab === i
                  ? { background: "#00E0D7", color: "#080808", fontWeight: 600 }
                  : { background: "#111", border: "1px solid rgba(255,255,255,0.08)", color: "#777" }
              }
            >
              <Icon size={15} color={activeTab === i ? "#080808" : "#777"} />
              {label}
            </button>
          ))}
        </div>

        {/* Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -12 }}
            transition={{ duration: 0.3 }}
            className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[20px] overflow-hidden max-w-[900px] mx-auto"
            style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}
          >
            <WindowBar title={TABS[activeTab].title} />
            <div className="min-h-[460px] p-6">
              <Screen />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-8 text-center"
          >
            <p className="text-base font-semibold text-white">{DESCRIPTIONS[activeTab].title}</p>
            <p className="text-sm text-[#777] mt-1">{DESCRIPTIONS[activeTab].sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
