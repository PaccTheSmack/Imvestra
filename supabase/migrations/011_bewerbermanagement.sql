-- ─── BEWERBERMANAGEMENT ───────────────────────────────────────────

create table if not exists bewerber (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  property_id uuid references properties(id) on delete set null,
  inserat_id uuid,  -- optional reference to inserate

  name text not null,
  email text,
  telefon text,
  status text not null default 'neu'
    check (status in ('neu','selbstauskunft_angefordert','selbstauskunft_ausgefuellt','besichtigung','in_pruefung','zusage','absage','mietvertrag')),

  score integer,
  score_details jsonb,
  notizen text,

  dsgvo_loeschdatum date default (current_date + interval '60 days'),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table bewerber enable row level security;

create policy "bewerber_owner" on bewerber
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── SELBSTAUSKÜNFTE ───────────────────────────────────────────────

create table if not exists selbstauskuenfte (
  id uuid primary key default gen_random_uuid(),
  bewerber_id uuid references bewerber(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  zugangscode uuid unique not null default gen_random_uuid(),
  abgelaufen_am timestamptz not null default (now() + interval '14 days'),
  ausgefuellt_am timestamptz,

  -- Persönliche Daten
  vorname text,
  nachname text,
  geburtsdatum date,
  geburtsort text,
  nationalitaet text default 'deutsch',
  ausweis_typ text default 'personalausweis',
  ausweis_nr text,
  aktuelle_adresse text,
  wohnhaft_seit text,
  kuendigungsgrund text,

  -- Beruf & Einkommen
  beruf text,
  arbeitgeber text,
  beschaeftigt_seit text,
  beschaeftigungsart text,
  nettoeinkommen numeric(10,2),
  einkommen_nachweise boolean default false,

  -- Haushalt
  anzahl_personen integer default 1,
  personen_details text,
  haustiere boolean default false,
  haustiere_beschreibung text,
  raucher boolean default false,

  -- Finanzen
  schufa_sauber boolean,
  insolvenz boolean default false,
  mietschulden boolean default false,

  -- Sonstiges
  warum_diese_wohnung text,
  sonstiges text,

  -- Einverständnis
  einverstaendnis_datenschutz boolean default false,
  einverstaendnis_schufa boolean default false,
  einverstaendnis_datum timestamptz,
  unterschrift_name text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Public read by zugangscode (no auth), owner write
alter table selbstauskuenfte enable row level security;

create policy "selbstauskunft_public_read" on selbstauskuenfte
  for select using (true);

create policy "selbstauskunft_public_update" on selbstauskuenfte
  for update using (true);

create policy "selbstauskunft_owner_insert" on selbstauskuenfte
  for insert with check (user_id = auth.uid());

create policy "selbstauskunft_owner_delete" on selbstauskuenfte
  for delete using (user_id = auth.uid());
