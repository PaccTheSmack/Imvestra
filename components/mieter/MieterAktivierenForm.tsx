"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

interface Props {
  mieterName: string;
  mieterEmail: string;
  code: string;
}

export default function MieterAktivierenForm({ mieterName, mieterEmail, code }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/mieter/aktivieren/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Aktivierung fehlgeschlagen.");
        setLoading(false);
        return;
      }

      router.push("/mieter/dashboard");
      router.refresh();
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        width: "100%",
        maxWidth: 440,
        padding: "0 16px",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 14,
          padding: "40px 36px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#00897B", letterSpacing: "-0.3px" }}>
            Imvestra
          </div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Mieterportal</div>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          Willkommen, {mieterName}!
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#6B7280",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          Legen Sie Ihr Passwort fest, um Ihr Konto zu aktivieren.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
              E-Mail-Adresse
            </label>
            <input
              type="email"
              value={mieterEmail}
              readOnly
              style={{
                padding: "10px 14px",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 8,
                fontSize: 14,
                color: "#6B7280",
                backgroundColor: "#F9FAFB",
                cursor: "not-allowed",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mindestens 8 Zeichen"
              style={{
                padding: "10px 14px",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                color: "#111827",
                backgroundColor: "#fff",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Passwort wiederholen"
              style={{
                padding: "10px 14px",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                color: "#111827",
                backgroundColor: "#fff",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 8,
                fontSize: 13,
                color: "#DC2626",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              backgroundColor: loading ? "#80CBC4" : "#00897B",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.15s",
              marginTop: 4,
            }}
          >
            {loading ? "Aktivierung..." : "Konto aktivieren"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
