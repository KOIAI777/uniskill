-- Phase 5: unify official and community skills in one backend model
-- Run this after community-skills.sql.

alter table public.community_skills
  add column if not exists source_type text not null default 'community';

alter table public.community_skills
  add column if not exists featured boolean not null default false;

alter table public.community_skills
  add column if not exists downloads integer not null default 0;

alter table public.community_skills
  add column if not exists install_command text;

alter table public.community_skills
  add column if not exists is_verified boolean not null default false;

alter table public.community_skills
  add column if not exists published_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_skills_source_type_check'
  ) then
    alter table public.community_skills
      add constraint community_skills_source_type_check
      check (source_type in ('official', 'community'));
  end if;
end
$$;

create index if not exists community_skills_source_idx
on public.community_skills (source_type, status, created_at desc);
