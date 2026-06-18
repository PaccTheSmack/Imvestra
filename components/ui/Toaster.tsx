"use client";

import { Toaster as SonnerToaster } from "sonner";
import { tokens } from "@/lib/tokens";

export default function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          color: tokens.color.text,
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          borderRadius: "14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)",
        },
        classNames: {
          success: "toast-success",
          error: "toast-error",
          warning: "toast-warning",
          info: "toast-info",
        },
      }}
      theme="dark"
      richColors
    />
  );
}
