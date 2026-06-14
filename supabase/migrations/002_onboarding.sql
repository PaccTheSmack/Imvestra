alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists investment_goal text,
  add column if not exists experience_level text,
  add column if not exists portfolio_size integer default 0;
