-- Phase 4: admin-managed official school directory for runtime flows
-- Run this after schema.sql.

create table if not exists public.managed_schools (
  slug text primary key,
  name text not null,
  name_zh text not null,
  country text not null default 'CN',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.managed_schools enable row level security;

drop trigger if exists set_managed_schools_updated_at on public.managed_schools;
create trigger set_managed_schools_updated_at
before update on public.managed_schools
for each row execute procedure public.set_updated_at();

drop policy if exists "Active managed schools are public" on public.managed_schools;
create policy "Active managed schools are public"
on public.managed_schools
for select
using (active = true);

drop policy if exists "Admins can view all managed schools" on public.managed_schools;
create policy "Admins can view all managed schools"
on public.managed_schools
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Admins can insert managed schools" on public.managed_schools;
create policy "Admins can insert managed schools"
on public.managed_schools
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Admins can update managed schools" on public.managed_schools;
create policy "Admins can update managed schools"
on public.managed_schools
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
