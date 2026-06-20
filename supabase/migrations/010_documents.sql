-- 1. Documents table
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,

  name text not null,
  original_name text not null,
  file_path text not null,
  file_size bigint not null,
  mime_type text not null,

  category text not null check (category in (
    'mietvertrag',
    'nebenkostenabrechnung',
    'rechnung',
    'beleg',
    'protokoll',
    'foto',
    'brief',
    'versicherung',
    'finanzierung',
    'sonstiges'
  )),

  tags text[] default '{}',
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. RLS
alter table public.documents enable row level security;

create policy "Users can manage own documents"
  on public.documents
  for all using (auth.uid() = user_id);

-- 3. Indexes
create index documents_user_id_idx on public.documents(user_id);
create index documents_property_id_idx on public.documents(property_id);
create index documents_category_idx on public.documents(category);
create index documents_name_search_idx
  on public.documents using gin(to_tsvector('german', name));

-- 4. Updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_documents_updated_at
  before update on public.documents
  for each row execute function update_updated_at_column();
