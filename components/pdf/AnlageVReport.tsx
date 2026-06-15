import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Property } from "@/types";
import { formatCurrency, formatCurrencySigned } from "@/lib/format";

const GREEN  = "#16A34A";
const RED    = "#DC2626";
const GRAY   = "#71717A";
const BORDER = "#E4E4E7";
const LIGHT  = "#F4F4F5";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#09090B",
    paddingHorizontal: 40,
    paddingVertical: 36,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  brandName:   { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#09090B" },
  brandSub:    { fontSize: 7,  color: GRAY, marginTop: 2 },
  reportMeta:  { alignItems: "flex-end" },
  reportTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#09090B" },
  reportDate:  { fontSize: 7,  color: GRAY, marginTop: 2 },
  section:     { marginBottom: 16 },
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT,
  },
  sectionGroup: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#F9F9F9",
  },
  rowHighlight: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    marginTop: 4,
  },
  rowLabel:       { color: GRAY, fontSize: 8 },
  rowLabelBold:   { color: "#09090B", fontSize: 8, fontFamily: "Helvetica-Bold" },
  rowValue:       { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#09090B" },
  disclaimer: {
    fontSize: 6.5,
    color: GRAY,
    marginTop: 6,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  footerText: { fontSize: 6.5, color: GRAY },
});

interface AnlageVReportProps {
  year: number;
  properties: Property[];
  mieteinnahmen: number;
  werbungskosten: {
    instandhaltung: number;
    verwaltung: number;
    versicherung: number;
    sonstige: number;
  };
  zinsen: number;
  afa_gesamt: number;
  werbungskosten_gesamt: number;
  ueberschuss: number;
}

export default function AnlageVReport({
  year,
  properties,
  mieteinnahmen,
  werbungskosten,
  zinsen,
  afa_gesamt,
  werbungskosten_gesamt,
  ueberschuss,
}: AnlageVReportProps) {
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>Imvestra</Text>
            <Text style={s.brandSub}>Steuerübersicht · Anlage V (Vorbereitung)</Text>
          </View>
          <View style={s.reportMeta}>
            <Text style={s.reportTitle}>Steuerübersicht {year}</Text>
            <Text style={s.reportDate}>Erstellt am {today}</Text>
          </View>
        </View>

        {/* Portfolio summary */}
        {properties.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Objekte</Text>
            {properties.map(p => (
              <View key={p.id} style={s.row}>
                <Text style={s.rowLabel}>{p.name}{p.address ? ` · ${p.address}` : ""}</Text>
                <Text style={s.rowValue}>{formatCurrency(p.purchase_price)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Anlage V */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Anlage V – Einkünfte aus Vermietung und Verpachtung</Text>

          <Text style={s.sectionGroup}>Einnahmen</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Mieteinnahmen (Zeile 9)</Text>
            <Text style={[s.rowValue, { color: GREEN }]}>{formatCurrency(mieteinnahmen)}</Text>
          </View>

          <Text style={s.sectionGroup}>Werbungskosten</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Schuldzinsen (Zeile 35)</Text>
            <Text style={s.rowValue}>{formatCurrency(zinsen)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Absetzung für Abnutzung / AfA (Zeile 33)</Text>
            <Text style={s.rowValue}>{formatCurrency(afa_gesamt)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Erhaltungsaufwendungen (Zeile 40)</Text>
            <Text style={s.rowValue}>{formatCurrency(werbungskosten.instandhaltung)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Verwaltungskosten (Zeile 41)</Text>
            <Text style={s.rowValue}>{formatCurrency(werbungskosten.verwaltung)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Versicherungen (Zeile 42)</Text>
            <Text style={s.rowValue}>{formatCurrency(werbungskosten.versicherung)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Sonstige Werbungskosten (Zeile 49)</Text>
            <Text style={s.rowValue}>{formatCurrency(werbungskosten.sonstige)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabelBold}>Werbungskosten gesamt</Text>
            <Text style={s.rowValue}>{formatCurrency(werbungskosten_gesamt)}</Text>
          </View>

          <View style={s.rowHighlight}>
            <Text style={s.rowLabelBold}>Überschuss / Verlust (Zeile 53)</Text>
            <Text style={[s.rowValue, { color: ueberschuss >= 0 ? GREEN : RED }]}>
              {formatCurrencySigned(ueberschuss)}
            </Text>
          </View>
        </View>

        {/* AfA detail */}
        {properties.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>AfA-Berechnung je Objekt (Schätzung)</Text>
            {properties.map(p => {
              const gebaeude   = p.purchase_price * 0.8;
              const afa_yearly = gebaeude * 0.02;
              const ersparnis  = afa_yearly * 0.42;
              return (
                <View key={p.id} style={{ marginBottom: 6 }}>
                  <View style={s.row}>
                    <Text style={s.rowLabelBold}>{p.name}</Text>
                    <Text style={s.rowValue}> </Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.rowLabel}>  Gebäudewert (80% des Kaufpreises)</Text>
                    <Text style={s.rowValue}>{formatCurrency(gebaeude)}</Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.rowLabel}>  AfA / Jahr (2%)</Text>
                    <Text style={[s.rowValue, { color: GREEN }]}>{formatCurrency(afa_yearly)}</Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.rowLabel}>  Steuerersparnis (42% Grenzsteuersatz)</Text>
                    <Text style={[s.rowValue, { color: GREEN }]}>{formatCurrency(ersparnis)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Disclaimer */}
        <Text style={s.disclaimer}>
          * Näherungswerte auf Basis eingegebener Daten. Zeilen beziehen sich auf Anlage V (Steuerjahr {year}).
          AfA-Berechnung: 80% Gebäudeanteil, 2% lineare AfA, 42% Grenzsteuersatz.
          Diese Aufstellung ersetzt keine steuerliche Beratung. Bitte mit einem Steuerberater abstimmen.
        </Text>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Imvestra · Steuerübersicht {year}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
