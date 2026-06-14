-- Ensure financings table has required columns
alter table public.financings
  add column if not exists fixed_until date,
  add column if not exists bank text,
  add column if not exists current_debt numeric(12,2);

-- Tasks table
create table if not exists public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id)
    on delete cascade not null,
  property_id uuid references public.properties(id)
    on delete cascade,
  title text not null,
  description text,
  due_date date,
  completed boolean not null default false,
  priority text default 'medium'
    check (priority in ('low', 'medium', 'high')),
  category text default 'general'
    check (category in (
      'general', 'maintenance', 'legal',
      'financial', 'tenant', 'other'
    )),
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users own tasks"
  on public.tasks for all using (auth.uid() = user_id);
