-- Phase 2: generic comments for official skills and future community skills
-- Run this after supabase/schema.sql.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  target_kind text not null check (target_kind in ('official_skill', 'community_skill')),
  target_key text not null,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists comments_target_lookup_idx
on public.comments (target_kind, target_key, created_at desc);

create index if not exists comments_author_idx
on public.comments (author_id, created_at desc);

create index if not exists comments_status_idx
on public.comments (status, created_at desc);

alter table public.comments enable row level security;

drop trigger if exists set_comments_updated_at on public.comments;
create trigger set_comments_updated_at
before update on public.comments
for each row execute procedure public.set_updated_at();

drop policy if exists "Published comments are viewable by everyone" on public.comments;
create policy "Published comments are viewable by everyone"
on public.comments
for select
using (status = 'published');

drop policy if exists "Users can view their own comments" on public.comments;
create policy "Users can view their own comments"
on public.comments
for select
to authenticated
using (auth.uid() = author_id);

drop policy if exists "Admins can view all comments" on public.comments;
create policy "Admins can view all comments"
on public.comments
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

drop policy if exists "Authenticated users can insert their own comments" on public.comments;
create policy "Authenticated users can insert their own comments"
on public.comments
for insert
to authenticated
with check (
  auth.uid() = author_id
  and status = 'published'
);

drop policy if exists "Users can update their own comments" on public.comments;
create policy "Users can update their own comments"
on public.comments
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "Admins can moderate comments" on public.comments;
create policy "Admins can moderate comments"
on public.comments
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

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
on public.comments
for delete
to authenticated
using (auth.uid() = author_id);

drop policy if exists "Skill owners can delete comments on own community skills" on public.comments;
create policy "Skill owners can delete comments on own community skills"
on public.comments
for delete
to authenticated
using (
  target_kind = 'community_skill'
  and exists (
    select 1
    from public.community_skills as cs
    where cs.slug = target_key
      and cs.author_id = auth.uid()
  )
);

drop policy if exists "Admins can delete any comments" on public.comments;
create policy "Admins can delete any comments"
on public.comments
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
