"use client";

import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import {
  HouseLine, Calculator, MapPin, FilePdf, Buildings,
  UsersFour, CheckSquare, Receipt, Gear, ChartBar,
  MagnifyingGlass, SignOut, Tag, ArrowUpRight,
} from "@phosphor-icons/react";

/* ─── Fictional data ─────────────────────────────────────────────── */

const USER_NAME = "Thomas M.";

const PROPERTIES = [
  { name: "ETW Berlin-Mitte", addr: "Unter den Linden 22", type: "ETW", cf: 312, yield_disp: "4,80 %" },
  { name: "MFH Hamburg-Eimsbüttel", addr: "Fruchtallee 74", type: "MFH", cf: 1840, yield_disp: "6,20 %" },
  { name: "ETW München-Schwabing", addr: "Leopoldstr. 118", type: "ETW", cf: 186, yield_disp: "3,90 %" },
  { name: "EFH Frankfurt-Sachsenhausen", addr: "Schweizer Str. 31", type: "EFH", cf: 624, yield_disp: "5,10 %" },
];

const STAT_CARDS = [
  { label: "Portfoliowert", value: "2.480.000 €", sub: "+6,2 % Wertentwicklung", gold: true },
  { label: "Eigenkapital", value: "680.000 €", sub: "Eingesetztes Kapital", gold: false, valueColor: "#A07830" },
  { label: "Cashflow / Monat", value: "+2.962 €", sub: "4 Objekte im Portfolio", gold: false, valueColor: "#2D6A2D" },
  { label: "Ø Nettomietrendite", value: "5,00 %", sub: "Nettomietrendite p.a.", gold: false, valueColor: "#A07830" },
];

const CHART_VALS = [60, 72, 68, 85, 78, 90, 88, 95, 82, 100, 97, 110];
const MONTHS = ["J","F","M","A","M","J","J","A","S","O","N","D"];

/* ─── Sidebar nav ────────────────────────────────────────────────── */

const NAV_SECTIONS = [
  {
    section: null,
    items: [{ Icon: HouseLine, label: "Übersicht", active: true }],
  },
  {
    section: "VERWALTUNG",
    items: [
      { Icon: Buildings, label: "Portfolio", active: false },
      { Icon: UsersFour, label: "Mieter", active: false },
      { Icon: ChartBar, label: "Finanzen", active: false },
      { Icon: CheckSquare, label: "Aufgaben", active: false },
      { Icon: Receipt, label: "Steuern", active: false },
    ],
  },
  {
    section: "ANALYSE",
    items: [
      { Icon: Calculator, label: "Renditerechner", active: false },
      { Icon: Tag, label: "Verhandlung", active: false },
      { Icon: MapPin, label: "Standortanalyse", active: false },
      { Icon: FilePdf, label: "PDF Export", active: false },
    ],
  },
  {
    section: "KONTO",
    items: [{ Icon: Gear, label: "Einstellungen", active: false }],
  },
];

/* ─── Mini Sidebar ───────────────────────────────────────────────── */

function MiniSidebar() {
  return (
    <div
      className="flex-shrink-0 h-full flex flex-col"
      style={{
        width: 160,
        background: "#FFFFFF",
        borderRight: "1px solid rgba(0,0,0,0.07)",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "12px 10px 8px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/imvestra-logo-horizontal.svg" alt="Imvestra" style={{ height: 16, width: "auto" }} />
      </div>

      {/* Search */}
      <div style={{ padding: "0 8px 8px" }}>
        <div className="flex items-center gap-1" style={{ background: "#F5F5F5", borderRadius: 6, padding: "4px 8px" }}>
          <MagnifyingGlass size={9} color="#9CA3AF" />
          <span style={{ fontSize: 8, color: "#9CA3AF", flex: 1 }}>Suchen...</span>
          <span style={{ fontSize: 7, color: "#9CA3AF", background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 3, padding: "0 3px" }}>⌘K</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "0 6px", overflow: "hidden" }}>
        {NAV_SECTIONS.map((sec, si) => (
          <div key={si} style={{ marginTop: si > 0 ? 8 : 0 }}>
            {sec.section && (
              <p style={{ fontSize: 6.5, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 6px", marginBottom: 3 }}>
                {sec.section}
              </p>
            )}
            {sec.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5"
                style={{
                  padding: "4px 6px",
                  borderRadius: 6,
                  marginBottom: 1,
                  background: item.active ? "#A07830" : "transparent",
                }}
              >
                <item.Icon size={10} weight={item.active ? "bold" : "regular"} color={item.active ? "#fff" : "#9CA3AF"} />
                <span style={{ fontSize: 8, color: item.active ? "#fff" : "#6B7280", fontWeight: item.active ? 600 : 400, lineHeight: 1 }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        ))}

        {/* Abmelden */}
        <div className="flex items-center gap-1.5" style={{ padding: "4px 6px", marginTop: 4 }}>
          <SignOut size={10} color="#9CA3AF" />
          <span style={{ fontSize: 8, color: "#6B7280" }}>Abmelden</span>
        </div>
      </div>

      {/* Promo card — pinned bottom */}
      <div style={{ padding: "6px 8px 10px", flexShrink: 0 }}>
        <div style={{ background: "linear-gradient(135deg, #18160E 0%, #A07830 100%)", borderRadius: 9, padding: "8px 10px" }}>
          <p style={{ fontSize: 6.5, color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>
            Aktueller Plan
          </p>
          <p style={{ fontSize: 7.5, color: "white", fontWeight: 600, lineHeight: 1.3, marginBottom: 5 }}>
            Upgrade für unbegrenzte Objekte & PDF-Export
          </p>
          <div style={{ background: "white", borderRadius: 5, padding: "3px 0", textAlign: "center", fontSize: 7.5, fontWeight: 700, color: "#A07830" }}>
            Jetzt upgraden →
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Mini Dashboard ─────────────────────────────────────────────── */

function MiniDashboard() {
  const maxBar = Math.max(...CHART_VALS);

  return (
    <div
      className="w-full h-full flex"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#F8F7F4", overflow: "hidden" }}
    >
      <MiniSidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "8px 16px" }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#101418", lineHeight: 1 }}>Guten Tag, Thomas.</p>
            <p style={{ fontSize: 8, color: "#9CA3AF", marginTop: 2 }}>Hier ist deine Übersicht für heute.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(160,120,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#A07830" }}>
              T
            </div>
            <span style={{ fontSize: 8, fontWeight: 500, color: "#101418" }}>{USER_NAME}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col" style={{ padding: "10px 12px", gap: 10 }}>

          {/* 4 Stat cards */}
          <div className="flex-shrink-0 grid grid-cols-4" style={{ gap: 8 }}>
            {STAT_CARDS.map((card) => (
              <div
                key={card.label}
                style={{
                  borderRadius: 10,
                  padding: "10px 12px",
                  ...(card.gold
                    ? { background: "#A07830", boxShadow: "0 4px 16px rgba(160,120,48,0.28)" }
                    : { background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }),
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 7.5, fontWeight: 500, color: card.gold ? "rgba(255,255,255,0.7)" : "#6B7280" }}>
                    {card.label}
                  </span>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1px solid ${card.gold ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArrowUpRight size={8} color={card.gold ? "rgba(255,255,255,0.6)" : "#9CA3AF"} />
                  </div>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em", color: card.gold ? "white" : (card.valueColor ?? "#101418"), lineHeight: 1 }}>
                  {card.value}
                </p>
                <p style={{ fontSize: 7, marginTop: 3, color: card.gold ? "rgba(255,255,255,0.55)" : "#9CA3AF" }}>
                  {card.sub}
                </p>
              </div>
            ))}
          </div>

          {/* 2-column grid: chart | objekte */}
          <div className="flex-1 grid overflow-hidden" style={{ gap: 8, gridTemplateColumns: "1fr 1fr" }}>

            {/* Cashflow-Analyse */}
            <div
              className="flex flex-col overflow-hidden"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "10px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            >
              <div className="flex items-center justify-between flex-shrink-0" style={{ marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#101418" }}>Cashflow-Analyse</p>
                  <p style={{ fontSize: 7, color: "#9CA3AF", marginTop: 1 }}>Mieteinnahmen vs. Kosten</p>
                </div>
                <div className="flex" style={{ gap: 3 }}>
                  {["Mo", "Qi", "Jr"].map((p, i) => (
                    <div
                      key={p}
                      style={{
                        padding: "2px 5px",
                        borderRadius: 4,
                        fontSize: 7,
                        fontWeight: i === 0 ? 700 : 600,
                        background: i === 0 ? "#A07830" : "#F5F5F5",
                        color: i === 0 ? "white" : "#6B7280",
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex-1 flex flex-col justify-end overflow-hidden">
                <div className="flex items-end" style={{ height: "100%", gap: 2 }}>
                  {CHART_VALS.map((v, i) => (
                    <div key={i} className="flex flex-col items-center justify-end" style={{ flex: 1, height: "100%", gap: 2 }}>
                      <div className="w-full flex justify-center" style={{ height: "85%", alignItems: "flex-end", gap: 1 }}>
                        <div style={{ flex: 1, height: `${(v / maxBar) * 100}%`, background: i === 11 ? "#A07830" : "#F0EDE4", borderRadius: "2px 2px 0 0", minHeight: 2 }} />
                        <div style={{ flex: 1, height: `${(v * 0.36 / maxBar) * 100}%`, background: "#E5E5E5", borderRadius: "2px 2px 0 0", minHeight: 2 }} />
                      </div>
                      <span style={{ fontSize: 5.5, color: "#9CA3AF" }}>{MONTHS[i]}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-shrink-0" style={{ gap: 10, paddingTop: 5, borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 4 }}>
                  <div className="flex items-center" style={{ gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#A07830" }} />
                    <span style={{ fontSize: 6.5, color: "#6B7280" }}>Mieteinnahmen</span>
                  </div>
                  <div className="flex items-center" style={{ gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E5E5E5" }} />
                    <span style={{ fontSize: 6.5, color: "#6B7280" }}>Kosten</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Objekte list */}
            <div
              className="flex flex-col overflow-hidden"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            >
              <div
                className="flex items-center justify-between flex-shrink-0"
                style={{ padding: "10px 12px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              >
                <p style={{ fontSize: 10, fontWeight: 600, color: "#101418" }}>Objekte</p>
                <span style={{ fontSize: 7.5, fontWeight: 600, color: "#A07830" }}>Alle ansehen →</span>
              </div>
              <div className="flex-1 overflow-hidden">
                {PROPERTIES.map((p, i) => (
                  <div
                    key={p.name}
                    className="flex items-center"
                    style={{
                      padding: "7px 12px",
                      gap: 8,
                      borderBottom: i < PROPERTIES.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(160,120,48,0.08)", border: "1px solid rgba(160,120,48,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 6.5, fontWeight: 700, color: "#A07830" }}>
                      {p.type}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 8.5, fontWeight: 500, color: "#101418", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </p>
                      <p style={{ fontSize: 7, color: "#9CA3AF", marginTop: 1 }}>Rendite {p.yield_disp}</p>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#2D6A2D", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                      +{p.cf.toLocaleString("de-DE")} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Export ─────────────────────────────────────────────────────── */

export default function DashboardScrollSection() {
  return (
    <div style={{ background: "#F8F7F4" }}>
      <ContainerScroll
        titleComponent={
          <div className="mb-2">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#A07830" }}
            >
              Das Dashboard
            </p>
            <h2
              className="text-[36px] md:text-[52px] font-bold tracking-[-0.03em] leading-[1.05]"
              style={{ color: "#101418" }}
            >
              Alles für deine Immobilien.
              <br />
              <span style={{ color: "#A07830" }}>An einem Ort.</span>
            </h2>
            <p
              className="mt-4 text-base"
              style={{ color: "#6A5A3A", maxWidth: 480, margin: "16px auto 0" }}
            >
              Portfolio, Cashflow, Mieter, Steuern und Renditerechner — komplett integriert. Kein Excel mehr.
            </p>
          </div>
        }
      >
        <MiniDashboard />
      </ContainerScroll>
    </div>
  );
}
