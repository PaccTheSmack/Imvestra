import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  in_bearbeitung: "In Bearbeitung",
  erledigt: "Erledigt",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  offen: { bg: "#FEF3C7", text: "#92400E" },
  in_bearbeitung: { bg: "#DBEAFE", text: "#1E40AF" },
  erledigt: { bg: "#D1FAE5", text: "#065F46" },
};

export default async function AnfragenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "mieter") {
    redirect("/mieter/login");
  }

  const { data: mieterAccount } = await supabase
    .from("mieter_accounts")
    .select("id")
    .eq("supabase_user_id", user.id)
    .maybeSingle();

  const mieterAccountId = mieterAccount?.id ?? null;

  const { data: anfragen } = mieterAccountId
    ? await supabase
        .from("mieter_anfragen")
        .select("*")
        .eq("mieter_account_id", mieterAccountId)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.4px" }}>
          Meine Anfragen
        </h1>
        <Link
          href="/mieter/anfragen/neu"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "9px 18px",
            backgroundColor: "#00897B",
            color: "#fff",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            transition: "background-color 0.15s",
          }}
        >
          + Neue Anfrage
        </Link>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {!anfragen || anfragen.length === 0 ? (
          <div style={{ padding: "32px 28px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0 }}>
              Noch keine Anfragen gestellt.
            </p>
          </div>
        ) : (
          <div>
            {anfragen.map((a, idx) => {
              const colors =
                STATUS_COLORS[a.status as string] ?? STATUS_COLORS.offen;
              return (
                <div
                  key={a.id}
                  style={{
                    padding: "18px 24px",
                    borderBottom:
                      idx < anfragen.length - 1
                        ? "1px solid rgba(0,0,0,0.05)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#9CA3AF",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {a.kategorie}
                        </span>
                        <span style={{ color: "#D1D5DB", fontSize: 10 }}>•</span>
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                          {new Date(a.created_at).toLocaleDateString("de-DE")}
                        </span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
                        {a.titel}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#6B7280",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 480,
                        }}
                      >
                        {a.beschreibung}
                      </div>
                      {a.antwort && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: "10px 14px",
                            backgroundColor: "#F0FDFB",
                            border: "1px solid rgba(0,137,123,0.15)",
                            borderRadius: 8,
                            fontSize: 13,
                            color: "#374151",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#00897B" }}>Antwort: </span>
                          {a.antwort}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {STATUS_LABELS[a.status as string] ?? a.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
