"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { signUp } from "@/lib/auth-actions";
import { tokens } from "@/lib/tokens";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) setError(result.error);
    });
  }

  const inputClass = [
    "w-full rounded-[8px] px-4 py-2.5 text-sm text-white placeholder:text-[#555555]",
    "focus:outline-none transition-all mt-1 block",
  ].join(" ");

  return (
    <div className="min-h-screen flex" style={{ background: tokens.color.bg }}>
      {/* Left panel */}
      <div
        className="hidden md:flex w-1/2 flex-col items-center justify-center px-12"
        style={{ background: tokens.color.bgSubtle, borderRight: `1px solid ${tokens.color.border}` }}
      >
        <Image
          src="/logo.svg"
          alt="Imvestra"
          width={160}
          height={42}
          style={{ filter: tokens.logoFilter }}
          priority
        />
        <p
          className="text-xl font-medium max-w-xs text-center mt-8 leading-snug"
          style={{ color: tokens.color.text }}
        >
          Starte kostenlos - keine Kreditkarte nötig
        </p>
        <ul className="mt-6 space-y-3">
          {[
            "Cashflow & Rendite auf einen Blick",
            "Professionelle PDF-Berichte",
            "Portfolio-Übersicht für alle Objekte",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: tokens.color.textMuted }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: tokens.color.accentMuted }}>
                <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                  <path d="M1 3.5L3 5.5L7 1.5" stroke="#00C896" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
        style={{ background: tokens.color.bg }}
      >
        <div className="max-w-sm w-full">
          <div className="flex justify-center mb-8 md:hidden">
            <Image
              src="/logo.svg"
              alt="Imvestra"
              width={100}
              height={26}
              style={{ filter: tokens.logoFilter }}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: tokens.color.text }}>
            Konto erstellen
          </h1>
          <p className="text-sm mt-2" style={{ color: tokens.color.textMuted }}>
            Bereits registriert?{" "}
            <Link
              href="/login"
              className="font-medium transition-colors"
              style={{ color: tokens.color.accent }}
            >
              Anmelden
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="text-xs font-medium uppercase tracking-wide block"
                style={{ color: tokens.color.textMuted }}
              >
                Vollständiger Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Max Mustermann"
                className={inputClass}
                style={{
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,200,150,0.4)";
                  e.currentTarget.style.background = tokens.color.surfaceHover;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = tokens.color.border;
                  e.currentTarget.style.background = tokens.color.surface;
                }}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-wide block"
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
                  e.currentTarget.style.borderColor = "rgba(0,200,150,0.4)";
                  e.currentTarget.style.background = tokens.color.surfaceHover;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = tokens.color.border;
                  e.currentTarget.style.background = tokens.color.surface;
                }}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-wide block"
                style={{ color: tokens.color.textMuted }}
              >
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Mindestens 8 Zeichen"
                className={inputClass}
                style={{
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,200,150,0.4)";
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
              {isPending ? "Wird erstellt..." : "Konto erstellen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
