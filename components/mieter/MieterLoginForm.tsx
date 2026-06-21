"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "motion/react";

export default function MieterLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Full page reload so server middleware picks up the new auth cookie
    window.location.href = "/mieter/dashboard";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        width: "100%",
        maxWidth: 420,
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
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#00897B",
              letterSpacing: "-0.3px",
            }}
          >
            Imvestra
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#6B7280",
              marginTop: 2,
            }}
          >
            Mieterportal
          </div>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Anmelden
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#6B7280",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          Melden Sie sich bei Ihrem Mieterkonto an
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
              E-Mail-Adresse
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ihre@email.de"
              style={{
                padding: "10px 14px",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                color: "#111827",
                backgroundColor: "#fff",
                transition: "border-color 0.15s",
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
              placeholder="••••••••"
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
            {loading ? "Anmelden..." : "Anmelden"}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 13,
            color: "#6B7280",
          }}
        >
          Haben Sie einen Einladungscode?{" "}
          <a
            href="/mieter/aktivieren"
            style={{ color: "#00897B", fontWeight: 500, textDecoration: "none" }}
          >
            Hier aktivieren →
          </a>
        </div>
      </div>
    </motion.div>
  );
}
