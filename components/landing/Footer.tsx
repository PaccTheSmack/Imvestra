import Link from "next/link";

const COLUMNS = [
  {
    heading: "Produkt",
    links: [
      { label: "Renditerechner", href: "#features" },
      { label: "Standortanalyse", href: "#features" },
      { label: "PDF Export", href: "#features" },
      { label: "Portfolio", href: "#features" },
      { label: "Preise", href: "#preise" },
    ],
  },
  {
    heading: "Unternehmen",
    links: [
      { label: "Impressum", href: "/impressum" },
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "AGB", href: "/agb" },
      { label: "Kontakt", href: "mailto:info@imvestra.de" },
    ],
  },
  {
    heading: "Ressourcen",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "Support", href: "mailto:support@imvestra.de" },
      { label: "Blog (demnächst)", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#F0EDE4] border-t border-[rgba(16,20,24,0.08)]">
      {/* Top */}
      <div className="py-12 max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/imvestra-logo-horizontal.svg" alt="Imvestra" style={{ height: 28, width: "auto" }} />
          <p className="mt-4 text-sm text-[#6A5A3A] leading-relaxed max-w-[200px]">
            Das Betriebssystem für Immobilieninvestoren.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <p className="text-xs text-[#A89A7A] uppercase tracking-widest mb-4 font-semibold">
              {col.heading}
            </p>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#6A5A3A] hover:text-[#101418] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="py-6 border-t border-[rgba(16,20,24,0.08)] max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-xs text-[#A89A7A]">© 2026 Imvestra. Alle Rechte vorbehalten.</p>
        <p className="text-xs text-[#A89A7A]">Nicht als Finanzberatung zu verstehen.</p>
      </div>
    </footer>
  );
}
