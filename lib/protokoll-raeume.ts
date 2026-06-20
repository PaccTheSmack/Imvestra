export const STANDARD_RAEUME = [
  "Eingang / Flur",
  "Wohnzimmer",
  "Schlafzimmer",
  "Küche",
  "Bad / WC",
  "Abstellraum",
  "Keller",
  "Balkon / Terrasse",
]

export const RAEUME_CHECKBOXEN = [
  { key: "waende_ok",     label: "Wände" },
  { key: "boden_ok",      label: "Boden" },
  { key: "decke_ok",      label: "Decke" },
  { key: "fenster_ok",    label: "Fenster" },
  { key: "tueren_ok",     label: "Türen" },
  { key: "heizung_ok",    label: "Heizung" },
  { key: "steckdosen_ok", label: "Steckdosen / Elektrik" },
]

export const ZUSTAND_OPTIONS = [
  { value: "einwandfrei",       label: "Einwandfrei",         color: "#2D6A2D" },
  { value: "gut",               label: "Gut",                 color: "#A07830" },
  { value: "maengel",           label: "Mängel vorhanden",    color: "#D97706" },
  { value: "stark_beschaedigt", label: "Stark beschädigt",    color: "#B91C1C" },
]

export const GESAMTZUSTAND_OPTIONS = [
  { value: "sehr_gut",           label: "Sehr gut",           emoji: "✅", desc: "Keine nennenswerten Mängel",   color: "#2D6A2D" },
  { value: "gut",                label: "Gut",                emoji: "👍", desc: "Kleinere Gebrauchsspuren",     color: "#A07830" },
  { value: "maengel",            label: "Mängel",             emoji: "⚠️", desc: "Einzelne Schäden vorhanden",   color: "#D97706" },
  { value: "erhebliche_maengel", label: "Erhebliche Mängel",  emoji: "❌", desc: "Größere Schäden",              color: "#B91C1C" },
]

export const TYP_CONFIG = {
  einzug:             { label: "Einzug",   color: "#2D6A2D", bg: "rgba(45,106,45,0.08)" },
  auszug:             { label: "Auszug",   color: "#B91C1C", bg: "rgba(185,28,28,0.08)" },
  zwischenkontrolle:  { label: "Kontrolle",color: "#A07830", bg: "rgba(160,120,48,0.08)" },
}
