-- Promote an existing Supabase Auth user to PickleTayo platform administrator.
--
-- Usage:
--   1. Create the user through PickleTayo registration or Supabase Auth > Users.
--   2. Replace the email below with that user's email address.
--   3. Run this file in the Supabase SQL editor.
--
-- Do not insert passwords directly into auth.users. Supabase Auth owns password
-- hashing and identity records, and its internal schema may change.

begin;

do $$
declare
  admin_email constant text := 'admin@pickletayo.test';
  admin_user_id uuid;
  admin_status text;
begin
  select id
  into admin_user_id
  from auth.users
  where lower(email) = lower(admin_email);

  if admin_user_id is null then
    raise exception
      'No Supabase Auth user exists for %. Create the user first, then rerun this script.',
      admin_email;
  end if;

  insert into public.application_roles (code, description)
  values ('PLATFORM_ADMIN', 'Administers the PickleTayo platform')
  on conflict (code) do update
    set description = excluded.description;

  insert into public.profiles (user_id, given_name, family_name, status)
  select
    id,
    coalesce(raw_user_meta_data ->> 'given_name', 'System'),
    coalesce(raw_user_meta_data ->> 'family_name', 'Administrator'),
    'ACTIVE'
  from auth.users
  where id = admin_user_id
  on conflict (user_id) do nothing;

  select status
  into admin_status
  from public.profiles
  where user_id = admin_user_id;

  if admin_status <> 'ACTIVE' then
    raise exception
      'User % has profile status %. Reactivate the account explicitly before granting administrator access.',
      admin_email,
      admin_status;
  end if;

  insert into public.user_roles (user_id, role_code)
  values (admin_user_id, 'PLATFORM_ADMIN')
  on conflict (user_id, role_code) do nothing;

  insert into public.security_events (user_id, event_type, metadata)
  values (
    admin_user_id,
    'PLATFORM_ADMIN_GRANTED',
    jsonb_build_object('email', admin_email, 'source', 'manual_sql_script')
  );

  raise notice 'Platform administrator granted to % (user ID: %).', admin_email, admin_user_id;
end
$$;

commit;

-- Verification query:
select
  users.id as user_id,
  users.email,
  profiles.status,
  roles.role_code
from auth.users as users
join public.profiles as profiles on profiles.user_id = users.id
join public.user_roles as roles on roles.user_id = users.id
where lower(users.email) = lower('admin@pickletayo.test')
  and roles.role_code = 'PLATFORM_ADMIN';
