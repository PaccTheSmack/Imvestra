"use client";

import { ContainerScroll } from "@/components/ui/container-scroll-animation";

/* ─── Fictional data ─────────────────────────────────────────────── */

const PROPERTIES = [
  { name: "Altbauwohnung Goslar", adresse: "Breite Str. 14", wert: "185.000 €", rendite: "5,51 %", cashflow: "+148 €", status: "Vermietet", color: "#2D6A2D" },
  { name: "ETW Berlin-Neukölln", adresse: "Hermannstr. 72", wert: "320.000 €", rendite: "4,20 %", cashflow: "+86 €", status: "Vermietet", color: "#2D6A2D" },
  { name: "MFH Leipzig-Gohlis", adresse: "Eisenacher Str. 5", wert: "750.000 €", rendite: "6,80 %", cashflow: "+1.240 €", status: "Vermietet", color: "#2D6A2D" },
];

const SUMMARY = [
  { label: "Gesamtwert", value: "1.255.000 €", sub: "+4,2% YTD" },
  { label: "Cashflow / Mo.", value: "+1.474 €", sub: "nach Kosten" },
  { label: "Ø Rendite", value: "5,51 %", sub: "Bruttorendite" },
  { label: "Objekte", value: "3", sub: "Alle vermietet" },
];

const NAV_ITEMS = ["Übersicht", "Portfolio", "Mieter", "Finanzen", "Aufgaben"];

/* ─── Mini Dashboard ─────────────────────────────────────────────── */

function MiniDashboard() {
  return (
    <div className="w-full h-full flex text-left select-none" style={{ fontFamily: "system-ui, sans-serif", background: "#F8F7F4", borderRadius: 12, overflow: "hidden" }}>
      {/* Sidebar */}
      <div className="flex-shrink-0 flex flex-col" style={{ width: 160, background: "#fff", borderRight: "1px solid rgba(0,0,0,0.07)" }}>
        {/* Logo */}
        <div className="px-3 pt-4 pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/imvestra-logo-horizontal.svg" alt="Imvestra" style={{ height: 22, width: "auto" }} />
        </div>
        {/* Nav */}
        <div className="px-2 flex flex-col gap-0.5 mt-2">
          {NAV_ITEMS.map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-2 px-2 py-1.5 rounded-[7px] text-[10px] font-medium"
              style={i === 0
                ? { background: "#A07830", color: "#fff" }
                : { color: "#6B7280" }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: i === 0 ? "rgba(255,255,255,0.5)" : "#D1D5DB" }} />
              {item}
            </div>
          ))}
        </div>
        {/* Promo card */}
        <div className="mt-auto mx-2 mb-3 rounded-[10px] p-3" style={{ background: "linear-gradient(135deg, #18160E 0%, #A07830 100%)" }}>
          <p className="text-[8px] text-white/60 font-semibold uppercase mb-1">Pro Plan</p>
          <p className="text-[9px] text-white font-semibold leading-tight">Upgrade für PDF-Export</p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex-shrink-0 flex items-center justify-end px-4 py-2.5" style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "rgba(160,120,48,0.12)", color: "#A07830" }}>P</div>
            <span className="text-[10px] font-medium" style={{ color: "#101418" }}>pascal</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-3">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {SUMMARY.map((s, i) => (
              <div
                key={s.label}
                className="rounded-[8px] px-3 py-2.5"
                style={i === 0
                  ? { background: "#A07830", boxShadow: "0 4px 16px rgba(160,120,48,0.3)" }
                  : { background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                <p className="text-[8px] font-medium mb-0.5" style={{ color: i === 0 ? "rgba(255,255,255,0.7)" : "#9CA3AF" }}>{s.label}</p>
                <p className="text-[11px] font-bold leading-tight" style={{ color: i === 0 ? "#fff" : "#101418" }}>{s.value}</p>
                <p className="text-[8px] mt-0.5" style={{ color: i === 0 ? "rgba(255,255,255,0.55)" : "#A89A7A" }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Portfolio table */}
          <div className="rounded-[10px] overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            {/* Table header */}
            <div className="grid px-3 py-2" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              {["Objekt", "Marktwert", "Rendite", "Cashflow", "Status"].map(h => (
                <p key={h} className="text-[8px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{h}</p>
              ))}
            </div>
            {/* Rows */}
            {PROPERTIES.map((p, i) => (
              <div
                key={p.name}
                className="grid px-3 py-2.5 items-center"
                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", borderBottom: i < PROPERTIES.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
              >
                <div>
                  <p className="text-[9px] font-semibold leading-tight" style={{ color: "#101418" }}>{p.name}</p>
                  <p className="text-[8px]" style={{ color: "#A89A7A" }}>{p.adresse}</p>
                </div>
                <p className="text-[9px] font-medium tabular-nums" style={{ color: "#101418" }}>{p.wert}</p>
                <p className="text-[9px] font-semibold tabular-nums" style={{ color: "#2D6A2D" }}>{p.rendite}</p>
                <p className="text-[9px] font-semibold tabular-nums" style={{ color: p.color }}>{p.cashflow}</p>
                <span className="text-[8px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(45,106,45,0.08)", color: "#2D6A2D", border: "1px solid rgba(45,106,45,0.15)" }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>

          {/* Mini chart placeholder */}
          <div className="mt-3 rounded-[10px] px-3 py-2.5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-semibold" style={{ color: "#101418" }}>Cashflow-Verlauf 2025</p>
              <p className="text-[8px]" style={{ color: "#A89A7A" }}>Letzte 12 Monate</p>
            </div>
            {/* Simple bar chart */}
            <div className="flex items-end gap-1" style={{ height: 36 }}>
              {[60, 72, 68, 85, 78, 90, 88, 95, 82, 100, 97, 110].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-[2px]"
                  style={{
                    height: `${h}%`,
                    background: i === 11 ? "#A07830" : "rgba(160,120,48,0.25)",
                  }}
                />
              ))}
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
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#A07830" }}>
              Das Dashboard
            </p>
            <h2
              className="text-[36px] md:text-[52px] font-bold tracking-[-0.03em] leading-[1.05]"
              style={{ color: "#101418" }}
            >
              Alles für deine Immobilien.<br />
              <span style={{ color: "#A07830" }}>An einem Ort.</span>
            </h2>
            <p className="mt-4 text-base" style={{ color: "#6A5A3A", maxWidth: 480, margin: "16px auto 0" }}>
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
