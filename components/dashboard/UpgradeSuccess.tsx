"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { tokens } from "@/lib/tokens";

export default function UpgradeSuccess() {
  const params = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (params.get("upgraded") === "true") {
      setShow(true);
      setTimeout(() => setShow(false), 5000);
    }
  }, [params]);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 rounded-[12px] px-5 py-4 flex items-center gap-3"
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.borderAccent}`,
        boxShadow: tokens.shadow.lg,
      }}
    >
      <CheckCircle size={20} color={tokens.color.positive} weight="fill" />
      <div>
        <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
          Upgrade erfolgreich!
        </p>
        <p className="text-xs mt-0.5" style={{ color: tokens.color.textMuted }}>
          Willkommen bei Imvestra Pro.
        </p>
      </div>
    </div>
  );
}
