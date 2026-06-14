-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Properties table
create table public.properties (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  address text,
  type text not null check (type in ('ETW', 'MFH', 'EFH', 'DHH', 'Gewerbe')),
  build_year integer,
  sqm numeric(10,2) not null default 0,
  purchase_price numeric(12,2) not null default 0,
  ancillary_costs_pct numeric(5,4) not null default 0.10,
  market_value numeric(12,2),
  rent_monthly numeric(10,2) not null default 0,
  monthly_rate numeric(10,2) not null default 0,
  units integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Financings table
create table public.financings (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  bank text,
  loan_amount numeric(12,2) not null default 0,
  interest_rate numeric(5,4) not null default 0,
  repayment_rate numeric(5,4) not null default 0,
  rate_monthly numeric(10,2) not null default 0,
  fixed_until date,
  current_debt numeric(12,2),
  created_at timestamptz not null default now()
);

-- Waitlist table
create table public.waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  created_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.financings enable row level security;
alter table public.waitlist enable row level security;

-- RLS Policies
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can view own properties"
  on public.properties for select using (auth.uid() = user_id);

create policy "Users can insert own properties"
  on public.properties for insert with check (auth.uid() = user_id);

create policy "Users can update own properties"
  on public.properties for update using (auth.uid() = user_id);

create policy "Users can delete own properties"
  on public.properties for delete using (auth.uid() = user_id);

create policy "Users can view own financings"
  on public.financings for select
  using (exists (
    select 1 from public.properties
    where id = financings.property_id and user_id = auth.uid()
  ));

create policy "Users can insert own financings"
  on public.financings for insert
  with check (exists (
    select 1 from public.properties
    where id = financings.property_id and user_id = auth.uid()
  ));

create policy "Users can update own financings"
  on public.financings for update
  using (exists (
    select 1 from public.properties
    where id = financings.property_id and user_id = auth.uid()
  ));

create policy "Users can delete own financings"
  on public.financings for delete
  using (exists (
    select 1 from public.properties
    where id = financings.property_id and user_id = auth.uid()
  ));

create policy "Anyone can insert to waitlist"
  on public.waitlist for insert with check (true);
