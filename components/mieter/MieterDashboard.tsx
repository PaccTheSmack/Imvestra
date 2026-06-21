"use client";

import { motion } from "motion/react";
import { CurrencyEur, Wrench, ChartLine, ArrowRight } from "@phosphor-icons/react";

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
}

interface Props {
  mieterName: string;
  rentMonthly: number | null;
  nextDueDate: string | null;
  recentPayments: Payment[];
  openAnfragenCount: number;
  letzterZaehlerstand: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    paid: { label: "Bezahlt", bg: "#D1FAE5", color: "#065F46" },
    pending: { label: "Ausstehend", bg: "#FEF3C7", color: "#92400E" },
    late: { label: "Verspätet", bg: "#FEE2E2", color: "#991B1B" },
  };

  const c = config[status] || { label: status, bg: "#F3F4F6", color: "#374151" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        backgroundColor: c.bg,
        color: c.color,
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {c.label}
    </span>
  );
}

export default function MieterDashboard({
  mieterName,
  rentMonthly,
  nextDueDate,
  recentPayments,
  openAnfragenCount,
  letzterZaehlerstand,
}: Props) {
  const statCards = [
    {
      icon: <CurrencyEur size={20} weight="duotone" />,
      label: "Nächste Miete",
      value: rentMonthly ? formatCurrency(rentMonthly) : "—",
      sub: nextDueDate ? `Fällig am ${formatDate(nextDueDate)}` : "Kein ausstehender Betrag",
      color: "#00897B",
      bg: "#E0F2F1",
    },
    {
      icon: <Wrench size={20} weight="duotone" />,
      label: "Meine Anfragen",
      value: openAnfragenCount.toString(),
      sub: openAnfragenCount === 1 ? "Offene Anfrage" : "Offene Anfragen",
      color: "#F59E0B",
      bg: "#FEF3C7",
    },
    {
      icon: <ChartLine size={20} weight="duotone" />,
      label: "Letzter Zählerstand",
      value: letzterZaehlerstand ? formatDate(letzterZaehlerstand) : "Noch keiner",
      sub: letzterZaehlerstand ? "Letzter Eintrag" : "Kein Eintrag vorhanden",
      color: "#6366F1",
      bg: "#EEF2FF",
    },
  ];

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: 32 }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.4px",
          }}
        >
          Guten Tag, {mieterName}!
        </h1>
        <p style={{ fontSize: 15, color: "#6B7280", marginTop: 4 }}>
          Hier ist eine Übersicht Ihres Mietkontos.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: 14,
              padding: "20px 24px",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: card.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: card.color,
                marginBottom: 14,
              }}
            >
              {card.icon}
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginBottom: 4 }}>
              {card.label}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.3px",
                marginBottom: 4,
              }}
            >
              {card.value}
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>{card.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent payments */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 14,
          padding: "24px 28px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Letzte Zahlungen</h2>
          <a
            href="/mieter/miete"
            style={{
              fontSize: 13,
              color: "#00897B",
              textDecoration: "none",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Alle anzeigen <ArrowRight size={14} />
          </a>
        </div>

        {recentPayments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#9CA3AF", fontSize: 14 }}>
            Noch keine Zahlungen vorhanden
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentPayments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  backgroundColor: "#F9FAFB",
                  borderRadius: 9,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                    {formatCurrency(payment.amount)}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                    Fällig: {formatDate(payment.due_date)}
                  </div>
                </div>
                <StatusBadge status={payment.status} />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.26 }}
        style={{ display: "flex", gap: 12 }}
      >
        <a
          href="/mieter/zaehler"
          style={{
            flex: 1,
            padding: "14px 20px",
            backgroundColor: "#00897B",
            color: "#fff",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            textAlign: "center",
            transition: "background-color 0.15s",
          }}
        >
          Zähler melden
        </a>
        <a
          href="/mieter/anfragen"
          style={{
            flex: 1,
            padding: "14px 20px",
            backgroundColor: "#fff",
            color: "#00897B",
            border: "1px solid #00897B",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            textAlign: "center",
            transition: "background-color 0.15s",
          }}
        >
          Anfrage stellen
        </a>
      </motion.div>
    </div>
  );
}
