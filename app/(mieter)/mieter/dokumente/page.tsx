import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface Dokument {
  id: string;
  name: string;
  file_url: string;
  created_at: string;
  file_type: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function MieterDokumentePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/mieter/login");

  let propertyId: string | null = null;
  let documents: Dokument[] = [];

  try {
    const { data: mieterAccount } = await supabase
      .from("mieter_accounts")
      .select("property_id")
      .eq("supabase_user_id", user.id)
      .maybeSingle();

    if (mieterAccount) {
      propertyId = mieterAccount.property_id;
    }
  } catch {
    // ignore
  }

  if (propertyId) {
    try {
      const { data } = await supabase
        .from("dokumente")
        .select("id, name, file_url, created_at, file_type")
        .eq("property_id", propertyId)
        .eq("visible_to_tenant", true)
        .order("created_at", { ascending: false });

      if (data) documents = data as Dokument[];
    } catch {
      // Table may not have visible_to_tenant column yet — try without filter
      try {
        const { data } = await supabase
          .from("dokumente")
          .select("id, name, file_url, created_at, file_type")
          .eq("property_id", propertyId)
          .order("created_at", { ascending: false });

        if (data) documents = data as Dokument[];
      } catch {
        // ignore
      }
    }
  }

  function getFileIcon(fileType: string | null): string {
    if (!fileType) return "📄";
    if (fileType.includes("pdf")) return "📋";
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("word") || fileType.includes("doc")) return "📝";
    return "📄";
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.4px",
          }}
        >
          Dokumente
        </h1>
        <p style={{ fontSize: 15, color: "#6B7280", marginTop: 4 }}>
          Ihre freigegebenen Dokumente
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 14,
          padding: "24px 28px",
        }}
      >
        {documents.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 0",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 40 }}>📁</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>
              Keine Dokumente vorhanden
            </div>
            <div style={{ fontSize: 14, color: "#9CA3AF" }}>
              Ihr Vermieter hat noch keine Dokumente für Sie freigegeben.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 16px",
                  backgroundColor: "#F9FAFB",
                  borderRadius: 10,
                  textDecoration: "none",
                  transition: "background-color 0.12s",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: 24 }}>{getFileIcon(doc.file_type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                    Hinzugefügt am {formatDate(doc.created_at)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#00897B",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Öffnen ↗
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
