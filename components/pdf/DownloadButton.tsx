"use client";

import { useState } from "react";
import { FilePdf } from "@phosphor-icons/react";
import type { CalculationResult, Financing, TilgungsplanRow, AfAResult } from "@/types";

export interface DownloadData {
  propertyName: string;
  address?: string;
  type?: string;
  purchase_price: number;
  rent_monthly: number;
  sqm?: number;
  result: CalculationResult;
  financing?: Financing;
  tilgungsplan?: TilgungsplanRow[];
  afa?: AfAResult;
  kaufdatum?: string;
  steuersatz?: number;
}

interface DownloadButtonProps {
  propertyName?: string;
  className?: string;
  data?: DownloadData;
}

export default function DownloadButton({ propertyName, className, data }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!data) return;
    setLoading(true);
    try {
      const [{ pdf }, { default: PropertyReport }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./PropertyReport"),
      ]);
      const { createElement } = await import("react");
      // pdf() expects DocumentProps element; PropertyReport wraps Document at runtime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(createElement(PropertyReport, data) as any).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Imvestra-${data.propertyName.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setLoading(false);
  }

  const cls = `flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-[8px] border border-[rgba(255,255,255,0.1)] bg-[#141414] text-white hover:border-[rgba(255,255,255,0.18)] hover:bg-[#1A1A1A] active:scale-[0.98] transition-all disabled:opacity-60 ${className ?? ""}`;

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title={propertyName ? `PDF für ${propertyName}` : "PDF exportieren"}
      className={cls}
    >
      <FilePdf size={14} color="#FF4444" />
      {loading ? "Wird erstellt…" : "PDF exportieren"}
    </button>
  );
}
