begin;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  organization_type text not null check (organization_type in ('CLUB','COURT_OPERATOR','PLATFORM')),
  legal_name text not null,
  display_name text not null,
  status text not null default 'ACTIVE' check (status in ('PENDING','ACTIVE','SUSPENDED','CLOSED')),
  owner_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_code text not null check (role_code in ('CLUB_ADMIN','COURT_OWNER','STAFF')),
  status text not null default 'ACTIVE' check (status in ('INVITED','ACTIVE','SUSPENDED','LEFT')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_name text not null,
  branch_code text not null,
  description text,
  facility_status text not null default 'DRAFT' check (facility_status in ('DRAFT','ACTIVE','TEMPORARILY_CLOSED','CLOSED')),
  contact_number text,
  contact_email text,
  timezone text not null default 'Asia/Manila',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, branch_code)
);
create table public.facility_locations (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null unique references public.facilities(id) on delete cascade,
  address_line_1 text not null,
  address_line_2 text,
  barangay text,
  city_municipality text not null,
  province text not null,
  postal_code text,
  country_code char(2) not null default 'PH',
  latitude numeric(9,6) not null check (latitude between -90 and 90),
  longitude numeric(9,6) not null check (longitude between -180 and 180),
  directions_landmark text,
  is_verified boolean not null default false
);
create table public.facility_operating_hours (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  unique (facility_id, day_of_week),
  check (is_closed or (opens_at is not null and closes_at is not null and opens_at < closes_at))
);
create table public.courts (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  court_code text not null,
  court_name text not null,
  court_type text not null check (court_type in ('INDOOR','OUTDOOR','COVERED')),
  surface_type text not null,
  court_status text not null default 'ACTIVE' check (court_status in ('ACTIVE','MAINTENANCE','INACTIVE')),
  has_lighting boolean not null default false,
  base_hourly_rate numeric(12,2) not null check (base_hourly_rate >= 0),
  currency_code char(3) not null default 'PHP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, court_code)
);
create table public.court_rate_rules (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.courts(id) on delete cascade,
  rule_name text not null,
  day_of_week smallint check (day_of_week between 1 and 7),
  starts_at time,
  ends_at time,
  hourly_rate numeric(12,2) not null check (hourly_rate >= 0),
  effective_from date,
  effective_until date,
  priority integer not null default 0,
  active boolean not null default true,
  check (starts_at is null or ends_at is null or starts_at < ends_at),
  check (effective_until is null or effective_from is null or effective_from <= effective_until)
);
create table public.court_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.courts(id) on delete cascade,
  block_type text not null check (block_type in ('MAINTENANCE','OWNER_BLOCK','TOURNAMENT','CLOSURE')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);
create index organizations_owner_idx on public.organizations(owner_user_id, status);
create index organization_members_user_idx on public.organization_members(user_id, status);
create index facilities_status_idx on public.facilities(facility_status, facility_name);
create index facility_locations_city_idx on public.facility_locations(city_municipality, province);
create index courts_facility_status_idx on public.courts(facility_id, court_status);
create index court_rate_rules_lookup_idx on public.court_rate_rules(court_id, active, day_of_week, priority desc);
create index court_blocks_lookup_idx on public.court_availability_blocks(court_id, starts_at, ends_at);

create or replace function public.has_application_role(required_role text)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role_code = required_role); $$;
create or replace function public.can_manage_organization(required_organization_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.has_application_role('PLATFORM_ADMIN')
    or exists (select 1 from public.organizations where id = required_organization_id and owner_user_id = (select auth.uid()))
    or exists (select 1 from public.organization_members where organization_id = required_organization_id and user_id = (select auth.uid()) and status = 'ACTIVE' and role_code in ('CLUB_ADMIN','COURT_OWNER','STAFF'));
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.facilities enable row level security;
alter table public.facility_locations enable row level security;
alter table public.facility_operating_hours enable row level security;
alter table public.courts enable row level security;
alter table public.court_rate_rules enable row level security;
alter table public.court_availability_blocks enable row level security;

create policy organizations_select_managed on public.organizations for select to authenticated using (public.can_manage_organization(id));
create policy organizations_admin_insert on public.organizations for insert to authenticated with check (public.has_application_role('PLATFORM_ADMIN'));
create policy organizations_admin_update on public.organizations for update to authenticated using (public.has_application_role('PLATFORM_ADMIN')) with check (public.has_application_role('PLATFORM_ADMIN'));
create policy organization_members_select_managed on public.organization_members for select to authenticated using (public.can_manage_organization(organization_id));
create policy organization_members_write_managed on public.organization_members for all to authenticated using (public.can_manage_organization(organization_id)) with check (public.can_manage_organization(organization_id));
create policy facilities_public_select on public.facilities for select to anon, authenticated using (facility_status = 'ACTIVE' or public.can_manage_organization(organization_id));
create policy facilities_managed_write on public.facilities for all to authenticated using (public.can_manage_organization(organization_id)) with check (public.can_manage_organization(organization_id));
create policy facility_locations_public_select on public.facility_locations for select to anon, authenticated using (
  exists (select 1 from public.facilities where id = facility_id and facility_status = 'ACTIVE')
  or exists (select 1 from public.facilities where id = facility_id and public.can_manage_organization(organization_id))
);
create policy facility_locations_managed_write on public.facility_locations for all to authenticated
using (exists (select 1 from public.facilities where id = facility_id and public.can_manage_organization(organization_id)))
with check (exists (select 1 from public.facilities where id = facility_id and public.can_manage_organization(organization_id)));
create policy operating_hours_public_select on public.facility_operating_hours for select to anon, authenticated using (
  exists (select 1 from public.facilities where id = facility_id and facility_status = 'ACTIVE')
  or exists (select 1 from public.facilities where id = facility_id and public.can_manage_organization(organization_id))
);
create policy operating_hours_managed_write on public.facility_operating_hours for all to authenticated
using (exists (select 1 from public.facilities where id = facility_id and public.can_manage_organization(organization_id)))
with check (exists (select 1 from public.facilities where id = facility_id and public.can_manage_organization(organization_id)));
create policy courts_public_select on public.courts for select to anon, authenticated using (
  exists (select 1 from public.facilities where id = facility_id and facility_status = 'ACTIVE')
  or exists (select 1 from public.facilities where id = facility_id and public.can_manage_organization(organization_id))
);
create policy courts_managed_write on public.courts for all to authenticated
using (exists (select 1 from public.facilities where id = facility_id and public.can_manage_organization(organization_id)))
with check (exists (select 1 from public.facilities where id = facility_id and public.can_manage_organization(organization_id)));
create policy rate_rules_public_select on public.court_rate_rules for select to anon, authenticated using (exists (
  select 1 from public.courts c join public.facilities f on f.id = c.facility_id
  where c.id = court_id and (f.facility_status = 'ACTIVE' or public.can_manage_organization(f.organization_id))
));
create policy rate_rules_managed_write on public.court_rate_rules for all to authenticated using (exists (
  select 1 from public.courts c join public.facilities f on f.id = c.facility_id where c.id = court_id and public.can_manage_organization(f.organization_id)
)) with check (exists (
  select 1 from public.courts c join public.facilities f on f.id = c.facility_id where c.id = court_id and public.can_manage_organization(f.organization_id)
));
create policy blocks_public_select on public.court_availability_blocks for select to anon, authenticated using (exists (
  select 1 from public.courts c join public.facilities f on f.id = c.facility_id
  where c.id = court_id and (f.facility_status = 'ACTIVE' or public.can_manage_organization(f.organization_id))
));
create policy blocks_managed_write on public.court_availability_blocks for all to authenticated using (exists (
  select 1 from public.courts c join public.facilities f on f.id = c.facility_id where c.id = court_id and public.can_manage_organization(f.organization_id)
)) with check (exists (
  select 1 from public.courts c join public.facilities f on f.id = c.facility_id where c.id = court_id and public.can_manage_organization(f.organization_id)
));

grant select, insert, update, delete on public.organizations, public.organization_members to authenticated;
grant select on public.facilities, public.facility_locations, public.facility_operating_hours, public.courts, public.court_rate_rules, public.court_availability_blocks to anon, authenticated;
grant insert, update, delete on public.facilities, public.facility_locations, public.facility_operating_hours, public.courts, public.court_rate_rules, public.court_availability_blocks to authenticated;
grant execute on function public.has_application_role(text) to anon, authenticated;
grant execute on function public.can_manage_organization(uuid) to anon, authenticated;
commit;
