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
  background: "linear-gradient(135deg, #00E0D7 0%, #007A74 100%)",
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
    <section id="waitlist" className="bg-[#080808] py-32 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 120%, rgba(0,224,215,0.08) 0%, rgba(0,224,215,0.03) 40%, transparent 65%), radial-gradient(ellipse 60% 50% at 30% 100%, rgba(0,224,215,0.04) 0%, transparent 55%)",
        }}
      />
      <div className="max-w-[640px] mx-auto px-6 text-center relative z-10">
        <FadeIn>
          <span className="inline-flex bg-[rgba(0,224,215,0.08)] border border-[rgba(0,224,215,0.15)] text-[#00E0D7] text-xs px-3 py-1 rounded-full">
            Jetzt starten
          </span>
          <h2 className="text-[48px] font-semibold tracking-[-0.04em] leading-[1.05] text-white mt-4">
            Damit kein Detail<br />
            zum teuren<br />
            <span style={GRADIENT_TEXT}>Fehler</span> wird.
          </h2>
          <p className="mt-5 text-[#777] text-lg leading-relaxed">
            30 Tage kostenlos testen. Kein Risiko. Jederzeit kündbar.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={prefersReduced ? {} : { scale: 1.02 }}
              whileTap={prefersReduced ? {} : { scale: 0.97 }}
              onClick={() => router.push("/register")}
              className="bg-[#00E0D7] text-[#080808] font-bold px-8 py-4 rounded-[12px] text-base"
              style={{ boxShadow: "0 0 40px rgba(0,224,215,0.2)" }}
            >
              Jetzt starten →
            </motion.button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="border border-[rgba(255,255,255,0.12)] text-white px-8 py-4 rounded-[12px] text-base hover:bg-[#111] transition-all"
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
                    <CheckCircle size={32} color="#00E0D7" weight="fill" className="mx-auto" />
                    <p className="text-xl font-semibold text-white mt-3">Du bist dabei!</p>
                    <p className="text-sm text-[#777] mt-1">Wir melden uns sobald Imvestra startet.</p>
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
                        className="flex-1 bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-4 py-3 text-sm text-white placeholder:text-[#777] focus:outline-none focus:border-[rgba(0,224,215,0.4)] transition-all"
                      />
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="bg-[#00E0D7] text-[#080808] font-semibold px-5 py-3 rounded-[10px] text-sm hover:bg-[#00C7BE] transition-colors disabled:opacity-60"
                      >
                        {status === "loading" ? "…" : "Eintragen"}
                      </button>
                    </div>
                    {status === "error" && (
                      <p className="text-xs text-[#FF4444]">{errorMsg}</p>
                    )}
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 flex justify-center gap-8 flex-wrap">
            {TRUST.map(({ Icon, label }) => (
              <div key={label} className="text-xs text-[#555] flex items-center gap-1.5">
                <Icon size={13} color="#555" />
                {label}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
