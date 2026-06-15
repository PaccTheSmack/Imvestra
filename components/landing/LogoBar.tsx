import { ShieldCheck, Lock, Buildings, CreditCard } from "@phosphor-icons/react/dist/ssr";

const ITEMS = [
  { Icon: ShieldCheck, label: "DSGVO-konform" },
  { Icon: Lock, label: "SSL verschlüsselt" },
  { Icon: Buildings, label: "Server Frankfurt" },
  { Icon: CreditCard, label: "Stripe Payments" },
];

export default function LogoBar() {
  return (
    <div className="border-y border-[rgba(255,255,255,0.06)] bg-[#0A0A0A] py-6">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between flex-wrap gap-6">
        <p className="text-xs text-[#555] uppercase tracking-widest">
          Vertrauen durch Technologie
        </p>
        <div className="flex items-center gap-8 flex-wrap">
          {ITEMS.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={15} color="#666" />
              <span className="text-sm text-[#666]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
