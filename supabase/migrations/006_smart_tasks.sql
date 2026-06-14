-- Smart task engine columns
alter table public.tasks
  add column if not exists source_type text,
  add column if not exists source_id text,
  add column if not exists auto_generated boolean default false;

create unique index if not exists tasks_source_unique
  on public.tasks(user_id, source_type, source_id)
  where auto_generated = true;
