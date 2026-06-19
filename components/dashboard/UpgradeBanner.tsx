"use client";

import { useState } from "react";
import { Lightning } from "@phosphor-icons/react";
import type { Plan } from "@/types";
import { PLAN_CONFIG } from "@/types";

interface UpgradeBannerProps {
  currentPlan: Plan;
}

export default function UpgradeBanner({ currentPlan }: UpgradeBannerProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(planKey: string) {
    setLoading(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No URL returned:", data);
        setLoading(null);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setLoading(null);
    }
  }

  const nextPlan: Plan =
    currentPlan === "free"
      ? "investor"
      : currentPlan === "investor"
      ? "manager"
      : "team";
  const nextConfig = PLAN_CONFIG[nextPlan];

  return (
    <div className="border rounded-[14px] p-5 flex items-center justify-between gap-6 flex-wrap" style={{ background: "#F0EDE4", borderColor: "rgba(160,120,48,0.2)" }}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(160,120,48,0.1)" }}>
          <Lightning size={18} color="#A07830" weight="fill" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#101418]">
            Du nutzt Imvestra {PLAN_CONFIG[currentPlan].name}
          </p>
          <p className="text-xs text-[#6A5A3A] mt-0.5">
            Upgrade auf {nextConfig.name} für mehr Features.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => handleUpgrade(`${nextPlan}_yearly`)}
          disabled={!!loading}
          className="text-white text-xs font-bold px-4 py-2 rounded-[8px] active:scale-[0.98] transition-all disabled:opacity-50 whitespace-nowrap"
          style={{ background: "#A07830" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#8A6828")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#A07830")}
        >
          {loading === `${nextPlan}_yearly`
            ? "Wird geladen…"
            : "30 Tage gratis testen →"}
        </button>
        <button
          onClick={() => handleUpgrade(`${nextPlan}_monthly`)}
          disabled={!!loading}
          className="text-xs font-medium px-4 py-2 rounded-[8px] transition-all disabled:opacity-50 whitespace-nowrap"
          style={{ border: "1px solid rgba(160,120,48,0.2)", color: "#6A5A3A" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(160,120,48,0.4)"; e.currentTarget.style.color = "#A07830"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(160,120,48,0.2)"; e.currentTarget.style.color = "#6A5A3A"; }}
        >
          {loading === `${nextPlan}_monthly`
            ? "Wird geladen…"
            : `${nextConfig.price_monthly}€/Mo`}
        </button>
      </div>
    </div>
  );
}
