-- PickleTayo identity tables managed by Prisma Migrate.
-- Supabase continues to own auth.users and authentication credentials.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  given_name text not null default '',
  family_name text not null default '',
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED', 'CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_roles (
  code text primary key,
  description text not null
);

insert into public.application_roles (code, description) values
  ('PLAYER', 'Books courts and manages a player profile'),
  ('CLUB_ADMIN', 'Administers a club organization'),
  ('COURT_OWNER', 'Owns and manages court facilities'),
  ('STAFF', 'Performs delegated facility operations'),
  ('PLATFORM_ADMIN', 'Administers the PickleTayo platform')
on conflict (code) do update set description = excluded.description;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_code text not null references public.application_roles(code),
  created_at timestamptz not null default now(),
  primary key (user_id, role_code)
);

create table if not exists public.consent_records (
  consent_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('TERMS', 'PRIVACY')),
  version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, consent_type, version)
);

create table if not exists public.security_events (
  event_id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.application_roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.consent_records enable row level security;
alter table public.security_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "roles_read_authenticated" on public.application_roles;
create policy "roles_read_authenticated" on public.application_roles
  for select to authenticated using (true);

drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own" on public.user_roles
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "consents_select_own" on public.consent_records;
create policy "consents_select_own" on public.consent_records
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "consents_insert_own" on public.consent_records;
create policy "consents_insert_own" on public.consent_records
  for insert to authenticated with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_identity_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id, given_name, family_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'given_name', ''),
    coalesce(new.raw_user_meta_data ->> 'family_name', '')
  )
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role_code)
  values (new.id, 'PLAYER')
  on conflict (user_id, role_code) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_identity_user();
