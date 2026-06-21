-- Migration 013: Mieterportal
-- Run this in the Supabase SQL editor

-- ── mieter_accounts ──────────────────────────────────────────────────────────
-- Links a tenant to their Supabase auth account + stores invitation data
CREATE TABLE IF NOT EXISTS mieter_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id  UUID UNIQUE,                              -- set after activation
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id       UUID REFERENCES properties(id) ON DELETE SET NULL,
  vermieter_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mieter_name       TEXT NOT NULL,
  mieter_email      TEXT NOT NULL,
  invitation_code   UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  activated_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mieter_accounts ENABLE ROW LEVEL SECURITY;

-- Vermieter can manage their own mieter_accounts
CREATE POLICY "vermieter_manage_mieter_accounts"
  ON mieter_accounts
  FOR ALL
  USING (vermieter_id = auth.uid())
  WITH CHECK (vermieter_id = auth.uid());

-- Tenant can read their own account (once activated)
CREATE POLICY "mieter_read_own_account"
  ON mieter_accounts
  FOR SELECT
  USING (supabase_user_id = auth.uid());

-- Service role can insert/update (for activation flow)
CREATE POLICY "service_role_mieter_accounts"
  ON mieter_accounts
  FOR ALL
  USING (auth.role() = 'service_role');


-- ── mieter_zaehlerstaende ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mieter_zaehlerstaende (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mieter_account_id UUID NOT NULL REFERENCES mieter_accounts(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vermieter_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zaehlerart        TEXT NOT NULL CHECK (zaehlerart IN ('Strom', 'Gas', 'Wasser', 'Wärme')),
  ablesedatum       DATE NOT NULL,
  wert              NUMERIC(12,2) NOT NULL,
  geprueft          BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mieter_zaehlerstaende ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vermieter_manage_zaehlerstaende"
  ON mieter_zaehlerstaende
  FOR ALL
  USING (vermieter_id = auth.uid())
  WITH CHECK (vermieter_id = auth.uid());

CREATE POLICY "mieter_insert_zaehlerstand"
  ON mieter_zaehlerstaende
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mieter_accounts
      WHERE id = mieter_account_id AND supabase_user_id = auth.uid()
    )
  );

CREATE POLICY "mieter_read_own_zaehlerstaende"
  ON mieter_zaehlerstaende
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mieter_accounts
      WHERE id = mieter_account_id AND supabase_user_id = auth.uid()
    )
  );


-- ── mieter_anfragen ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mieter_anfragen (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mieter_account_id UUID NOT NULL REFERENCES mieter_accounts(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vermieter_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kategorie         TEXT NOT NULL DEFAULT 'Sonstige'
                      CHECK (kategorie IN ('Reparatur', 'Sonstige', 'Frage', 'Beschwerde')),
  titel             TEXT NOT NULL,
  beschreibung      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'offen'
                      CHECK (status IN ('offen', 'in_bearbeitung', 'erledigt')),
  antwort           TEXT,
  answered_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mieter_anfragen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vermieter_manage_anfragen"
  ON mieter_anfragen
  FOR ALL
  USING (vermieter_id = auth.uid())
  WITH CHECK (vermieter_id = auth.uid());

CREATE POLICY "mieter_insert_anfrage"
  ON mieter_anfragen
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mieter_accounts
      WHERE id = mieter_account_id AND supabase_user_id = auth.uid()
    )
  );

CREATE POLICY "mieter_read_own_anfragen"
  ON mieter_anfragen
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mieter_accounts
      WHERE id = mieter_account_id AND supabase_user_id = auth.uid()
    )
  );

CREATE TRIGGER update_mieter_anfragen_updated_at
  BEFORE UPDATE ON mieter_anfragen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── mieter_nachrichten ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mieter_nachrichten (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mieter_account_id UUID NOT NULL REFERENCES mieter_accounts(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vermieter_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text              TEXT NOT NULL,
  sender            TEXT NOT NULL CHECK (sender IN ('mieter', 'vermieter')),
  gelesen_mieter    BOOLEAN NOT NULL DEFAULT false,
  gelesen_vermieter BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mieter_nachrichten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vermieter_manage_nachrichten"
  ON mieter_nachrichten
  FOR ALL
  USING (vermieter_id = auth.uid())
  WITH CHECK (vermieter_id = auth.uid());

CREATE POLICY "mieter_insert_nachricht"
  ON mieter_nachrichten
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mieter_accounts
      WHERE id = mieter_account_id AND supabase_user_id = auth.uid()
    )
  );

CREATE POLICY "mieter_read_own_nachrichten"
  ON mieter_nachrichten
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mieter_accounts
      WHERE id = mieter_account_id AND supabase_user_id = auth.uid()
    )
  );


-- ── dokumente: add visible_to_tenant ─────────────────────────────────────────
ALTER TABLE dokumente
  ADD COLUMN IF NOT EXISTS visible_to_tenant BOOLEAN NOT NULL DEFAULT false;


-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mieter_accounts_tenant_id ON mieter_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mieter_accounts_vermieter_id ON mieter_accounts(vermieter_id);
CREATE INDEX IF NOT EXISTS idx_mieter_accounts_invitation_code ON mieter_accounts(invitation_code);
CREATE INDEX IF NOT EXISTS idx_mieter_anfragen_vermieter_id ON mieter_anfragen(vermieter_id);
CREATE INDEX IF NOT EXISTS idx_mieter_anfragen_status ON mieter_anfragen(status);
CREATE INDEX IF NOT EXISTS idx_mieter_nachrichten_mieter_account_id ON mieter_nachrichten(mieter_account_id);
CREATE INDEX IF NOT EXISTS idx_mieter_zaehlerstaende_vermieter_id ON mieter_zaehlerstaende(vermieter_id);
