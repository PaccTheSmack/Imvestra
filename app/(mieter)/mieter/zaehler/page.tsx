import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ZaehlerForm from "./ZaehlerForm";

export default async function ZaehlerPage() {
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

  const { data: readings } = mieterAccountId
    ? await supabase
        .from("mieter_zaehlerstaende")
        .select("*")
        .eq("mieter_account_id", mieterAccountId)
        .order("ablesedatum", { ascending: false })
    : { data: [] };

  return (
    <div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#111827",
          letterSpacing: "-0.4px",
          marginBottom: 24,
        }}
      >
        Zählerstand melden
      </h1>

      {/* Form */}
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 14,
          padding: "24px 28px",
          marginBottom: 32,
          maxWidth: 520,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 20 }}>
          Neuen Zählerstand eingeben
        </h2>
        <ZaehlerForm />
      </div>

      {/* History */}
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 14,
          padding: "24px 28px",
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 20 }}>
          Bisherige Ablesungen
        </h2>

        {!readings || readings.length === 0 ? (
          <p style={{ fontSize: 14, color: "#9CA3AF" }}>Noch keine Zählerstände gemeldet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                  {["Zählerart", "Ablesedatum", "Zählerstand", "Geprüft"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                  >
                    <td style={{ padding: "10px 12px", color: "#374151", fontWeight: 500 }}>
                      {r.zaehlerart}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6B7280" }}>
                      {new Date(r.ablesedatum).toLocaleDateString("de-DE")}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#111827", fontWeight: 600 }}>
                      {r.wert}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: r.geprueft ? "#D1FAE5" : "#F3F4F6",
                          color: r.geprueft ? "#065F46" : "#6B7280",
                        }}
                      >
                        {r.geprueft ? "Geprüft" : "Ausstehend"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
