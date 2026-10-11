create extension if not exists btree_gist;

create table public.court_bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  booking_reference text not null unique,
  facility_id uuid not null references public.facilities(id),
  court_id uuid not null references public.courts(id),
  booked_by_user_id uuid not null references auth.users(id),
  booking_start timestamptz not null,
  booking_end timestamptz not null,
  booking_status text not null check (booking_status in ('HOLD','PENDING_PAYMENT','CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','NO_SHOW','EXPIRED')),
  subtotal_amount numeric(12,2) not null check (subtotal_amount >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  currency_code char(3) not null default 'PHP',
  payment_status text not null default 'UNPAID' check (payment_status in ('UNPAID','PARTIALLY_PAID','PAID','REFUNDED')),
  idempotency_key text,
  hold_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booked_by_user_id, idempotency_key),
  check (booking_start < booking_end),
  check (booking_status <> 'HOLD' or hold_expires_at is not null)
);

alter table public.court_bookings add constraint court_bookings_no_active_overlap
  exclude using gist (
    court_id with =,
    tstzrange(booking_start, booking_end, '[)') with &&
  ) where (booking_status in ('HOLD','PENDING_PAYMENT','CONFIRMED','CHECKED_IN'));

create index court_bookings_facility_start_idx on public.court_bookings(facility_id, booking_start);
create index court_bookings_court_period_idx on public.court_bookings(court_id, booking_start, booking_end, booking_status);
create index court_bookings_user_created_idx on public.court_bookings(booked_by_user_id, created_at desc);
create index court_bookings_expiring_holds_idx on public.court_bookings(hold_expires_at) where booking_status = 'HOLD';

alter table public.court_bookings enable row level security;

create policy bookings_owner_or_manager_select on public.court_bookings for select to authenticated using (
  booked_by_user_id = (select auth.uid()) or public.can_manage_organization(organization_id)
);

grant select on public.court_bookings to authenticated;
