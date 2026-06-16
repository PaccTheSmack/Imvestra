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
    <div className="bg-[#0A1A0A] border border-[rgba(0,224,215,0.15)] rounded-[14px] p-5 flex items-center justify-between gap-6 flex-wrap">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[rgba(0,224,215,0.1)] rounded-[10px] flex items-center justify-center flex-shrink-0">
          <Lightning size={18} color="#00E0D7" weight="fill" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            Du nutzt Imvestra {PLAN_CONFIG[currentPlan].name}
          </p>
          <p className="text-xs text-[#666] mt-0.5">
            Upgrade auf {nextConfig.name} für mehr Features.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => handleUpgrade(`${nextPlan}_yearly`)}
          disabled={!!loading}
          className="bg-[#00E0D7] text-[#080808] text-xs font-bold px-4 py-2 rounded-[8px] hover:bg-[#00C7BE] active:scale-[0.98] transition-all disabled:opacity-50 whitespace-nowrap"
        >
          {loading === `${nextPlan}_yearly`
            ? "Wird geladen…"
            : `${nextConfig.name} – ${nextConfig.price_yearly}€/Jahr`}
        </button>
        <button
          onClick={() => handleUpgrade(`${nextPlan}_monthly`)}
          disabled={!!loading}
          className="border border-[rgba(255,255,255,0.1)] text-[#888] text-xs font-medium px-4 py-2 rounded-[8px] hover:border-[rgba(255,255,255,0.2)] hover:text-white transition-all disabled:opacity-50 whitespace-nowrap"
        >
          {loading === `${nextPlan}_monthly`
            ? "Wird geladen…"
            : `${nextConfig.price_monthly}€/Mo`}
        </button>
      </div>
    </div>
  );
}
