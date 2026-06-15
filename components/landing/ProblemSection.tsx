"use client";

import { TrendDown, FolderOpen, Bank } from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import FadeIn from "@/components/ui/FadeIn";

const PROBLEMS: { Icon: PhosphorIcon; title: string; body: string }[] = [
  {
    Icon: TrendDown,
    title: "Falsche Renditeerwartung",
    body: "Instandhaltung, Verwaltung und Leerstand werden systematisch unterschätzt. Wer falsch rechnet, kauft falsch.",
  },
  {
    Icon: FolderOpen,
    title: "Kein Portfolio-Überblick",
    body: "Wer mehrere Objekte hält, verliert den Überblick über Cashflows, Zinsbindungen und steuerliche Fristen.",
  },
  {
    Icon: Bank,
    title: "Bankgespräche ohne Vorbereitung",
    body: "Ohne professionelle Unterlagen und klare Kennzahlen bekommst du schlechtere Konditionen – oder keine Finanzierung.",
  },
];

export default function ProblemSection() {
  return (
    <section id="problem" className="bg-[#080808] py-32">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
        {/* LEFT */}
        <div className="lg:sticky lg:top-32">
          <FadeIn direction="left">
            <div className="inline-flex bg-[#1A1A1A] border border-[rgba(255,255,255,0.08)] text-[#555] text-xs px-3 py-1 rounded-full mb-5">
              Das Problem
            </div>
            <h2 className="text-[42px] font-semibold tracking-[-0.03em] leading-[1.1] text-white mb-5">
              Immobilien-Investments<br />
              verzeihen<br />
              keine Fehler.
            </h2>
            <p className="text-base text-[#555] leading-relaxed max-w-[380px] mb-8">
              Die meisten Investoren rechnen mit Excel-Tabellen, Bauchgefühl oder
              gar nicht. Das kostet bares Geld und verhindert gute Deals.
            </p>
            <div className="border-l-2 border-[#00E0D7] pl-4 text-sm text-[#444] italic leading-relaxed">
              Der Druck, irgendwas nicht auf dem Schirm zu haben – eine Frist,
              eine Zinsbindung, eine schlechte Rendite – kostet Investoren
              jährlich Tausende Euro.
            </div>
          </FadeIn>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-3">
          {PROBLEMS.map(({ Icon, title, body }, i) => (
            <FadeIn key={title} delay={i * 0.1}>
              <div className="bg-[#111] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-6 hover:border-[rgba(255,255,255,0.12)] hover:bg-[#141414] transition-all duration-200 flex items-start gap-4">
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(255,68,68,0.08)] flex items-center justify-center flex-shrink-0">
                  <Icon size={18} color="#FF4444" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white mb-1.5">{title}</p>
                  <p className="text-sm text-[#555] leading-relaxed">{body}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
