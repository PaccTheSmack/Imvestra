import {
  CheckSquare,
  ListChecks,
  Bell,
  Wrench,
  FileText,
} from "@phosphor-icons/react/dist/ssr";

const FEATURES = [
  {
    Icon: ListChecks,
    title: "Aufgaben-Tracker",
    body: "To-Dos pro Objekt anlegen und abhaken.",
  },
  {
    Icon: Bell,
    title: "Erinnerungen",
    body: "Wartung, Termine, Fristen nie vergessen.",
  },
  {
    Icon: Wrench,
    title: "Instandhaltungsplan",
    body: "Rucklage und geplante Masnahmen verwalten.",
  },
  {
    Icon: FileText,
    title: "Dokumentenverwaltung",
    body: "Mietvertrage, Rechnungen, Protokolle ablegen.",
  },
];

export default function AufgabenPage() {
  return (
    <div className="p-6 max-w-[1100px] mx-auto min-h-screen" style={{ background: "#080808" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(29,184,122,0.08)",
            border: "1px solid rgba(29,184,122,0.12)",
          }}
        >
          <CheckSquare size={18} color="#1DB87A" />
        </div>
        <h1 className="text-[20px] font-semibold text-white tracking-[-0.02em]">
          Aufgaben
        </h1>
        <span
          className="text-[10px] font-medium px-2.5 py-1 rounded-full ml-1"
          style={{
            background: "#1A1A1A",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#555",
          }}
        >
          Bald verfugbar
        </span>
      </div>

      {/* Teaser card */}
      <div
        className="rounded-[16px] p-8 max-w-[600px]"
        style={{
          background: "#111",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p
          className="text-xs uppercase tracking-widest mb-5"
          style={{ color: "#444" }}
        >
          Was dich erwartet:
        </p>

        <div className="flex flex-col gap-4">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: "#1A1A1A" }}
              >
                <Icon size={15} color="#555" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs mt-0.5" style={{ color: "#555" }}>{body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs mt-8" style={{ color: "#444" }}>
          Uber Launch informieren
        </p>
      </div>
    </div>
  );
}
