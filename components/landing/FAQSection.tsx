"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CaretDown } from "@phosphor-icons/react";
import FadeIn from "@/components/ui/FadeIn";

const FAQS = [
  {
    q: "Was kostet Imvestra?",
    a: "Free ist dauerhaft kostenlos für 1 Objekt. Pro kostet 19 €/Monat oder 149 €/Jahr (34% gespart). Jederzeit kündbar.",
  },
  {
    q: "Wo werden meine Daten gespeichert?",
    a: "Alle Daten liegen auf europäischen Servern in Frankfurt (AWS eu-central-1). DSGVO-konform, SSL-verschlüsselt, keine Weitergabe an Dritte.",
  },
  {
    q: "Kann ich jederzeit kündigen?",
    a: "Ja. Kein Mindestvertrag, keine Kündigungsfristen, keine versteckten Gebühren. Kündigung in den Einstellungen.",
  },
  {
    q: "Ist Imvestra für Einsteiger geeignet?",
    a: "Absolut. Kaufpreis, Miete und Fläche eingeben – alle Kennzahlen erscheinen sofort. Keine Vorkenntnisse nötig.",
  },
  {
    q: "Welche Immobilientypen werden unterstützt?",
    a: "ETW, MFH, EFH, DHH und Gewerbe. Alle gängigen deutschen Immobilientypen.",
  },
  {
    q: "Wie genau sind die Standortdaten?",
    a: "Die Daten basieren auf öffentlichen Marktberichten (Stand 2026). Als Orientierung sehr gut geeignet. Für individuelle Bewertungen empfehlen wir zusätzlich einen lokalen Makler oder Gutachter.",
  },
  {
    q: "Gibt es eine mobile App?",
    a: "Imvestra läuft vollständig im Browser – auch auf dem Smartphone. Eine native iOS/Android App ist in Planung.",
  },
  {
    q: "Was ist die Smart Task Engine?",
    a: "Imvestra liest deine Finanzierungen, Mietverträge und Fristen und erstellt automatisch Aufgaben und Warnungen – z.B. wenn eine Zinsbindung ausläuft oder eine Nebenkostenabrechnung fällig wird.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-[#F8F7F4] py-32">
      <div className="max-w-[680px] mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <span className="inline-flex bg-white border border-[rgba(16,20,24,0.08)] text-[#A89A7A] text-xs px-3 py-1 rounded-full">
              FAQ
            </span>
            <h2 className="text-[44px] font-semibold tracking-[-0.03em] text-[#101418] mt-4">
              Häufige Fragen.
            </h2>
          </div>
        </FadeIn>

        <div>
          {FAQS.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={item.q} className="border-b border-[rgba(16,20,24,0.08)]">
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="w-full flex justify-between items-center py-5 cursor-pointer text-left"
                >
                  <span className="text-base font-medium text-[#101418] pr-4">{item.q}</span>
                  <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                    <CaretDown size={18} color="#A89A7A" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: "hidden" }}
                    >
                      <p className="pb-5 text-sm text-[#6A5A3A] leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
