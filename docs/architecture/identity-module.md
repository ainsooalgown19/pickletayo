# Identity module

The active identity module is implemented in TypeScript under `frontend/src/modules/identity`. Supabase Auth owns credentials, verification, recovery, and the underlying session lifecycle. PickleTayo owns profiles, platform roles, consent history, authorization rules, and security events. Next.js Route Handlers translate HTTP only; application use cases own workflows; repositories isolate Supabase access. Organization membership remains outside this module.

New accounts receive the `PLAYER` application role. The role catalogue also includes `CLUB_ADMIN`, `COURT_OWNER`, `STAFF`, and `PLATFORM_ADMIN` with explicit permissions. Suspension and closure are explicit server-side operations enforced by application authorization and Row Level Security.

React components never assign roles or perform privileged identity writes directly. Browser authentication uses the Supabase publishable key and secure SSR cookie integration. Service-role operations are restricted to server-only adapters.

Transactional account email uses Supabase Auth templates initially. Product notification email still requires a durable outbox and provider worker for production reliability.
