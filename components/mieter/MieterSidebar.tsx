"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  House,
  CurrencyEur,
  FolderOpen,
  Gauge,
  Wrench,
  ChatCircle,
  SignOut,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface Props {
  mieterName: string;
  propertyName: string;
}

export default function MieterSidebar({ mieterName, propertyName }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    {
      icon: <House size={18} weight="duotone" />,
      label: "Übersicht",
      href: "/mieter/dashboard",
    },
    {
      icon: <CurrencyEur size={18} weight="duotone" />,
      label: "Meine Miete",
      href: "/mieter/miete",
    },
    {
      icon: <FolderOpen size={18} weight="duotone" />,
      label: "Dokumente",
      href: "/mieter/dokumente",
    },
    {
      icon: <Gauge size={18} weight="duotone" />,
      label: "Zähler",
      href: "/mieter/zaehler",
    },
    {
      icon: <Wrench size={18} weight="duotone" />,
      label: "Anfragen",
      href: "/mieter/anfragen",
    },
    {
      icon: <ChatCircle size={18} weight="duotone" />,
      label: "Nachrichten",
      href: "/mieter/nachrichten",
    },
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/mieter/login");
    router.refresh();
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 240,
        height: "100vh",
        backgroundColor: "#fff",
        borderRight: "1px solid rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: "#00897B", letterSpacing: "-0.3px" }}>
          Imvestra
        </div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, fontWeight: 500 }}>
          MIETERPORTAL
        </div>
        {propertyName && (
          <div
            style={{
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 10px",
              backgroundColor: "#F0FDFB",
              border: "1px solid rgba(0,137,123,0.2)",
              borderRadius: 20,
              fontSize: 12,
              color: "#00897B",
              fontWeight: 500,
            }}
          >
            {propertyName}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#00897B" : "#4B5563",
                backgroundColor: isActive ? "#E0F2F1" : "transparent",
                textDecoration: "none",
                transition: "background-color 0.12s, color 0.12s",
              }}
            >
              <span style={{ color: isActive ? "#00BFA5" : "#9CA3AF" }}>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Bottom user area */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>
          {mieterName}
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>Mieter</div>
        <button
          onClick={handleSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "8px 10px",
            backgroundColor: "transparent",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 7,
            fontSize: 13,
            color: "#6B7280",
            cursor: "pointer",
            transition: "background-color 0.12s",
          }}
        >
          <SignOut size={15} />
          Abmelden
        </button>
      </div>
    </div>
  );
}
