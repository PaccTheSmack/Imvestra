import { TrendDown, FolderOpen, Bank } from "@phosphor-icons/react/dist/ssr";
import { tokens } from "@/lib/tokens";

const problems = [
  {
    Icon: TrendDown,
    title: "Falsche Renditeerwartung",
    text: "Versteckte Kosten und Leerstand werden unterschätzt. Wer falsch rechnet, kauft falsch.",
  },
  {
    Icon: FolderOpen,
    title: "Kein Portfolio-Überblick",
    text: "Wer mehrere Objekte hält, verliert schnell den Überblick über Cashflows und Zinsbindungen.",
  },
  {
    Icon: Bank,
    title: "Bankgespräche ohne Vorbereitung",
    text: "Ohne professionelle Unterlagen wirken Investoren unvorbereitet - und bekommen schlechtere Konditionen.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-24" style={{ background: tokens.color.bgSubtle }}>
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-16 items-start">

        {/* Left – sticky label */}
        <div className="lg:sticky lg:top-32">
          <h2
            className="text-[34px] font-semibold leading-[1.1] tracking-[-0.03em]"
            style={{ color: tokens.color.text }}
          >
            Excel-Chaos<br />war gestern.
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: tokens.color.textMuted }}>
            Die meisten Investoren rechnen mit Bauchgefühl oder gar nicht.
            Das kostet bares Geld.
          </p>
        </div>

        {/* Right – problem rows */}
        <div
          className="rounded-[14px] overflow-hidden"
          style={{ border: `1px solid ${tokens.color.border}` }}
        >
          {problems.map(({ Icon, title, text }, i) => (
            <div
              key={title}
              className="px-6 py-5 flex items-start gap-4"
              style={{
                background: tokens.color.surface,
                borderTop: i > 0 ? `1px solid ${tokens.color.border}` : "none",
              }}
            >
              <div
                className="w-9 h-9 rounded-[8px] flex-shrink-0 flex items-center justify-center"
                style={{ background: tokens.color.dangerBg }}
              >
                <Icon size={18} color={tokens.color.danger} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: tokens.color.text }}>
                  {title}
                </p>
                <p className="text-sm mt-0.5 leading-relaxed" style={{ color: tokens.color.textMuted }}>
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
