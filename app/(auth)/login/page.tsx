"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "@/lib/auth-actions";
import { tokens } from "@/lib/tokens";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) setError(result.error);
    });
  }

  const inputClass = [
    "w-full rounded-[8px] px-4 py-2.5 text-sm text-[#101418] placeholder:text-[#A89A7A]",
    "focus:outline-none transition-all mt-1 block",
  ].join(" ");

  return (
    <div className="min-h-screen flex" style={{ background: "#F8F7F4" }}>
      {/* Left panel */}
      <div
        className="hidden md:flex w-[40%] flex-col items-center justify-center px-12 relative overflow-hidden"
        style={{ background: "#18160E" }}
      >
        {/* Subtle radial decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(160,120,48,0.04) 0%, transparent 70%)" }}
        />
        <Image
          src="/logo.svg"
          alt="Imvestra"
          width={160}
          height={42}
          priority
          style={{ filter: "brightness(0) saturate(100%) invert(75%) sepia(40%) saturate(600%) hue-rotate(15deg) brightness(90%)" }}
        />
        <p
          className="text-xl font-light max-w-xs text-center mt-8 leading-snug"
          style={{ color: "#F8F7F4" }}
        >
          Renditerechner und Portfolio-Tool für Immobilien-Investoren
        </p>
        <ul className="mt-6 space-y-3">
          {[
            "Cashflow & Rendite auf einen Blick",
            "Professionelle PDF-Berichte",
            "Portfolio-Übersicht für alle Objekte",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(248,247,244,0.5)" }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(160,120,48,0.15)" }}>
                <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                  <path d="M1 3.5L3 5.5L7 1.5" stroke="#C9A86A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Right – form */}
      <div
        className="flex-1 flex items-center justify-center px-6"
        style={{ background: "#F8F7F4" }}
      >
        <div
          className="max-w-sm w-full rounded-[16px] p-8"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(16,20,24,0.08)",
            boxShadow: "0 1px 3px rgba(16,20,24,0.06), 0 4px 16px rgba(16,20,24,0.04)",
          }}
        >
          <div className="flex justify-center mb-8 md:hidden">
            <Image
              src="/logo.svg"
              alt="Imvestra"
              width={100}
              height={26}
              priority
              style={{ filter: "brightness(0) saturate(100%) invert(35%) sepia(60%) saturate(500%) hue-rotate(15deg) brightness(80%)" }}
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: tokens.color.text }}>
            Willkommen zurück
          </h1>
          <p className="text-sm mt-2" style={{ color: tokens.color.textMuted }}>
            Noch kein Konto?{" "}
            <Link
              href="/register"
              className="font-medium transition-colors"
              style={{ color: tokens.color.accent }}
            >
              Registrieren
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium block"
                style={{ color: tokens.color.textMuted }}
              >
                E-Mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@email.de"
                className={inputClass}
                style={{
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(160,120,48,0.3)";
                  e.currentTarget.style.background = tokens.color.surfaceHover;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = tokens.color.border;
                  e.currentTarget.style.background = tokens.color.surface;
                }}
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: tokens.color.textMuted }}
                >
                  Passwort
                </label>
                <span className="text-xs cursor-pointer hover:underline" style={{ color: tokens.color.textSubtle }}>
                  Passwort vergessen?
                </span>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className={inputClass}
                style={{
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(160,120,48,0.3)";
                  e.currentTarget.style.background = tokens.color.surfaceHover;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = tokens.color.border;
                  e.currentTarget.style.background = tokens.color.surface;
                }}
              />
            </div>
            {error && (
              <p className="text-sm" style={{ color: tokens.color.danger }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="w-full font-semibold py-3 rounded-[10px] text-sm transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{
                background: tokens.color.accent,
                color: tokens.color.bg,
                boxShadow: tokens.shadow.accent,
              }}
            >
              {isPending ? "Anmelden..." : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
