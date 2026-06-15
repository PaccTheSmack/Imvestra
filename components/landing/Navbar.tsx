"use client";

import Image from "next/image";
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
              background: "rgba(8,8,8,0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }
          : { background: "transparent", borderBottom: "1px solid transparent" }
      }
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image src="/logo.svg" alt="Imvestra" width={110} height={28} priority />
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, target }) => (
            <button
              key={target}
              onClick={() => scrollTo(target)}
              className="text-sm text-[#666] hover:text-white transition-colors cursor-pointer"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[#666] hover:text-white transition-colors"
          >
            Anmelden
          </Link>
          <motion.button
            whileHover={prefersReduced ? {} : { scale: 1.03 }}
            whileTap={prefersReduced ? {} : { scale: 0.97 }}
            onClick={() => scrollTo("waitlist")}
            className="bg-[#00E0D7] text-[#080808] font-semibold text-sm px-4 py-2 rounded-[8px] hover:bg-[#00C7BE] transition-colors"
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
          {mobileOpen ? <X size={20} color="#666" /> : <List size={20} color="#666" />}
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
            className="md:hidden absolute top-16 left-4 right-4 bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-4 flex flex-col gap-1"
          >
            {NAV_LINKS.map(({ label, target }) => (
              <button
                key={target}
                onClick={() => {
                  setMobileOpen(false);
                  scrollTo(target);
                }}
                className="text-left text-sm text-[#888] hover:text-white py-2.5 px-2 rounded-[8px] transition-colors"
              >
                {label}
              </button>
            ))}
            <Link
              href="/login"
              className="text-left text-sm text-[#888] hover:text-white py-2.5 px-2 rounded-[8px] transition-colors"
            >
              Anmelden
            </Link>
            <button
              onClick={() => {
                setMobileOpen(false);
                scrollTo("waitlist");
              }}
              className="mt-2 bg-[#00E0D7] text-[#080808] font-semibold text-sm py-2.5 rounded-[8px] hover:bg-[#00C7BE] transition-colors"
            >
              Kostenlos starten
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
