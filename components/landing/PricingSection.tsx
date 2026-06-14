import { CheckCircle, X } from "@phosphor-icons/react/dist/ssr";
import { tokens } from "@/lib/tokens";

function FeatureItem({ active, text }: { active: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {active ? (
        <CheckCircle size={15} color={tokens.color.positive} weight="fill" />
      ) : (
        <X size={15} color={tokens.color.textSubtle} weight="bold" />
      )}
      <span style={{ color: active ? tokens.color.text : tokens.color.textSubtle }}>{text}</span>
    </li>
  );
}

export default function PricingSection() {
  return (
    <section id="preise" className="py-24" style={{ background: tokens.color.bgSubtle }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="mb-12">
          <h2
            className="text-[34px] font-semibold tracking-[-0.03em]"
            style={{ color: tokens.color.text }}
          >
            Transparent. Fair.
          </h2>
          <p className="mt-3 text-base" style={{ color: tokens.color.textMuted }}>
            Kein Abo-Fallen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[900px]">

          {/* Free */}
          <div
            className="rounded-[16px] p-7"
            style={{
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: tokens.color.textSubtle }}>
              Free
            </p>
            <p className="mt-3 text-[38px] font-semibold leading-none" style={{ color: tokens.color.text }}>
              0€
            </p>
            <p className="text-sm mt-1" style={{ color: tokens.color.textSubtle }}>
              dauerhaft kostenlos
            </p>
            <div className="mt-5" style={{ borderTop: `1px solid ${tokens.color.border}` }} />
            <ul className="mt-5 flex flex-col gap-2.5">
              <FeatureItem active text="1 Objekt analysieren" />
              <FeatureItem active text="Vollständiger Rechner" />
              <FeatureItem active={false} text="Speichern & Portfolio" />
              <FeatureItem active={false} text="PDF Export" />
            </ul>
            <a
              href="#waitlist"
              className="mt-7 block w-full py-2.5 rounded-[8px] text-sm font-medium text-center transition-all"
              style={{
                background: tokens.color.surfaceHover,
                color: tokens.color.text,
                border: `1px solid ${tokens.color.borderStrong}`,
              }}
            >
              Kostenlos starten
            </a>
          </div>

          {/* Pro – featured */}
          <div
            className="rounded-[16px] p-7 relative"
            style={{
              background: tokens.color.accentSubtle,
              border: `1px solid ${tokens.color.borderAccent}`,
              boxShadow: tokens.shadow.accent,
            }}
          >
            <span
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap"
              style={{ background: tokens.color.accent, color: tokens.color.bg }}
            >
              Beliebteste Wahl
            </span>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: tokens.color.accent }}
            >
              Pro
            </p>
            <p className="mt-3 text-[38px] font-semibold leading-none" style={{ color: tokens.color.text }}>
              19€
            </p>
            <p className="text-sm mt-1" style={{ color: tokens.color.textMuted }}>
              pro Monat · oder 149€/Jahr
            </p>
            <div className="mt-5" style={{ borderTop: `1px solid ${tokens.color.borderAccent}` }} />
            <ul className="mt-5 flex flex-col gap-2.5">
              {[
                "Unbegrenzte Objekte",
                "Portfolio Dashboard",
                "PDF Bankpräsentation",
                "Finanzierungsanalyse",
                "Szenario-Vergleich",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm" style={{ color: tokens.color.text }}>
                  <CheckCircle size={15} color={tokens.color.positive} weight="fill" />
                  {t}
                </li>
              ))}
            </ul>
            <a
              href="#waitlist"
              className="mt-7 block w-full py-2.5 rounded-[8px] text-sm font-semibold text-center transition-all"
              style={{
                background: tokens.color.accent,
                color: tokens.color.bg,
              }}
            >
              Pro testen
            </a>
          </div>

          {/* Team */}
          <div
            className="rounded-[16px] p-7"
            style={{
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: tokens.color.textSubtle }}>
              Team
            </p>
            <p className="mt-3 text-[38px] font-semibold leading-none" style={{ color: tokens.color.text }}>
              49€
            </p>
            <p className="text-sm mt-1" style={{ color: tokens.color.textSubtle }}>
              pro Monat
            </p>
            <div className="mt-5" style={{ borderTop: `1px solid ${tokens.color.border}` }} />
            <ul className="mt-5 flex flex-col gap-2.5">
              <FeatureItem active text="Alles aus Pro" />
              <FeatureItem active text="Bis zu 5 Nutzer" />
              <FeatureItem active text="Shared Portfolio" />
              <FeatureItem active text="Rollen & Berechtigungen" />
            </ul>
            <a
              href="#waitlist"
              className="mt-7 block w-full py-2.5 rounded-[8px] text-sm font-medium text-center transition-all"
              style={{
                background: tokens.color.surfaceHover,
                color: tokens.color.text,
                border: `1px solid ${tokens.color.borderStrong}`,
              }}
            >
              Team starten
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
