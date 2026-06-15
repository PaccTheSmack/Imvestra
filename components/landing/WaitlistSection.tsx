"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { tokens } from "@/lib/tokens";

type State = "idle" | "loading" | "success" | "error";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [position, setPosition] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setPosition(data.position);
        setState("success");
      } else {
        setErrorMsg(data.message ?? "Fehler aufgetreten");
        setState("error");
      }
    } catch {
      setErrorMsg("Netzwerkfehler. Bitte erneut versuchen.");
      setState("error");
    }
  }

  return (
    <section
      id="waitlist"
      className="py-24"
      style={{ background: tokens.color.bg }}
    >
      <div className="max-w-[520px] mx-auto px-6 text-center">
        <h2
          className="text-[36px] font-semibold tracking-[-0.03em] leading-[1.08]"
          style={{ color: tokens.color.text }}
        >
          Sei dabei wenn<br />Imvestra startet.
        </h2>
        <p className="mt-4 text-base leading-relaxed" style={{ color: tokens.color.textMuted }}>
          Trage dich jetzt auf die Warteliste ein und erhalte
          Early Access sobald wir live gehen.
        </p>

        {state === "success" ? (
          <div className="mt-10">
            <CheckCircle size={40} color={tokens.color.positive} weight="fill" className="mx-auto" />
            <p className="text-xl font-semibold mt-4" style={{ color: tokens.color.text }}>
              Du bist auf der Liste!
            </p>
            <p className="text-sm mt-2" style={{ color: tokens.color.textMuted }}>
              {position && `Platz ${position}. `}Wir melden uns wenn es losgeht.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              className="w-full px-4 py-3 rounded-[10px] text-sm text-white placeholder:text-[#555555] focus:outline-none transition-all"
              style={{
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.borderStrong}`,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,200,150,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = tokens.color.borderStrong)}
            />
            {state === "error" && (
              <p className="text-xs mt-2 text-left" style={{ color: tokens.color.danger }}>
                {errorMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={state === "loading"}
              className="mt-3 w-full py-3 rounded-[10px] text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: tokens.color.accent,
                color: tokens.color.bg,
                boxShadow: tokens.shadow.accent,
              }}
            >
              {state === "loading" ? "Wird eingetragen..." : "Jetzt eintragen"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
