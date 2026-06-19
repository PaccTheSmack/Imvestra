"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  CheckCircle,
  ShieldCheck,
  Lock,
  Buildings,
  CreditCard,
} from "@phosphor-icons/react";
import FadeIn from "@/components/ui/FadeIn";

const GRADIENT_TEXT: React.CSSProperties = {
  background: "linear-gradient(135deg, #C9A86A 0%, #A07830 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const TRUST = [
  { Icon: ShieldCheck, label: "DSGVO" },
  { Icon: Lock, label: "SSL" },
  { Icon: Buildings, label: "Frankfurt" },
  { Icon: CreditCard, label: "Stripe" },
];

export default function WaitlistSection() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.message === "Already on waitlist" ? "Du stehst bereits auf der Warteliste." : "Bitte gültige E-Mail eingeben.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Etwas ist schiefgelaufen. Bitte erneut versuchen.");
    }
  }

  return (
    <section id="waitlist" className="py-32 relative overflow-hidden" style={{ background: "#18160E" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 120%, rgba(160,120,48,0.12) 0%, rgba(160,120,48,0.05) 40%, transparent 65%), radial-gradient(ellipse 60% 50% at 30% 100%, rgba(160,120,48,0.06) 0%, transparent 55%)",
        }}
      />
      <div className="max-w-[640px] mx-auto px-6 text-center relative z-10">
        <FadeIn>
          <span className="inline-flex bg-[rgba(201,168,106,0.1)] border border-[rgba(201,168,106,0.2)] text-[#C9A86A] text-xs px-3 py-1 rounded-full">
            Jetzt starten
          </span>
          <h2 className="text-[48px] font-semibold tracking-[-0.04em] leading-[1.05] text-[#F8F7F4] mt-4">
            Damit kein Detail<br />
            zum teuren<br />
            <span style={GRADIENT_TEXT}>Fehler</span> wird.
          </h2>
          <p className="mt-5 text-[rgba(248,247,244,0.5)] text-lg leading-relaxed">
            30 Tage kostenlos testen. Kein Risiko. Jederzeit kündbar.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={prefersReduced ? {} : { scale: 1.02 }}
              whileTap={prefersReduced ? {} : { scale: 0.97 }}
              onClick={() => router.push("/register")}
              className="bg-[#A07830] text-white font-bold px-8 py-4 rounded-[12px] text-base cursor-pointer hover:bg-[#8A6420] transition-colors"
              style={{ boxShadow: "0 0 40px rgba(160,120,48,0.3)" }}
            >
              Jetzt starten →
            </motion.button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="border border-[rgba(248,247,244,0.12)] text-[#F8F7F4] px-8 py-4 rounded-[12px] text-base hover:bg-[rgba(248,247,244,0.05)] transition-all cursor-pointer"
            >
              Auf Warteliste eintragen
            </button>
          </div>

          {/* Waitlist form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden" }}
                className="mt-8 max-w-[400px] mx-auto"
              >
                {status === "success" ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle size={32} color="#C9A86A" weight="fill" className="mx-auto" />
                    <p className="text-xl font-semibold text-[#F8F7F4] mt-3">Du bist dabei!</p>
                    <p className="text-sm text-[rgba(248,247,244,0.5)] mt-1">Wir melden uns sobald Imvestra startet.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={submit} className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="deine@email.de"
                        className="flex-1 rounded-[10px] px-4 py-3 text-sm text-[#F8F7F4] focus:outline-none transition-all"
                        style={{
                          background: "rgba(248,247,244,0.07)",
                          border: "1px solid rgba(248,247,244,0.1)",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,106,0.4)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(248,247,244,0.1)")}
                      />
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="bg-[#A07830] text-white font-semibold px-5 py-3 rounded-[10px] text-sm hover:bg-[#8A6420] transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        {status === "loading" ? "…" : "Eintragen"}
                      </button>
                    </div>
                    {status === "error" && (
                      <p className="text-xs text-[#FF6B6B]">{errorMsg}</p>
                    )}
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 flex justify-center gap-8 flex-wrap">
            {TRUST.map(({ Icon, label }) => (
              <div key={label} className="text-xs text-[rgba(248,247,244,0.35)] flex items-center gap-1.5">
                <Icon size={13} color="rgba(248,247,244,0.35)" />
                {label}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
