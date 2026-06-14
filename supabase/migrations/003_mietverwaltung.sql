-- Tenants table
create table public.tenants (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties(id)
    on delete cascade not null,
  user_id uuid references public.profiles(id)
    on delete cascade not null,
  name text not null,
  email text,
  phone text,
  move_in_date date not null,
  move_out_date date,
  rent_monthly numeric(10,2) not null default 0,
  deposit numeric(10,2) default 0,
  unit_number text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Rent payments table
create table public.rent_payments (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id)
    on delete cascade not null,
  property_id uuid references public.properties(id)
    on delete cascade not null,
  user_id uuid references public.profiles(id)
    on delete cascade not null,
  amount numeric(10,2) not null,
  due_date date not null,
  paid_date date,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'late', 'partial')),
  notes text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.tenants enable row level security;
alter table public.rent_payments enable row level security;

create policy "Users own tenants"
  on public.tenants for all using (auth.uid() = user_id);

create policy "Users own rent payments"
  on public.rent_payments for all using (auth.uid() = user_id);
