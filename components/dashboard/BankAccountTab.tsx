"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Bank,
  ArrowClockwise,
  CheckCircle,
  Warning,
  X,
  ArrowRight,
  Lightning,
  ShieldCheck,
} from "@phosphor-icons/react";
import { tokens } from "@/lib/tokens";
import { formatCurrency } from "@/lib/format";
import type { BankAccount, BankTransaction } from "@/types";

// ─── German banks for GoCardless institution picker ───────────────────────────
// Full list: https://bankaccountdata.gocardless.com/api/v2/institutions/?country=DE
// Most common DE banks pre-listed for quick selection.

const DE_BANKS = [
  { id: "SPARKASSE_SSKMDEMMXXX",       name: "Sparkasse",           logo: "🏦" },
  { id: "ING_INGDDEFFXXX",             name: "ING",                 logo: "🟠" },
  { id: "DKB_SSKMDEMMXXX",             name: "DKB",                 logo: "🔵" },
  { id: "N26_NTSBDEB1XXX",             name: "N26",                 logo: "⬛" },
  { id: "COMMERZBANK_COBADEFFXXX",     name: "Commerzbank",         logo: "🟡" },
  { id: "DEUTSCHE_BANK_DEUTDEDBXXX",   name: "Deutsche Bank",       logo: "🔷" },
  { id: "VOLKSBANK_GENODEF1XXX",       name: "Volksbank",           logo: "🔴" },
  { id: "POSTBANK_PBNKDEFFXXX",        name: "Postbank",            logo: "🟡" },
  { id: "COMDIRECT_COBADEHD",          name: "comdirect",           logo: "🟡" },
  { id: "HYPOVEREINSBANK_HYVEDEMM",    name: "HypoVereinsbank",     logo: "🔴" },
];

interface BankAccountTabProps {
  bankAccounts: BankAccount[];
  transactions: BankTransaction[];
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: BankTransaction }) {
  const positive = tx.amount > 0;
  const matchColor = tx.match_status === "matched_rent"
    ? tokens.color.positive
    : tx.match_status === "matched_expense"
    ? tokens.color.warning
    : tokens.color.textSubtle;

  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-[10px] hover:bg-[#F8F7F4] transition-colors duration-100"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 text-sm"
          style={{ background: positive ? tokens.color.positiveBg : tokens.color.dangerBg }}
        >
          {positive ? "+" : "−"}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium truncate" style={{ color: tokens.color.text }}>
            {tx.creditor_name ?? tx.debtor_name ?? tx.description ?? "Transaktion"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px]" style={{ color: tokens.color.textSubtle }}>
              {tx.booking_date
                ? new Date(tx.booking_date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })
                : "—"}
            </p>
            {tx.match_status !== "unmatched" && (
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: `${matchColor}18`, color: matchColor }}
              >
                {tx.match_status === "matched_rent" ? "Miete" : tx.match_status === "matched_expense" ? "Ausgabe" : "Ignoriert"}
              </span>
            )}
          </div>
        </div>
      </div>
      <p
        className="text-[14px] font-semibold tabular-nums flex-shrink-0 ml-4"
        style={{ color: positive ? tokens.color.positive : tokens.color.danger }}
      >
        {positive ? "+" : "−"}{formatCurrency(Math.abs(tx.amount))}
      </p>
    </div>
  );
}

// ─── Connected account card ───────────────────────────────────────────────────

function AccountCard({
  account,
  transactions,
  onSync,
  syncing,
}: {
  account: BankAccount;
  transactions: BankTransaction[];
  onSync: (id: string) => void;
  syncing: boolean;
}) {
  const recentTx = transactions.filter((t) => t.bank_account_id === account.id).slice(0, 5);
  const statusColor = account.status === "active"
    ? tokens.color.positive
    : account.status === "error" || account.status === "expired"
    ? tokens.color.danger
    : tokens.color.warning;

  return (
    <div
      className="rounded-[16px] overflow-hidden mb-4"
      style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}` }}
    >
      {/* Account header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${tokens.color.border}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: "rgba(160,120,48,0.08)", border: `1px solid ${tokens.color.borderAccent}` }}
          >
            <Bank size={16} color={tokens.color.accent} />
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: tokens.color.text }}>
              {account.account_name ?? account.institution_name ?? "Bankkonto"}
            </p>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: tokens.color.textSubtle }}>
              {account.iban
                ? account.iban.replace(/(.{4})/g, "$1 ").trim()
                : account.institution_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusColor }}
            />
            <span className="text-[11px]" style={{ color: statusColor }}>
              {account.status === "active" ? "Verbunden" : account.status === "error" ? "Fehler" : account.status === "expired" ? "Abgelaufen" : "Ausstehend"}
            </span>
          </div>
          <button
            onClick={() => onSync(account.id)}
            disabled={syncing || account.status !== "active"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all disabled:opacity-40"
            style={{
              background: tokens.color.surfaceHover,
              border: `1px solid ${tokens.color.border}`,
              color: tokens.color.textSubtle,
            }}
          >
            <ArrowClockwise
              size={12}
              className={syncing ? "animate-spin" : ""}
            />
            {syncing ? "Sync..." : "Sync"}
          </button>
        </div>
      </div>

      {/* Last synced */}
      {account.last_synced_at && (
        <div className="px-5 py-2" style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
          <p className="text-[11px]" style={{ color: tokens.color.textSubtle }}>
            Letzte Synchronisation:{" "}
            {new Date(account.last_synced_at).toLocaleString("de-DE", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
      )}

      {/* Transactions */}
      <div className="px-1 py-2">
        {recentTx.length === 0 ? (
          <p className="text-[13px] text-center py-6" style={{ color: tokens.color.textSubtle }}>
            Noch keine Transaktionen. Sync starten.
          </p>
        ) : (
          <>
            {recentTx.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
            {transactions.filter((t) => t.bank_account_id === account.id).length > 5 && (
              <p
                className="text-[12px] text-center py-3 font-medium cursor-pointer hover:opacity-80"
                style={{ color: tokens.color.accent }}
              >
                Alle Transaktionen anzeigen <ArrowRight size={11} className="inline ml-0.5" />
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Bank picker modal ────────────────────────────────────────────────────────

function ConnectModal({ onClose, onConnect }: { onClose: () => void; onConnect: (institutionId: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    if (!selected) return;
    setConnecting(true);
    onConnect(selected);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-[440px] rounded-[20px] overflow-hidden"
        style={{
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          boxShadow: "0 24px 80px rgba(16,20,24,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex justify-between items-center"
          style={{ borderBottom: `1px solid ${tokens.color.border}` }}
        >
          <div>
            <p className="text-[15px] font-semibold" style={{ color: tokens.color.text }}>
              Bankkonto verbinden
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: tokens.color.textSubtle }}>
              Sicher via GoCardless Open Banking (PSD2)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-[#F0EDE4]"
            style={{ color: "#666" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Bank list */}
        <div className="px-4 py-4 grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto">
          {DE_BANKS.map((bank) => (
            <button
              key={bank.id}
              onClick={() => setSelected(bank.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-all"
              style={{
                background: selected === bank.id ? tokens.color.accentSubtle : tokens.color.surfaceHover,
                border: `1px solid ${selected === bank.id ? tokens.color.borderAccent : "transparent"}`,
                color: selected === bank.id ? tokens.color.accent : tokens.color.text,
              }}
            >
              <span className="text-xl">{bank.logo}</span>
              <span className="text-[13px] font-medium truncate">{bank.name}</span>
              {selected === bank.id && (
                <CheckCircle size={14} color={tokens.color.accent} weight="fill" className="ml-auto flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Trust badges */}
        <div
          className="px-6 py-3 flex items-center gap-4"
          style={{ borderTop: `1px solid ${tokens.color.border}` }}
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} color={tokens.color.positive} />
            <span className="text-[11px]" style={{ color: tokens.color.textSubtle }}>PSD2 konform</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lightning size={13} color={tokens.color.accent} />
            <span className="text-[11px]" style={{ color: tokens.color.textSubtle }}>Read-only Zugriff</span>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-end gap-3"
          style={{ borderTop: `1px solid ${tokens.color.border}` }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors"
            style={{ color: tokens.color.textSubtle, background: tokens.color.surfaceHover }}
          >
            Abbrechen
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConnect}
            disabled={!selected || connecting}
            className="px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-all disabled:opacity-40"
            style={{ background: tokens.color.accent, color: "#FFFFFF" }}
          >
            {connecting ? "Verbinde..." : "Weiter zur Bank →"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BankAccountTab({ bankAccounts, transactions }: BankAccountTabProps) {
  const router = useRouter();
  const [showConnect, setShowConnect] = useState(false);
  const [syncing, setSyncing]         = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  const hasAccounts = bankAccounts.length > 0;

  const handleConnect = useCallback(async (institutionId: string) => {
    setError(null);
    try {
      const res = await fetch("/api/banking/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institution_id: institutionId }),
      });
      const data = await res.json();
      if (data.error === "bank_not_configured") {
        setError("Bankverbindung noch nicht konfiguriert. Bitte GoCardless API-Keys in .env.local eintragen.");
        setShowConnect(false);
        return;
      }
      if (data.link) {
        window.location.href = data.link;
      } else {
        setError("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
        setShowConnect(false);
      }
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
      setShowConnect(false);
    }
  }, []);

  const handleSync = useCallback(async (bankAccountId: string) => {
    setSyncing(bankAccountId);
    setError(null);
    try {
      const res = await fetch("/api/banking/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank_account_id: bankAccountId }),
      });
      const data = await res.json();
      if (data.imported !== undefined) {
        setSuccessMsg(`${data.imported} Transaktionen synchronisiert, ${data.matched} automatisch zugeordnet.`);
        setTimeout(() => setSuccessMsg(null), 5000);
        router.refresh();
      } else {
        setError("Synchronisation fehlgeschlagen.");
      }
    } catch {
      setError("Netzwerkfehler bei der Synchronisation.");
    } finally {
      setSyncing(null);
    }
  }, [router]);

  return (
    <div>
      {/* Status messages */}
      <AnimatePresence>
        {(error || successMsg) && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div
              className="rounded-[12px] px-4 py-3 flex items-center gap-3"
              style={{
                background: error ? tokens.color.dangerBg : tokens.color.positiveBg,
                border: `1px solid ${error ? "rgba(255,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
              }}
            >
              {error
                ? <Warning size={14} color={tokens.color.danger} />
                : <CheckCircle size={14} color={tokens.color.positive} />
              }
              <p className="text-[13px] flex-1" style={{ color: tokens.color.text }}>
                {error ?? successMsg}
              </p>
              <button onClick={() => { setError(null); setSuccessMsg(null); }}>
                <X size={14} color={tokens.color.textSubtle} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[13px] font-semibold" style={{ color: tokens.color.text }}>
            Verbundene Konten
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: tokens.color.textSubtle }}>
            Mieteinnahmen werden automatisch zugeordnet
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowConnect(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-colors"
          style={{ background: tokens.color.accent, color: "#FFFFFF" }}
        >
          <Bank size={14} weight="bold" />
          Konto verbinden
        </motion.button>
      </div>

      {/* Empty state */}
      {!hasAccounts && (
        <div
          className="rounded-[16px] p-8 text-center"
          style={{
            background: tokens.color.surface,
            border: `1px dashed ${tokens.color.borderStrong}`,
          }}
        >
          <div
            className="w-14 h-14 rounded-[16px] flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(0,224,215,0.08)", border: `1px solid ${tokens.color.borderAccent}` }}
          >
            <Bank size={24} color={tokens.color.accent} />
          </div>
          <p className="text-[15px] font-semibold mb-2" style={{ color: tokens.color.text }}>
            Bankkonto verbinden
          </p>
          <p className="text-[13px] max-w-[340px] mx-auto leading-relaxed mb-6" style={{ color: tokens.color.textMuted }}>
            Verbinde dein Konto und Imvestra ordnet Mieteinnahmen automatisch den richtigen Mietern zu.
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left max-w-[520px] mx-auto">
            {[
              { icon: ArrowClockwise, title: "Auto-Sync", body: "Tägliche Synchronisation deiner Kontoauszüge" },
              { icon: CheckCircle,    title: "Auto-Match", body: "Mieteinnahmen werden Mietern automatisch zugeordnet" },
              { icon: ShieldCheck,    title: "Read-only", body: "Kein Schreibzugriff auf dein Konto. Immer." },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[12px] p-4"
                style={{ background: tokens.color.surfaceHover, border: `1px solid ${tokens.color.border}` }}
              >
                <Icon size={16} color={tokens.color.accent} className="mb-2" />
                <p className="text-[12px] font-semibold mb-1" style={{ color: tokens.color.text }}>{title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: tokens.color.textMuted }}>{body}</p>
              </div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowConnect(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-semibold"
            style={{ background: tokens.color.accent, color: "#FFFFFF" }}
          >
            <Bank size={14} weight="bold" />
            Jetzt verbinden
          </motion.button>

          <p className="text-[11px] mt-4" style={{ color: tokens.color.textSubtle }}>
            Powered by GoCardless · PSD2 / XS2A konform · Alle deutschen Banken
          </p>
        </div>
      )}

      {/* Connected accounts */}
      {hasAccounts && bankAccounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          transactions={transactions}
          onSync={handleSync}
          syncing={syncing === account.id}
        />
      ))}

      {/* Connect modal */}
      <AnimatePresence>
        {showConnect && (
          <ConnectModal
            onClose={() => setShowConnect(false)}
            onConnect={handleConnect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
