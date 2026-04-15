-- Phase 3: community skill uploads + moderation
-- Run this after schema.sql and comments.sql.

create extension if not exists pgcrypto;

create table if not exists public.community_skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null,
  author_email text not null,
  name text not null,
  name_zh text,
  description text not null,
  description_zh text,
  category text not null check (category in ('formatting', 'reference', 'email', 'exam', 'presentation', 'research')),
  school_slug text,
  custom_school_name text,
  tags text[] not null default '{}',
  github_url text,
  version text not null default '1.0.0',
  file_path text not null unique,
  original_file_name text not null,
  file_size bigint not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.community_skills
  add column if not exists custom_school_name text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_skills_school_source_check'
  ) then
    alter table public.community_skills
      add constraint community_skills_school_source_check
      check (school_slug is null or custom_school_name is null);
  end if;
end
$$;

alter table public.community_skills
  drop constraint if exists community_skills_file_size_check;

alter table public.community_skills
  add constraint community_skills_file_size_check
  check (file_size > 0 and file_size <= 1048576);

create index if not exists community_skills_status_idx
on public.community_skills (status, created_at desc);

create index if not exists community_skills_author_idx
on public.community_skills (author_id, created_at desc);

create index if not exists community_skills_slug_idx
on public.community_skills (slug);

alter table public.community_skills enable row level security;

drop trigger if exists set_community_skills_updated_at on public.community_skills;
create trigger set_community_skills_updated_at
before update on public.community_skills
for each row execute procedure public.set_updated_at();

drop policy if exists "Approved community skills are public" on public.community_skills;
create policy "Approved community skills are public"
on public.community_skills
for select
using (status = 'approved');

drop policy if exists "Users can view own community skills" on public.community_skills;
create policy "Users can view own community skills"
on public.community_skills
for select
to authenticated
using (auth.uid() = author_id);

drop policy if exists "Admins can view all community skills" on public.community_skills;
create policy "Admins can view all community skills"
on public.community_skills
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

drop policy if exists "Authenticated users can submit community skills" on public.community_skills;
create policy "Authenticated users can submit community skills"
on public.community_skills
for insert
to authenticated
with check (
  auth.uid() = author_id
  and status = 'pending'
  and reviewed_at is null
  and reviewed_by is null
);

drop policy if exists "Admins can moderate community skills" on public.community_skills;
create policy "Admins can moderate community skills"
on public.community_skills
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

drop policy if exists "Users can delete own non-approved community skills" on public.community_skills;
drop policy if exists "Users can delete own community skills" on public.community_skills;
create policy "Users can delete own community skills"
on public.community_skills
for delete
to authenticated
using (auth.uid() = author_id);

-- Storage bucket policies
-- Create a private bucket named `community-skill-files` in the Supabase dashboard
-- before testing uploads.

drop policy if exists "Authenticated users can upload community skill zips" on storage.objects;
create policy "Authenticated users can upload community skill zips"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-skill-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) = 'zip'
);

drop policy if exists "Community skill files can be downloaded when allowed" on storage.objects;
create policy "Community skill files can be downloaded when allowed"
on storage.objects
for select
using (
  bucket_id = 'community-skill-files'
  and (
    owner_id::text = auth.uid()::text
    or exists (
      select 1
      from public.profiles as p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from public.community_skills as cs
      where cs.file_path = name
        and cs.status = 'approved'
    )
  )
);

drop policy if exists "Owners and admins can delete community skill files" on storage.objects;
create policy "Owners and admins can delete community skill files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'community-skill-files'
  and (
    owner_id::text = auth.uid()::text
    or exists (
      select 1
      from public.profiles as p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
);
