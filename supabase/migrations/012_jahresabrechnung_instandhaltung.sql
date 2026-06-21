-- jahresabrechnungen table
create table if not exists public.jahresabrechnungen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  jahr integer not null,
  zeitraum_von date not null,
  zeitraum_bis date not null,
  mieteinnahmen_gesamt numeric(12,2) default 0,
  nk_vorauszahlungen_gesamt numeric(12,2) default 0,
  ausgaben_gesamt numeric(12,2) default 0,
  ergebnis numeric(12,2) default 0,
  status text default 'entwurf' check (status in ('entwurf', 'fertig', 'exportiert')),
  datev_exportiert_am timestamptz,
  pdf_exportiert_am timestamptz,
  notizen text,
  created_at timestamptz default now()
);

create table if not exists public.instandhaltung (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade not null,
  titel text not null,
  beschreibung text,
  kategorie text not null default 'sonstige' check (kategorie in ('heizung','aufzug','elektrik','dach','sanitaer','malerarbeiten','garten','schornstein','brandschutz','sonstige')),
  intervall text check (intervall in ('einmalig','monatlich','quartalsweise','halbjaehrlich','jaehrlich','2_jahre','5_jahre','10_jahre')),
  faellig_am date not null,
  erledigt_am date,
  naechste_faelligkeit date,
  kosten_geschaetzt numeric(10,2),
  kosten_tatsaechlich numeric(10,2),
  handwerker text,
  angebot_eingeholt boolean default false,
  status text default 'offen' check (status in ('offen','in_bearbeitung','erledigt','verschoben')),
  prioritaet text default 'mittel' check (prioritaet in ('niedrig','mittel','hoch','dringend')),
  document_id uuid,
  notizen text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.instandhaltung_vorlagen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  titel text not null,
  kategorie text not null,
  intervall text not null,
  beschreibung text,
  kosten_geschaetzt numeric(10,2),
  created_at timestamptz default now()
);

alter table public.jahresabrechnungen enable row level security;
alter table public.instandhaltung enable row level security;
alter table public.instandhaltung_vorlagen enable row level security;

create policy "Users manage own jahresabrechnungen" on public.jahresabrechnungen for all using (auth.uid() = user_id);
create policy "Users manage own instandhaltung" on public.instandhaltung for all using (auth.uid() = user_id);
create policy "Users manage own instandhaltung_vorlagen" on public.instandhaltung_vorlagen for all using (auth.uid() = user_id);

create index if not exists instandhaltung_property_idx on public.instandhaltung(property_id);
create index if not exists instandhaltung_status_idx on public.instandhaltung(status);
create index if not exists instandhaltung_faellig_idx on public.instandhaltung(faellig_am);

create or replace function calc_naechste_faelligkeit()
returns trigger as $$
begin
  if new.erledigt_am is not null and new.intervall is not null and new.intervall != 'einmalig' then
    new.naechste_faelligkeit := case new.intervall
      when 'monatlich'      then new.erledigt_am + interval '1 month'
      when 'quartalsweise'  then new.erledigt_am + interval '3 months'
      when 'halbjaehrlich'  then new.erledigt_am + interval '6 months'
      when 'jaehrlich'      then new.erledigt_am + interval '1 year'
      when '2_jahre'        then new.erledigt_am + interval '2 years'
      when '5_jahre'        then new.erledigt_am + interval '5 years'
      when '10_jahre'       then new.erledigt_am + interval '10 years'
      else null
    end;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger calc_naechste_faelligkeit_trigger
  before insert or update on public.instandhaltung
  for each row execute function calc_naechste_faelligkeit();
