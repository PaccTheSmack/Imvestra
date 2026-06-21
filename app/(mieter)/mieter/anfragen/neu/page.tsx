"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const KATEGORIEN = ["Reparatur", "Sonstige", "Frage", "Beschwerde"] as const;

export default function NeueAnfragePage() {
  const router = useRouter();
  const [kategorie, setKategorie] = useState<string>(KATEGORIEN[0]);
  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titel.trim() || !beschreibung.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mieter/anfragen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kategorie, titel: titel.trim(), beschreibung: beschreibung.trim() }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Fehler beim Senden");
      }
      router.push("/mieter/anfragen");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setLoading(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 8,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.push("/mieter/anfragen")}
          style={{
            padding: "6px 14px",
            backgroundColor: "transparent",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: 7,
            fontSize: 13,
            color: "#6B7280",
            cursor: "pointer",
          }}
        >
          ← Zurück
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.4px" }}>
          Neue Anfrage stellen
        </h1>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 14,
          padding: "24px 28px",
          maxWidth: 560,
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={labelStyle}>Kategorie</label>
            <select
              value={kategorie}
              onChange={(e) => setKategorie(e.target.value)}
              style={inputStyle}
            >
              {KATEGORIEN.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Titel</label>
            <input
              type="text"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="Kurze Beschreibung des Anliegens"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Beschreibung</label>
            <textarea
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              placeholder="Bitte beschreiben Sie Ihr Anliegen ausführlich…"
              required
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#DC2626", margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: loading ? "#9CA3AF" : "#00897B",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.15s",
              alignSelf: "flex-start",
            }}
          >
            {loading ? "Wird gesendet…" : "Anfrage senden"}
          </button>
        </form>
      </div>
    </div>
  );
}
