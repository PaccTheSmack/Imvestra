export interface NkaPosition {
  id: string
  kostenart: string
  bezeichnung: string
  gesamtbetrag: number
  umlageschluessel: "flaeche" | "personen" | "verbrauch" | "einheiten" | "direkt"
}

export interface MieterDaten {
  tenant_id: string
  name: string
  wohnflaeche: number
  einwohnerzahl: number
  einzugsdatum: string
  auszugsdatum?: string
  vorauszahlung_monatlich: number
  zeitraum_von: string
  zeitraum_bis: string
}

export interface ObjektDaten {
  gesamt_flaeche: number
  gesamt_einheiten: number
  gesamt_einwohner: number
}

export interface BerechnetePosition {
  position_id: string
  bezeichnung: string
  gesamtbetrag: number
  umlageschluessel: string
  anteil_pct: number
  betrag_mieter: number
}

export interface MieterAbrechnung {
  tenant_id: string
  mieter_name: string
  zeitraum_von: string
  zeitraum_bis: string
  tage_anteil: number
  tage_gesamt: number
  zeitanteil_pct: number
  positionen: BerechnetePosition[]
  kosten_gesamt: number
  vorauszahlungen_gesamt: number
  saldo: number
}

export function berechneNka(
  positionen: NkaPosition[],
  mieter: MieterDaten[],
  objekt: ObjektDaten,
  zeitraum_von: string,
  zeitraum_bis: string,
): MieterAbrechnung[] {
  const zeitraumTage =
    Math.floor(
      (new Date(zeitraum_bis).getTime() - new Date(zeitraum_von).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1

  return mieter.map((m) => {
    const mietBeginn = new Date(
      Math.max(
        new Date(m.einzugsdatum).getTime(),
        new Date(zeitraum_von).getTime(),
      ),
    )
    const mietEnde = new Date(
      Math.min(
        m.auszugsdatum
          ? new Date(m.auszugsdatum).getTime()
          : new Date(zeitraum_bis).getTime(),
        new Date(zeitraum_bis).getTime(),
      ),
    )
    const tageMieter = Math.max(
      0,
      Math.floor(
        (mietEnde.getTime() - mietBeginn.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1,
    )
    const zeitanteil = zeitraumTage > 0 ? tageMieter / zeitraumTage : 0

    const berechnetePositionen: BerechnetePosition[] = positionen.map((pos) => {
      let anteil = 0
      switch (pos.umlageschluessel) {
        case "flaeche":
          anteil = objekt.gesamt_flaeche > 0 ? m.wohnflaeche / objekt.gesamt_flaeche : 0
          break
        case "personen":
          anteil = objekt.gesamt_einwohner > 0 ? m.einwohnerzahl / objekt.gesamt_einwohner : 0
          break
        case "einheiten":
          anteil = objekt.gesamt_einheiten > 0 ? 1 / objekt.gesamt_einheiten : 0
          break
        case "direkt":
          anteil = 1
          break
        case "verbrauch":
          anteil = objekt.gesamt_flaeche > 0 ? m.wohnflaeche / objekt.gesamt_flaeche : 0
          break
      }
      const anteilZeit = anteil * zeitanteil
      const betragMieter = Math.round(pos.gesamtbetrag * anteilZeit * 100) / 100
      return {
        position_id: pos.id,
        bezeichnung: pos.bezeichnung,
        gesamtbetrag: pos.gesamtbetrag,
        umlageschluessel: pos.umlageschluessel,
        anteil_pct: anteilZeit * 100,
        betrag_mieter: betragMieter,
      }
    })

    const kostenGesamt = berechnetePositionen.reduce((s, p) => s + p.betrag_mieter, 0)
    const monate = tageMieter / 30.44
    const vorauszahlungenGesamt = Math.round(m.vorauszahlung_monatlich * monate * 100) / 100
    const saldo = Math.round((kostenGesamt - vorauszahlungenGesamt) * 100) / 100

    return {
      tenant_id: m.tenant_id,
      mieter_name: m.name,
      zeitraum_von: mietBeginn.toISOString().split("T")[0],
      zeitraum_bis: mietEnde.toISOString().split("T")[0],
      tage_anteil: tageMieter,
      tage_gesamt: zeitraumTage,
      zeitanteil_pct: zeitanteil * 100,
      positionen: berechnetePositionen,
      kosten_gesamt: Math.round(kostenGesamt * 100) / 100,
      vorauszahlungen_gesamt: vorauszahlungenGesamt,
      saldo,
    }
  })
}

export function formatNka(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatAnteil(pct: number): string {
  return pct.toFixed(2).replace(".", ",") + " %"
}
