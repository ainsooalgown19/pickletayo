create table public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.court_bookings(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by_user_id uuid references auth.users(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now()
);

create index booking_status_history_booking_idx on public.booking_status_history(booking_id, changed_at);
alter table public.booking_status_history enable row level security;

create policy booking_history_owner_or_manager_select on public.booking_status_history for select to authenticated using (
  exists (
    select 1 from public.court_bookings booking
    where booking.id = booking_id
      and (booking.booked_by_user_id = (select auth.uid()) or public.can_manage_organization(booking.organization_id))
  )
);

grant select on public.booking_status_history to authenticated;
