"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightning } from "@phosphor-icons/react";
import { tokens } from "@/lib/tokens";

export default function UpgradeBanner() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpgrade(planKey: string) {
    setLoading(planKey);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey }),
    });
    const data = await res.json();
    if (data.url) router.push(data.url);
    else setLoading(null);
  }

  return (
    <div
      className="rounded-[14px] p-6 flex items-center justify-between"
      style={{
        background: tokens.color.accentSubtle,
        border: `1px solid ${tokens.color.borderAccent}`,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: tokens.color.accentMuted }}
        >
          <Lightning size={20} color={tokens.color.accent} weight="fill" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
            Du nutzt Imvestra Free
          </p>
          <p className="text-xs mt-0.5" style={{ color: tokens.color.textMuted }}>
            Upgrade auf Pro für unbegrenzte Objekte, Portfolio und PDF-Export.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-6">
        <button
          onClick={() => handleUpgrade("pro_yearly")}
          disabled={!!loading}
          className="text-xs font-semibold px-4 py-2 rounded-[8px] transition-all disabled:opacity-60 whitespace-nowrap active:scale-[0.98]"
          style={{
            background: tokens.color.accent,
            color: tokens.color.bg,
          }}
        >
          {loading === "pro_yearly" ? "Wird geladen..." : "Pro - 149 €/Jahr"}
        </button>
        <button
          onClick={() => handleUpgrade("pro_monthly")}
          disabled={!!loading}
          className="text-xs font-medium px-4 py-2 rounded-[8px] transition-all disabled:opacity-60 whitespace-nowrap active:scale-[0.98]"
          style={{
            background: tokens.color.accentMuted,
            color: tokens.color.accent,
            border: `1px solid ${tokens.color.borderAccent}`,
          }}
        >
          {loading === "pro_monthly" ? "Wird geladen..." : "19 €/Monat"}
        </button>
      </div>
    </div>
  );
}
