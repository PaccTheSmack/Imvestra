-- 4-tier pricing model: free / investor / manager / team
-- Run in Supabase SQL Editor.

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'investor', 'manager', 'team'));

-- Migrate existing users from old plan names to new ones.
update public.profiles set plan = 'investor' where plan = 'pro';
-- Existing 'team' users keep 'team'.
