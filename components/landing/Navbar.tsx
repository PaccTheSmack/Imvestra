"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { List, X } from "@phosphor-icons/react";

const NAV_LINKS = [
  { label: "Features", target: "features" },
  { label: "Produkt", target: "screenshots" },
  { label: "Preise", target: "preise" },
  { label: "FAQ", target: "faq" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={
        scrolled
          ? {
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(16,20,24,0.08)",
            }
          : { background: "transparent", borderBottom: "1px solid transparent" }
      }
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/imvestra-logo-horizontal.svg" alt="Imvestra" height={32} style={{ height: 32, width: "auto" }} />
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, target }) => (
            <button
              key={target}
              onClick={() => scrollTo(target)}
              className="text-sm transition-colors cursor-pointer"
              style={{ color: scrolled ? "#6A5A3A" : "rgba(255,255,255,0.65)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = scrolled ? "#101418" : "rgba(255,255,255,0.95)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = scrolled ? "#6A5A3A" : "rgba(255,255,255,0.65)"; }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm transition-colors"
            style={{ color: scrolled ? "#6A5A3A" : "rgba(255,255,255,0.65)" }}
          >
            Anmelden
          </Link>
          <motion.button
            whileHover={prefersReduced ? {} : { scale: 1.03 }}
            whileTap={prefersReduced ? {} : { scale: 0.97 }}
            onClick={() => scrollTo("waitlist")}
            className="bg-[#A07830] text-white font-semibold text-sm px-4 py-2 rounded-[8px] hover:bg-[#8A6420] transition-colors cursor-pointer"
            style={{ boxShadow: "0 4px 16px rgba(160,120,48,0.2)" }}
          >
            Kostenlos starten
          </motion.button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menü"
        >
          {mobileOpen ? <X size={20} color="#6A5A3A" /> : <List size={20} color="#6A5A3A" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-16 left-4 right-4 bg-white border border-[rgba(16,20,24,0.08)] rounded-[14px] p-4 flex flex-col gap-1"
            style={{ boxShadow: "0 8px 32px rgba(16,20,24,0.1)" }}
          >
            {NAV_LINKS.map(({ label, target }) => (
              <button
                key={target}
                onClick={() => {
                  setMobileOpen(false);
                  scrollTo(target);
                }}
                className="text-left text-sm text-[#6A5A3A] hover:text-[#101418] py-2.5 px-2 rounded-[8px] transition-colors"
              >
                {label}
              </button>
            ))}
            <Link
              href="/login"
              className="text-left text-sm text-[#6A5A3A] hover:text-[#101418] py-2.5 px-2 rounded-[8px] transition-colors"
            >
              Anmelden
            </Link>
            <button
              onClick={() => {
                setMobileOpen(false);
                scrollTo("waitlist");
              }}
              className="mt-2 bg-[#A07830] text-white font-semibold text-sm py-2.5 rounded-[8px] hover:bg-[#8A6420] transition-colors"
            >
              Kostenlos starten
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
