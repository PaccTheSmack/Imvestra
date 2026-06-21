"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Receipt,
  ArrowDown,
  ArrowUp,
  Buildings,
  Download,
  FileCsv,
  FileText,
  ChartBar,
} from "@phosphor-icons/react";
import {
  generateDatevCsv,
  generateAnlageVText,
  AUSGABEN_KATEGORIEN,
} from "@/lib/jahresabrechnung";
import type { JahresabrechnungData } from "@/lib/jahresabrechnung";

interface JahresabrechnungViewProps {
  jahresData: Record<number, JahresabrechnungData>;
  defaultJahr: number;
}

type Tab = "uebersicht" | "objekte" | "export";

const MONAT_KURZ = [
  "Jan","Feb","Mär","Apr","Mai","Jun",
  "Jul","Aug","Sep","Okt","Nov","Dez",
];

function formatEur(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function JahresabrechnungView({
  jahresData,
  defaultJahr,
}: JahresabrechnungViewProps) {
  const [selectedJahr, setSelectedJahr] = useState(defaultJahr);
  const [tab, setTab] = useState<Tab>("uebersicht");
  const [expandedProp, setExpandedProp] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const data = jahresData[selectedJahr];
  const years = Object.keys(jahresData)
    .map(Number)
    .sort((a, b) => b - a);

  if (!data) return null;

  const { gesamt, properties } = data;

  // Aggregate monthly chart data across all properties
  const monatlichEinnahmen = Array.from({ length: 12 }, (_, i) => {
    return properties.reduce((s, p) => {
      const m = p.mieteinnahmen.find((x) => x.monat === i + 1);
      return s + (m?.betrag ?? 0);
    }, 0);
  });

  const monatlichAusgaben = Array.from({ length: 12 }, () => {
    // distribute ausgaben evenly across months as approximation
    return properties.reduce((s, p) => s + p.ausgaben_gesamt / 12, 0);
  });

  const chartMax = Math.max(...monatlichEinnahmen, ...monatlichAusgaben, 1);

  function downloadDatevCsv() {
    setExporting(true);
    try {
      const csv = generateDatevCsv(data);
      downloadFile(
        csv,
        `DATEV_Buchungsstapel_${selectedJahr}.csv`,
        "text/csv;charset=utf-8;"
      );
    } finally {
      setExporting(false);
    }
  }

  function downloadAnlageV() {
    setExporting(true);
    try {
      const txt = generateAnlageVText(data);
      downloadFile(
        txt,
        `AnlageV_${selectedJahr}.txt`,
        "text/plain;charset=utf-8;"
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ background: "#F8F7F4", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#A07830",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Receipt size={24} color="#fff" weight="bold" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
              Jahresabrechnung
            </h1>
            <p style={{ fontSize: 14, color: "#6b6b6b", margin: 0 }}>
              Steuerliche Auswertung · § 21 EStG
            </p>
          </div>

          {/* Year selector pills */}
          <div style={{ display: "flex", gap: 8 }}>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedJahr(y)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 999,
                  border: selectedJahr === y ? "none" : "1.5px solid #d4d0c8",
                  background: selectedJahr === y ? "#A07830" : "#fff",
                  color: selectedJahr === y ? "#fff" : "#555",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginBottom: 28,
          }}
        >
          {/* Mieteinnahmen */}
          <div
            style={{
              background: "#A07830",
              borderRadius: 14,
              padding: "20px 22px",
              color: "#fff",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginBottom: 6 }}>
              MIETEINNAHMEN
            </div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>
              {formatEur(gesamt.mieteinnahmen)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Brutto {selectedJahr}
            </div>
          </div>

          {/* Ausgaben */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "20px 22px",
              border: "1.5px solid #ece9e1",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>
              WERBUNGSKOSTEN
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#B91C1C" }}>
              {formatEur(gesamt.ausgaben)}
            </div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
              Inkl. AfA
            </div>
          </div>

          {/* Ergebnis §21 */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "20px 22px",
              border: "1.5px solid #ece9e1",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>
              ERGEBNIS § 21 EStG
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: gesamt.ergebnis < 0 ? "#2D6A2D" : "#1a1a1a",
              }}
            >
              {formatEur(gesamt.ergebnis)}
            </div>
            <div
              style={{
                fontSize: 12,
                color: gesamt.ergebnis < 0 ? "#2D6A2D" : "#999",
                marginTop: 4,
              }}
            >
              {gesamt.ergebnis < 0 ? "steuermindernd" : "steuerpflichtig"}
            </div>
          </div>

          {/* Anzahl Objekte */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "20px 22px",
              border: "1.5px solid #ece9e1",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6 }}>
              OBJEKTE
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a" }}>
              {properties.length}
            </div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
              Vermietete Einheiten
            </div>
          </div>
        </div>

        {/* TABS */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 24,
            background: "#ece9e1",
            borderRadius: 10,
            padding: 4,
            width: "fit-content",
          }}
        >
          {(
            [
              { key: "uebersicht", label: "Übersicht", icon: <ChartBar size={15} /> },
              { key: "objekte", label: "Pro Objekt", icon: <Buildings size={15} /> },
              { key: "export", label: "Export", icon: <Download size={15} /> },
            ] as const
          ).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                background: tab === key ? "#fff" : "transparent",
                color: tab === key ? "#1a1a1a" : "#777",
                fontWeight: tab === key ? 600 : 500,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          {tab === "uebersicht" && (
            <motion.div
              key="uebersicht"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {/* Monthly bar chart */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: 24,
                  border: "1.5px solid #ece9e1",
                  marginBottom: 20,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>
                  Monatliche Entwicklung {selectedJahr}
                </h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                  {MONAT_KURZ.map((mon, i) => {
                    const einH = (monatlichEinnahmen[i] / chartMax) * 120;
                    const ausH = (monatlichAusgaben[i] / chartMax) * 120;
                    return (
                      <div
                        key={mon}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 2,
                            height: 120,
                          }}
                        >
                          <div
                            style={{
                              width: 10,
                              height: Math.max(einH, 2),
                              background: "#A07830",
                              borderRadius: "3px 3px 0 0",
                            }}
                          />
                          <div
                            style={{
                              width: 10,
                              height: Math.max(ausH, 2),
                              background: "rgba(185,28,28,0.3)",
                              borderRadius: "3px 3px 0 0",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 10, color: "#999" }}>{mon}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: "#A07830" }} />
                    <span style={{ fontSize: 12, color: "#666" }}>Einnahmen</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(185,28,28,0.3)" }} />
                    <span style={{ fontSize: 12, color: "#666" }}>Ausgaben (ø)</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Einnahmen nach Objekt */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 24,
                    border: "1.5px solid #ece9e1",
                  }}
                >
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>
                    Einnahmen nach Objekt
                  </h3>
                  {properties.length === 0 && (
                    <p style={{ color: "#999", fontSize: 14 }}>Keine Daten</p>
                  )}
                  {properties.map((p) => {
                    const pct =
                      gesamt.mieteinnahmen > 0
                        ? (p.mieteinnahmen_gesamt / gesamt.mieteinnahmen) * 100
                        : 0;
                    return (
                      <div key={p.property_id} style={{ marginBottom: 14 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>
                            {p.property_name}
                          </span>
                          <span style={{ fontSize: 13, color: "#555" }}>
                            {formatEur(p.mieteinnahmen_gesamt)}
                          </span>
                        </div>
                        <div
                          style={{
                            height: 6,
                            background: "#ece9e1",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: "#A07830",
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ausgaben nach Kategorie */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 24,
                    border: "1.5px solid #ece9e1",
                  }}
                >
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>
                    Ausgaben nach Kategorie
                  </h3>
                  {(() => {
                    // aggregate across all properties
                    const katMap: Record<string, number> = {};
                    for (const p of properties) {
                      for (const kat of p.ausgaben) {
                        katMap[kat.kategorie] = (katMap[kat.kategorie] ?? 0) + kat.betrag;
                      }
                    }
                    const entries = Object.entries(katMap).sort((a, b) => b[1] - a[1]);
                    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;

                    if (entries.length === 0) {
                      return <p style={{ color: "#999", fontSize: 14 }}>Keine Ausgaben</p>;
                    }

                    return entries.map(([kat, betrag]) => {
                      const pct = (betrag / total) * 100;
                      return (
                        <div key={kat} style={{ marginBottom: 14 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 4,
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>
                              {AUSGABEN_KATEGORIEN[kat] ?? kat}
                            </span>
                            <span style={{ fontSize: 13, color: "#555" }}>
                              {formatEur(betrag)}
                            </span>
                          </div>
                          <div
                            style={{
                              height: 6,
                              background: "#ece9e1",
                              borderRadius: 3,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: "#B91C1C",
                                borderRadius: 3,
                              }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </motion.div>
          )}

          {tab === "objekte" && (
            <motion.div
              key="objekte"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {properties.length === 0 && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 40,
                    textAlign: "center",
                    color: "#999",
                    border: "1.5px solid #ece9e1",
                  }}
                >
                  Keine Objekte vorhanden.
                </div>
              )}
              {properties.map((prop) => {
                const isExpanded = expandedProp === prop.property_id;
                return (
                  <div
                    key={prop.property_id}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      border: "1.5px solid #ece9e1",
                      marginBottom: 14,
                      overflow: "hidden",
                    }}
                  >
                    {/* Card header */}
                    <button
                      onClick={() =>
                        setExpandedProp(isExpanded ? null : prop.property_id)
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        padding: "18px 22px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        gap: 14,
                      }}
                    >
                      <Buildings size={20} color="#A07830" weight="duotone" />
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>
                          {prop.property_name}
                        </div>
                        <div style={{ fontSize: 13, color: "#888" }}>{prop.address}</div>
                      </div>
                      <div style={{ textAlign: "right", marginRight: 12 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: prop.ergebnis < 0 ? "#2D6A2D" : "#1a1a1a",
                          }}
                        >
                          {formatEur(prop.ergebnis)}
                        </div>
                        <div style={{ fontSize: 12, color: "#999" }}>Ergebnis</div>
                      </div>
                      {isExpanded ? (
                        <ArrowUp size={18} color="#888" />
                      ) : (
                        <ArrowDown size={18} color="#888" />
                      )}
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            style={{
                              borderTop: "1px solid #ece9e1",
                              padding: "20px 22px",
                            }}
                          >
                            {/* Einnahmen table */}
                            <h4
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#888",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                margin: "0 0 12px",
                              }}
                            >
                              Mieteinnahmen
                            </h4>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(6, 1fr)",
                                gap: 8,
                                marginBottom: 24,
                              }}
                            >
                              {prop.mieteinnahmen.map((m) => (
                                <div
                                  key={m.monat}
                                  style={{
                                    background:
                                      m.status === "paid"
                                        ? "#f0f8f0"
                                        : m.status === "pending"
                                        ? "#fffbea"
                                        : "#fef2f2",
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                    textAlign: "center",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "#888",
                                      marginBottom: 2,
                                    }}
                                  >
                                    {MONAT_KURZ[m.monat - 1]}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color:
                                        m.status === "paid"
                                          ? "#2D6A2D"
                                          : m.status === "pending"
                                          ? "#92400e"
                                          : "#B91C1C",
                                    }}
                                  >
                                    {m.betrag > 0
                                      ? formatEur(m.betrag)
                                      : "—"}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Ausgaben table */}
                            {prop.ausgaben.length > 0 && (
                              <>
                                <h4
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#888",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    margin: "0 0 12px",
                                  }}
                                >
                                  Werbungskosten
                                </h4>
                                <table
                                  style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: 13,
                                    marginBottom: 20,
                                  }}
                                >
                                  <thead>
                                    <tr>
                                      {["Kategorie", "Positionen", "Betrag"].map(
                                        (h) => (
                                          <th
                                            key={h}
                                            style={{
                                              textAlign: "left",
                                              padding: "6px 8px",
                                              borderBottom: "1px solid #ece9e1",
                                              color: "#888",
                                              fontWeight: 600,
                                              fontSize: 12,
                                            }}
                                          >
                                            {h}
                                          </th>
                                        )
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {prop.ausgaben.map((kat) => (
                                      <tr key={kat.kategorie}>
                                        <td
                                          style={{
                                            padding: "8px 8px",
                                            borderBottom: "1px solid #f4f2ec",
                                            fontWeight: 600,
                                            color: "#333",
                                          }}
                                        >
                                          {kat.label}
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 8px",
                                            borderBottom: "1px solid #f4f2ec",
                                            color: "#666",
                                          }}
                                        >
                                          {kat.positionen.length} Position
                                          {kat.positionen.length !== 1 ? "en" : ""}
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 8px",
                                            borderBottom: "1px solid #f4f2ec",
                                            fontWeight: 700,
                                            color: "#B91C1C",
                                            textAlign: "right",
                                          }}
                                        >
                                          {formatEur(kat.betrag)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </>
                            )}

                            {/* AfA section */}
                            <div
                              style={{
                                background: "#f8f7f4",
                                borderRadius: 10,
                                padding: "14px 16px",
                                marginBottom: 16,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#555",
                                  marginBottom: 8,
                                }}
                              >
                                Absetzung für Abnutzung (AfA) · § 7 EStG
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 32,
                                  flexWrap: "wrap",
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: 11, color: "#999" }}>
                                    Bemessungsgrundlage
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: "#333",
                                    }}
                                  >
                                    {formatEur(prop.afa_basis)}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, color: "#999" }}>
                                    AfA-Satz
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: "#333",
                                    }}
                                  >
                                    {(prop.afa_prozent * 100).toFixed(1)} %
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, color: "#999" }}>
                                    AfA-Betrag
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: "#A07830",
                                    }}
                                  >
                                    {formatEur(prop.afa_betrag)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Ergebnis */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background:
                                  prop.ergebnis < 0 ? "#f0f8f0" : "#fff8ec",
                                borderRadius: 10,
                                padding: "14px 16px",
                                border: `1.5px solid ${prop.ergebnis < 0 ? "#a3d4a3" : "#f0d89c"}`,
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#555",
                                  }}
                                >
                                  Ergebnis § 21 EStG
                                </div>
                                <div style={{ fontSize: 12, color: "#888" }}>
                                  Einnahmen − Werbungskosten − AfA
                                </div>
                              </div>
                              <div
                                style={{
                                  fontSize: 22,
                                  fontWeight: 700,
                                  color:
                                    prop.ergebnis < 0 ? "#2D6A2D" : "#1a1a1a",
                                }}
                              >
                                {formatEur(prop.ergebnis)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}

          {tab === "export" && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* DATEV CSV */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 28,
                    border: "1.5px solid #ece9e1",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "#f0f8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <FileCsv size={22} color="#2D6A2D" weight="duotone" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                    DATEV Buchungsstapel
                  </div>
                  <div style={{ fontSize: 13, color: "#777", marginBottom: 20, lineHeight: 1.5 }}>
                    CSV-Export im DATEV-Format für Ihren Steuerberater. Enthält
                    alle Mieteinnahmen und Ausgaben als Buchungssätze.
                  </div>
                  <button
                    onClick={downloadDatevCsv}
                    disabled={exporting}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "none",
                      background: "#2D6A2D",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      opacity: exporting ? 0.6 : 1,
                    }}
                  >
                    <Download size={16} />
                    DATEV CSV herunterladen
                  </button>
                </div>

                {/* Anlage V Text */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 28,
                    border: "1.5px solid #ece9e1",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "#fff8ec",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <FileText size={22} color="#A07830" weight="duotone" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                    Anlage V (Textzusammenfassung)
                  </div>
                  <div style={{ fontSize: 13, color: "#777", marginBottom: 20, lineHeight: 1.5 }}>
                    Strukturierte Textausgabe aller Einkünfte aus Vermietung
                    und Verpachtung zur manuellen Übertragung in die Steuererklärung.
                  </div>
                  <button
                    onClick={downloadAnlageV}
                    disabled={exporting}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "none",
                      background: "#A07830",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      opacity: exporting ? 0.6 : 1,
                    }}
                  >
                    <Download size={16} />
                    Anlage V herunterladen
                  </button>
                </div>
              </div>

              {/* Info note */}
              <div
                style={{
                  marginTop: 16,
                  background: "#fffbea",
                  border: "1.5px solid #f0d89c",
                  borderRadius: 12,
                  padding: "14px 18px",
                  fontSize: 13,
                  color: "#92400e",
                  lineHeight: 1.6,
                }}
              >
                <strong>Hinweis:</strong> Diese Auswertung dient der Vorbereitung Ihrer Steuererklärung.
                Bitte prüfen Sie alle Angaben gemeinsam mit Ihrem Steuerberater.
                Die AfA-Berechnung basiert auf dem Kaufpreis (2 % für Baujahr ≥ 1925, sonst 2,5 %).
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
