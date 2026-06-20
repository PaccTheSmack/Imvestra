import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { MieterAbrechnung } from "./nka-berechnung"
import { formatNka, formatAnteil } from "./nka-berechnung"
import { UMLAGESCHLUESSEL_LABELS } from "./betrkv"

const gold = "#A07830"
const dark = "#101418"
const gray = "#6B7280"
const lightGray = "#F8F7F4"
const red = "#B91C1C"
const green = "#2D6A2D"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: dark,
    padding: 48,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: gold,
  },
  logo: { fontSize: 18, fontFamily: "Helvetica-Bold", color: gold },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", color: dark, marginBottom: 4 },
  subtitle: { fontSize: 9, color: gray },
  adressBlock: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 24,
    padding: 16,
    backgroundColor: lightGray,
    borderRadius: 6,
  },
  adressCol: { flex: 1 },
  adressLabel: { fontSize: 7, color: gray, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  adressText: { fontSize: 9, color: dark, lineHeight: 1.5 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: dark, marginBottom: 8, marginTop: 16 },
  table: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 4, overflow: "hidden", marginBottom: 16 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    padding: "6 10",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: gray, textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: {
    flexDirection: "row",
    padding: "5 10",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableRowAlt: { backgroundColor: "#FAFAFA" },
  cell: { fontSize: 8, color: dark },
  colBezeichnung: { flex: 3 },
  colBetrag: { flex: 1.5, textAlign: "right" },
  colSchluessel: { flex: 1.5, textAlign: "center" },
  colAnteil: { flex: 1, textAlign: "right" },
  colMieter: { flex: 1.5, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    padding: "8 10",
    backgroundColor: lightGray,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: { flex: 3, fontSize: 9, fontFamily: "Helvetica-Bold", color: dark },
  totalValue: { flex: 1.5, fontSize: 9, fontFamily: "Helvetica-Bold", color: dark, textAlign: "right" },
  saldoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  saldoLabel: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  saldoValue: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  berechnungRow: { flexDirection: "row", justifyContent: "space-between", padding: "4 0", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  berechnungLabel: { fontSize: 8, color: gray },
  berechnungValue: { fontSize: 8, color: dark, fontFamily: "Helvetica-Bold" },
  hinweis: { fontSize: 7, color: gray, marginTop: 4, fontStyle: "italic" },
  footer: { marginTop: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  footerText: { fontSize: 7, color: gray, textAlign: "center", lineHeight: 1.6 },
  zahlungsaufforderung: { padding: 12, backgroundColor: "rgba(185,28,28,0.04)", borderWidth: 1, borderColor: "rgba(185,28,28,0.15)", borderRadius: 6, marginTop: 12 },
  zahlungsText: { fontSize: 8, color: red, lineHeight: 1.5 },
})

interface NkaPdfProps {
  abrechnung: {
    abrechnungsjahr: number
    zeitraum_von: string
    zeitraum_bis: string
    faellig_bis?: string
  }
  property: {
    name: string
    address: string
  }
  vermieterName: string
  mieterAbrechnung: MieterAbrechnung
  mieterAdresse?: string
  positionen: Array<{
    id: string
    bezeichnung: string
    gesamtbetrag: number
    umlageschluessel: string
  }>
  erstelldatum?: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE")
}

export function NkaPdfDocument({
  abrechnung,
  property,
  vermieterName,
  mieterAbrechnung,
  mieterAdresse,
  erstelldatum,
}: NkaPdfProps) {
  const { saldo, kosten_gesamt, vorauszahlungen_gesamt, zeitanteil_pct, tage_anteil, tage_gesamt } = mieterAbrechnung
  const istNachzahlung = saldo > 0
  const istGuthaben = saldo < 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Nebenkostenabrechnung {abrechnung.abrechnungsjahr}</Text>
            <Text style={styles.subtitle}>
              Abrechnungszeitraum: {fmtDate(abrechnung.zeitraum_von)} – {fmtDate(abrechnung.zeitraum_bis)}
            </Text>
            {abrechnung.faellig_bis && (
              <Text style={styles.subtitle}>Fälligkeitsdatum: {fmtDate(abrechnung.faellig_bis)}</Text>
            )}
          </View>
          <Text style={styles.logo}>Imvestra</Text>
        </View>

        {/* Adressen */}
        <View style={styles.adressBlock}>
          <View style={styles.adressCol}>
            <Text style={styles.adressLabel}>Vermieter</Text>
            <Text style={styles.adressText}>{vermieterName}</Text>
          </View>
          <View style={styles.adressCol}>
            <Text style={styles.adressLabel}>Mieter</Text>
            <Text style={styles.adressText}>{mieterAbrechnung.mieter_name}</Text>
            {mieterAdresse && <Text style={styles.adressText}>{mieterAdresse}</Text>}
          </View>
          <View style={styles.adressCol}>
            <Text style={styles.adressLabel}>Mietobjekt</Text>
            <Text style={styles.adressText}>{property.name}</Text>
            <Text style={styles.adressText}>{property.address}</Text>
          </View>
        </View>

        {/* Zeitraum Mieter */}
        <View style={{ backgroundColor: lightGray, padding: 10, borderRadius: 6, marginBottom: 16, flexDirection: "row", gap: 24 }}>
          <Text style={{ fontSize: 8, color: dark }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Abrechnungszeitraum Mieter: </Text>
            {fmtDate(mieterAbrechnung.zeitraum_von)} – {fmtDate(mieterAbrechnung.zeitraum_bis)}
          </Text>
          <Text style={{ fontSize: 8, color: gray }}>
            {tage_anteil} von {tage_gesamt} Tagen ({zeitanteil_pct.toFixed(1).replace(".", ",")} %)
          </Text>
        </View>

        {/* Kostenaufstellung */}
        <Text style={styles.sectionTitle}>Kostenaufstellung</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colBezeichnung]}>Kostenart</Text>
            <Text style={[styles.tableHeaderCell, styles.colBetrag]}>Gesamt</Text>
            <Text style={[styles.tableHeaderCell, styles.colSchluessel]}>Schlüssel</Text>
            <Text style={[styles.tableHeaderCell, styles.colAnteil]}>Anteil</Text>
            <Text style={[styles.tableHeaderCell, styles.colMieter]}>Ihr Betrag</Text>
          </View>
          {mieterAbrechnung.positionen.map((pos, i) => (
            <View key={pos.position_id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.cell, styles.colBezeichnung]}>{pos.bezeichnung}</Text>
              <Text style={[styles.cell, styles.colBetrag, { color: gray }]}>{formatNka(pos.gesamtbetrag)}</Text>
              <Text style={[styles.cell, styles.colSchluessel, { color: gray }]}>
                {UMLAGESCHLUESSEL_LABELS[pos.umlageschluessel] ?? pos.umlageschluessel}
              </Text>
              <Text style={[styles.cell, styles.colAnteil, { color: gray }]}>{formatAnteil(pos.anteil_pct)}</Text>
              <Text style={[styles.cell, styles.colMieter, { fontFamily: "Helvetica-Bold" }]}>{formatNka(pos.betrag_mieter)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.colBezeichnung]}>Ihre Betriebskosten gesamt</Text>
            <Text style={[styles.totalValue, styles.colMieter]}>{formatNka(kosten_gesamt)}</Text>
          </View>
        </View>

        {/* Berechnung */}
        <Text style={styles.sectionTitle}>Abrechnung</Text>
        <View style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 6, padding: 12, marginBottom: 8 }}>
          <View style={styles.berechnungRow}>
            <Text style={styles.berechnungLabel}>Ihre Betriebskosten</Text>
            <Text style={styles.berechnungValue}>{formatNka(kosten_gesamt)}</Text>
          </View>
          <View style={styles.berechnungRow}>
            <Text style={styles.berechnungLabel}>Geleistete Vorauszahlungen</Text>
            <Text style={[styles.berechnungValue, { color: green }]}>− {formatNka(vorauszahlungen_gesamt)}</Text>
          </View>
          <View style={[styles.berechnungRow, { borderBottomWidth: 0, paddingTop: 8 }]}>
            <Text style={[styles.berechnungLabel, { fontFamily: "Helvetica-Bold", fontSize: 9 }]}>
              {istNachzahlung ? "Nachzahlung" : istGuthaben ? "Guthaben" : "Saldo"}
            </Text>
            <Text style={[styles.berechnungValue, { fontSize: 11, color: istNachzahlung ? red : istGuthaben ? green : dark }]}>
              {istNachzahlung ? "+" : ""}{formatNka(saldo)}
            </Text>
          </View>
        </View>

        {/* Saldo Box */}
        <View style={[styles.saldoBox, {
          backgroundColor: istNachzahlung ? "rgba(185,28,28,0.04)" : istGuthaben ? "rgba(45,106,45,0.04)" : lightGray,
          borderWidth: 1,
          borderColor: istNachzahlung ? "rgba(185,28,28,0.15)" : istGuthaben ? "rgba(45,106,45,0.15)" : "#E5E7EB",
        }]}>
          <Text style={[styles.saldoLabel, { color: istNachzahlung ? red : istGuthaben ? green : dark }]}>
            {istNachzahlung ? "Nachzahlung" : istGuthaben ? "Guthaben" : "Ausgeglichen"}
          </Text>
          <Text style={[styles.saldoValue, { color: istNachzahlung ? red : istGuthaben ? green : dark }]}>
            {istNachzahlung ? "+" : ""}{formatNka(saldo)}
          </Text>
        </View>

        {/* Zahlungsaufforderung */}
        {istNachzahlung && abrechnung.faellig_bis && (
          <View style={styles.zahlungsaufforderung}>
            <Text style={styles.zahlungsText}>
              Bitte überweisen Sie den Betrag von {formatNka(saldo)} bis zum {fmtDate(abrechnung.faellig_bis)} (§556b BGB: 30 Tage nach Zugang dieser Abrechnung).
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Erstellt mit Imvestra · {erstelldatum ? fmtDate(erstelldatum) : new Date().toLocaleDateString("de-DE")}
          </Text>
          <Text style={[styles.footerText, { marginTop: 4 }]}>
            Gegen diese Abrechnung können Sie innerhalb von 12 Monaten nach Zugang Einwendungen erheben (§556 Abs. 3 BGB).
          </Text>
        </View>
      </Page>
    </Document>
  )
}
