import { createClient } from "@/lib/supabase/server"
import SelbstauskunftForm from "@/components/public/SelbstauskunftForm"

function NotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#101418", marginBottom: 8 }}>Link nicht gefunden</h1>
        <p style={{ color: "#6B7280", fontSize: 14 }}>Dieser Link ist ungültig oder wurde bereits verwendet.</p>
      </div>
    </div>
  )
}

function AlreadyFilledPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#101418", marginBottom: 8 }}>Bereits eingereicht</h1>
        <p style={{ color: "#6B7280", fontSize: 14 }}>Ihre Selbstauskunft wurde bereits erfolgreich übermittelt.</p>
      </div>
    </div>
  )
}

function ExpiredPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#101418", marginBottom: 8 }}>Link abgelaufen</h1>
        <p style={{ color: "#6B7280", fontSize: 14 }}>Dieser Link ist nicht mehr gültig. Bitte kontaktieren Sie den Vermieter.</p>
      </div>
    </div>
  )
}

export default async function SelbstauskunftPage({ params }: { params: { code: string } }) {
  const supabase = await createClient()

  const { data: auskunft } = await supabase
    .from("selbstauskuenfte")
    .select(`
      *,
      bewerber(
        name, email,
        properties(name, address),
        inserate(kaltmiete)
      )
    `)
    .eq("zugangscode", params.code)
    .single()

  if (!auskunft) return <NotFoundPage />
  if (auskunft.ausgefuellt_am) return <AlreadyFilledPage />
  if (new Date(auskunft.abgelaufen_am) < new Date()) return <ExpiredPage />

  const bewerberData = auskunft.bewerber as {
    name: string
    email: string
    properties: { name: string; address: string } | null
    inserate: { kaltmiete: number } | null
  } | null

  return (
    <SelbstauskunftForm
      zugangscode={params.code}
      bewerberName={bewerberData?.name ?? ""}
      propertyName={bewerberData?.properties?.name ?? ""}
      propertyAddress={bewerberData?.properties?.address ?? ""}
      kaltmiete={bewerberData?.inserate?.kaltmiete ?? null}
    />
  )
}
