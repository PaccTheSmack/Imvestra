"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ZAEHLERARTEN = ["Strom", "Gas", "Wasser", "Wärme"] as const;

export default function ZaehlerForm() {
  const router = useRouter();
  const [zaehlerart, setZaehlerart] = useState<string>(ZAEHLERARTEN[0]);
  const [ablesedatum, setAblesedatum] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [wert, setWert] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wert) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mieter/zaehler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zaehlerart, ablesedatum, wert: parseFloat(wert) }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Fehler beim Speichern");
      }
      setSuccess(true);
      setWert("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>Zählerart</label>
        <select
          value={zaehlerart}
          onChange={(e) => setZaehlerart(e.target.value)}
          style={inputStyle}
        >
          {ZAEHLERARTEN.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Ablesedatum</label>
        <input
          type="date"
          value={ablesedatum}
          onChange={(e) => setAblesedatum(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Zählerstand</label>
        <input
          type="number"
          step="any"
          value={wert}
          onChange={(e) => setWert(e.target.value)}
          placeholder="z.B. 1234.56"
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Foto (optional)</label>
        <div
          style={{
            border: "1.5px dashed rgba(0,137,123,0.3)",
            borderRadius: 8,
            padding: "18px 12px",
            textAlign: "center",
            color: "#9CA3AF",
            fontSize: 13,
            backgroundColor: "#F0FDFB",
          }}
        >
          Foto-Upload kommt bald
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: "#DC2626", margin: 0 }}>{error}</p>
      )}
      {success && (
        <p style={{ fontSize: 13, color: "#059669", margin: 0 }}>
          Zählerstand erfolgreich gemeldet.
        </p>
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
        {loading ? "Wird gesendet…" : "Zählerstand melden"}
      </button>
    </form>
  );
}
