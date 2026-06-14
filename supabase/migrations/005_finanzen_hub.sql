-- Expenses table
create table if not exists public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id)
    on delete cascade not null,
  property_id uuid references public.properties(id)
    on delete cascade,
  title text not null,
  amount numeric(10,2) not null,
  category text not null default 'other'
    check (category in (
      'maintenance', 'management', 'insurance',
      'tax', 'utilities', 'renovation', 'other'
    )),
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users own expenses"
  on public.expenses for all using (auth.uid() = user_id);
