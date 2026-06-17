alter table public.properties
  add column if not exists kaufdatum date,
  add column if not exists heizungsart text
    check (heizungsart in (
      'gas', 'oel', 'waermepumpe', 'fernwaerme',
      'pellets', 'elektro', 'solar', 'sonstige'
    )),
  add column if not exists energieklasse text
    check (energieklasse in (
      'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'
    )),
  add column if not exists denkmalschutz boolean default false,
  add column if not exists aufzug boolean default false,
  add column if not exists keller boolean default false,
  add column if not exists parkplaetze integer default 0,
  add column if not exists hausgeld_monthly numeric(10,2) default 0,
  add column if not exists notes text,
  add column if not exists market_value_estimated numeric(12,2),
  add column if not exists market_value_updated_at timestamptz;
