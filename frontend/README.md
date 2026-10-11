# PickleTayo full-stack application

Next.js App Router modular monolith for PickleTayo. React provides the UI, while Next.js Route Handlers and server-only TypeScript modules provide the backend. Supabase supplies PostgreSQL, Auth, and Storage.

## Local development

1. Configure the ignored local Supabase environment values.
2. Run `pnpm install` and `pnpm dev --port 3000`.
3. Open <http://localhost:3000>.

There is no separate Java API in the active architecture. Backend endpoints are implemented inside this application under `/api/v1`.

Apply and verify the Supabase schema with:

```powershell
pnpm.cmd db:setup
pnpm.cmd db:verify-admin
pnpm.cmd db:verify-booking
```

After signing in with a `PLATFORM_ADMIN`, `CLUB_ADMIN`, `COURT_OWNER`, or `STAFF` account, open `/admin`. Platform administrators can create organizations at `/admin/organizations`; authorized operators can manage facilities, courts, hours, rates, and closure blocks at `/admin/facilities`, then search, cancel, and check in scoped bookings at `/admin/bookings`.

To enable the facility location picker, add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local`. The Google Cloud project must have Maps JavaScript API and Places API (New) enabled, and the key should be restricted to the application's web origins and those two APIs. `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` is optional during local development.

## Gmail notifications

Booking emails use a durable database outbox. Add the following server-only values to `.env.local` using a Google app password rather than the Gmail account password:

```dotenv
EMAIL_PROVIDER=gmail
GMAIL_USER=notifications@example.com
GMAIL_APP_PASSWORD=your-16-character-app-password
EMAIL_FROM=PickleTayo <notifications@example.com>
NOTIFICATION_WORKER_SECRET=generate-a-long-random-secret
```

With the development server running, process pending messages with:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/v1/internal/notifications/process -Headers @{ Authorization = "Bearer $env:NOTIFICATION_WORKER_SECRET" }
```

Production should call the same protected endpoint from a scheduler. Failed delivery is retried with backoff and becomes dead-lettered after five attempts.

## Architecture notes

- Server state stays in TanStack Query where client-side fetching is appropriate; Zustand is limited to persistent UI preferences.
- Business modules live under `src/modules`; Route Handlers are thin adapters and React features do not query privileged data directly.
- Facility discovery, core facility operations, authoritative availability, transactional booking holds, player booking history, and the operator booking desk use the TypeScript modules and Supabase schema. Amenities, images, manual operator bookings, and provider-backed payments remain planned work.
- Successful bookings and payments must always be confirmed by refetching backend status; the current demonstration does not call a payment provider.

## Platform administrator provisioning

Administrator passwords are managed by Supabase Auth and must not be written directly to `auth.users`. Add the server-only `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`, then provide `ADMIN_EMAIL` and `ADMIN_PASSWORD` only to the provisioning process and run:

```powershell
$adminCredential = Get-Credential -UserName admin@pickletayo.test
$env:ADMIN_EMAIL = $adminCredential.UserName
$env:ADMIN_PASSWORD = $adminCredential.GetNetworkCredential().Password
pnpm.cmd admin:provision
Remove-Item Env:ADMIN_EMAIL,Env:ADMIN_PASSWORD
```

The command creates or updates the Supabase Auth user, confirms the email, activates the application profile, grants `PLATFORM_ADMIN`, and records an audit event. Never expose the service-role key or administrator password through a `NEXT_PUBLIC_` variable.
