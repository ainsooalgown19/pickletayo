# PickleTayo MVP Implementation Tracker

**Development workspace:** `E:\Development\picklehub`  
**Reference workspace:** `D:\ProjectSource\Picklehub\picklehub`  
**Last reviewed:** 2026-10-03

This file records the state of the running application. Product requirements and design-system decisions remain in the reference workspace; implementation work belongs here.

## Active architecture — do not override

- PickleTayo is a **full-stack Next.js and TypeScript modular monolith**.
- React is the UI layer; Next.js Route Handlers and server-only TypeScript modules are the backend layer.
- Supabase provides PostgreSQL, Auth, Storage, and related managed infrastructure.
- New backend work belongs under `frontend/src/modules` with thin endpoints under `frontend/src/app/api/v1`.
- The Java/Spring source is **frozen legacy reference only**. Do not add features to it, run it as the MVP backend, or count it as active backend completion.
- The authoritative details are in [`docs/architecture/modular-monolith.md`](docs/architecture/modular-monolith.md).

## Status legend

- **Done** — implemented and verified in the available environment.
- **Partial** — useful implementation exists, but required MVP work remains.
- **Demo only** — the interface works with sample/local state and is not authoritative.
- **Not started** — no usable implementation exists yet.
- **Blocked** — progress requires a missing tool, service, or decision.

## Feature status summary

**Frontend Done** means the agreed MVP screen or its honest unavailable/disabled state is implemented and verified. It does not imply that an external service or unfinished backend workflow is operational.

| ID | MVP feature | Frontend status | Backend status | Overall task status | Next task |
| --- | --- | --- | --- | --- | --- |
| F01 | PickleTayo brand and UI foundation | **Done** | N/A | **Partial** | Add production logo/favicon assets and complete the accessibility review. |
| F02 | Development environment | **Done** | **Partial** | **Partial** | Generate Supabase database types, add a root development command, and configure the server-only service-role credential. |
| F03 | Registration and authentication | **Done** | **Partial** | **Partial** | Verify registration, email confirmation, and password recovery live; add production rate limits. |
| F04 | Player profile and account security | **Done** | **Partial** | **Partial** | Apply profile persistence, then add preferences, expanded player data, and account closure. |
| F05 | Court discovery | **Done** | **Partial** | **Partial** | Add amenities, facility images, geolocation, and account-synced favorites. |
| F06 | Schedules and availability | **Done** | **Partial** | **Partial** | Add taxes/service fees and expand concurrency, timezone, and boundary testing. |
| F07 | Booking lifecycle | **Done** | **Partial** | **Partial** | Add payment submission/confirmation, cancellation policy, and broader concurrency/authorization coverage. |
| F08 | Payments | **Done (disabled state)** | **Not started** | **Blocked** | Select a provider and implement payment intents, verified webhooks, reconciliation, and refunds. |
| F09 | Email and notifications | **Done** | **Partial** | **Partial** | Add Gmail credentials, verify live delivery, and schedule the protected outbox worker. |
| F10 | Facility operations | **Done** | **Partial** | **Partial** | Add member management, facility editing/images, manual bookings, and moderation. |
| F11 | Trust, security, and audit | **Done** | **Partial** | **Partial** | Apply and test RLS, then add server authorization, rate limits, and complete audit events. |
| F12 | Quality and release readiness | **Done** | **Partial** | **Partial** | Add Supabase integration tests, accessibility, CI, and staging checks. |

## Tasks by feature

Backend completion below refers only to the active Next.js/TypeScript modules. Existing Java implementations are labeled **legacy reference** and do not satisfy an MVP checkbox.

### F01 — PickleTayo brand and UI foundation

- [x] Replace visible TaraPickle branding with PickleTayo.
- [x] Apply emerald `#0A7E45` and cyan `#00A3E0` brand anchors.
- [x] Apply the Pickle/Tayo two-color wordmark treatment.
- [x] Add the location-pin, paddle, and ball interface mark.
- [x] Provide responsive desktop/mobile layouts and light/dark themes.
- [ ] Add approved SVG logo, app icon, favicon, and social-sharing artwork.
- [ ] Review every screen for WCAG 2.2 AA contrast, focus, keyboard, zoom, and reduced motion.
- [ ] Replace remaining Singapore/sample copy and dollar pricing with approved Philippine MVP content and currency.

### F02 — Development environment and reproducibility

- [x] Configure pnpm dependency build approvals.
- [x] Verify frontend type checking, unit tests, and production build.
- [x] Run the development frontend on port 3000.
- [x] Save the Supabase project URL and publishable key in the ignored local environment.
- [x] Add Supabase browser and server clients with runtime environment validation.
- [x] Add the first versioned Supabase identity/RLS SQL migration.
- [ ] Add local/remote migration commands and generated database types.
- [ ] Add a root development command for the full-stack Next.js application.
- [ ] Add environment validation with clear missing-variable messages.
- [ ] Add full-stack TypeScript continuous integration.

### F03 — Registration and authentication

- [x] Legacy Java reference: registration, verification, sign-in, refresh, logout, and recovery behavior exists for consultation only.
- [x] Frontend registration, verification, sign-in, forgot/reset-password, and sign-out forms.
- [x] Restore a frontend session with the refresh endpoint.
- [x] Require authentication before booking checkout.
- [x] Map backend problem responses and no-content responses correctly.
- [x] Implement Supabase Auth in the TypeScript identity module.
- [ ] Persist application roles and permissions with server-side authorization and RLS.
- [x] Replace the legacy API client/session assumptions with Supabase SSR cookie sessions.
- [ ] Test register → verify → sign in → restore → sign out end to end.
- [ ] Add production rate limits to registration, login, verification, and password recovery.
- [ ] Add authentication integration and browser tests.

### F04 — Player profile and account security

- [x] Legacy Java reference: account and session-management contracts exist for consultation only.
- [x] Display the authenticated user's real name, email, status, role, and join date.
- [ ] Implement the TypeScript players module and Supabase profile schema.
- [ ] Add player-profile persistence for name, location, skill level, preferred formats, and visibility.
- [x] Add profile edit form with validation and save feedback.
- [x] Add change-password screen.
- [x] Add signed-in device/session management screen.
- [ ] Add account closure/deletion workflow with confirmation, audit, and retention handling.

### F05 — Court and facility discovery

- [x] Responsive discovery experience.
- [x] Search input, quick filters, facility cards, details drawer, and favorites interaction.
- [x] Loading, empty, and application error foundations.
- [x] Legacy Java reference: facility tables, models, services, migrations, and API contracts exist for consultation only.
- [ ] Create Supabase organization, facility, court, hours, amenity, and image migrations with RLS.
- [x] Implement the TypeScript facilities module and discovery Route Handlers.
- [ ] Add amenity and facility-image persistence.
- [x] Add server search, city, indoor/outdoor/covered, client price filtering, and pagination.
- [ ] Add geolocation distance, map, and availability-first filtering.
- [x] Replace sample court data with live API queries and explicit unavailable/loading/empty states.
- [x] Persist favorites in local browser storage.
- [ ] Persist favorites to the player account across devices.
- [ ] Add operator-managed facility images with validation and safe storage.

### F06 — Schedules, pricing, and availability

- [x] Demonstration time-slot selection UI.
- [x] Legacy Java reference: hours, blocks, rates, availability calculation, and overlap behavior exist for consultation only.
- [x] Implement hours, blocks, rates, timezone handling, and availability in the TypeScript facilities module.
- [x] Add a Next.js facility/date availability Route Handler.
- [x] Add transactional PostgreSQL overlap protection through a Supabase migration.
- [ ] Add taxes and service-fee rules.
- [x] Replace sample slots and prices with timezone-aware server responses.
- [ ] Add concurrency, timezone, closure, and boundary-condition tests.

### F07 — Booking lifecycle

- [x] Booking review, price summary, and confirmation demonstration.
- [x] Guest checkout redirects into authentication.
- [x] Legacy Java reference: booking states, holds, idempotency, expiry, and endpoint contracts exist for consultation only.
- [x] Implement the MVP hold, expiry, and cancellation state transitions in the TypeScript bookings module.
- [x] Add idempotent 10-minute holds, authoritative expiry, list/detail, and cancellation use cases.
- [x] Add thin Next.js booking Route Handlers backed by Supabase persistence.
- [ ] Add cancellation policy and refund-eligibility calculation.
- [x] Connect frontend checkout to authenticated idempotent booking holds.
- [x] Replace the static booking card with actual user bookings and cancellation actions.
- [ ] Add race-condition, duplicate-submit, cancellation, and authorization tests.

### F08 — Payments

- [ ] Approve the MVP payment provider and supported methods.
- [ ] Create payment-intent/order endpoint tied to a valid booking hold.
- [ ] Verify signed provider webhooks.
- [ ] Make webhook handling idempotent.
- [ ] Confirm booking only from authoritative server/provider status.
- [ ] Add failed, cancelled, expired, refunded, and reconciliation states.
- [ ] Add receipts and payment-reference display.
- [ ] Remove the demonstration payment confirmation when integration begins.

### F09 — Email and notifications

- [x] Legacy Java reference: email ports and account-event behavior exist for consultation only.
- [x] Select Gmail SMTP as the initial transactional email provider.
- [ ] Add Gmail app-password credentials and verify live delivery.
- [x] Add transactional outbox persistence and a protected delivery-worker endpoint.
- [x] Add booking hold, confirmation, cancellation, and receipt templates; Supabase Auth owns verification and reset-password templates.
- [x] Add retry, dead-letter, provider-reference, and delivery-status tracking.
- [x] Add notification-preference schema and endpoints.
- [x] Add user-facing notification settings.

### F10 — Facility and platform operations

- [x] Legacy Java reference: roles, admin bootstrap, memberships, and organization rules exist for consultation only.
- [x] Seed roles and implement the platform-admin bootstrap in Supabase/TypeScript.
- [ ] Implement organization membership management; organization/facility command authorization now has server checks and RLS.
- [x] Add organization, facility, court, and facility-status management screens.
- [x] Add operating-hours, closure, maintenance, and pricing screens.
- [ ] Add facility editing and Supabase Storage image management.
- [x] Add organization-scoped booking search, operator cancellation, and check-in tools.
- [ ] Add manual booking tools.
- [ ] Add platform review/moderation for facilities and operators.

### F11 — Trust, security, privacy, and audit

- [x] Legacy Java reference: password, token, consent, error, and security-event behavior exists for consultation only.
- [x] Configure secure Supabase SSR cookie handling and separate browser/server clients.
- [x] Apply and verify the committed Supabase Auth/profile RLS policies.
- [ ] Implement role/permission, consent, structured-error, and security-event foundations in TypeScript.
- [ ] Add distributed rate limiting and abuse monitoring.
- [ ] Add request correlation and safe centralized logging.
- [ ] Add audit events for facility, schedule, price, booking, payment, and admin changes.
- [ ] Define privacy export, deletion, retention, and consent-version workflows.
- [ ] Perform dependency, secret, authorization, and OWASP review before release.

### F12 — Quality, deployment, and release readiness

- [x] Frontend TypeScript check.
- [x] Frontend unit tests.
- [x] Frontend production build.
- [x] Legacy reference only: the Java code compiled and its 10 domain tests passed before the architecture switch.
- [x] Add TypeScript identity-domain unit tests; all 6 frontend/full-stack unit tests pass.
- [x] Run live-inventory booking-start and platform-operator journeys in desktop and mobile Chromium using mocked API responses.
- [ ] Expand browser coverage through authenticated hold creation and cancellation.
- [ ] Add TypeScript module unit tests and Supabase integration tests.
- [ ] Add Route Handler contract tests between React features and server modules.
- [ ] Add accessibility automation and manual keyboard/screen-reader review.
- [ ] Add continuous integration with required checks.
- [ ] Add staging configuration, migrations, backups, monitoring, and alerts.
- [ ] Run MVP acceptance test and release-readiness review.

## Backend and integration task queue

Work from top to bottom unless a blocker forces a temporary change.

| Priority | Task | Status | Dependency or completion condition |
| --- | --- | --- | --- |
| NEXT-01 | Add Supabase browser/server clients, typed environment validation, and a Next.js health Route Handler. | **Done** | Health route returns `200`; Supabase Auth settings endpoint and publishable credentials are verified. |
| NEXT-02 | Add versioned Supabase SQL migrations, generated database types, RLS baseline, and migration workflow. | **Partial** | Identity/RLS migration is applied and Prisma reports no pending migrations; generated Supabase types remain. |
| NEXT-03 | Implement the TypeScript identity module with Supabase Auth, profiles, roles, and SSR cookie sessions. | **Partial** | Auth, SSR cookies, account endpoints, live profile/role schema, role guards, and admin bootstrap exist; privileged feature routes must adopt the guards as they are implemented. |
| NEXT-04 | Connect and verify registration, verification, sign-in, recovery, session restoration, and sign-out end to end. | **Partial** | Live administrator sign-in, database-backed role loading, session restoration, and sign-out pass; live registration, email confirmation, and recovery acceptance remain. |
| NEXT-05 | Implement player profiles, preferences, favorites, security actions, and account closure. | **Not started** | Identity and profile schema. |
| NEXT-06 | Implement organizations, facilities, courts, schedules, prices, blocks, discovery, and Storage images. | **Partial** | Core schema, RLS, services, routes, and admin screens are implemented; amenities, editing, and Storage images remain. |
| NEXT-07 | Implement authoritative availability, transactional holds, expiry, booking history, cancellation, and concurrency tests. | **Partial** | Availability, overlap exclusion, idempotent holds, lazy expiry, owned history/detail, and cancellation are implemented; payment transition and broader integration coverage remain. |
| NEXT-08 | Add operator booking tools, check-in, moderation, and complete audit events. | **Partial** | Scoped booking search, cancellation, and check-in are implemented; manual bookings, moderation, and broader audit events remain. |
| NEXT-09 | Add transactional notifications and provider-backed payments with verified webhooks. | **Partial** | Gmail-ready outbox, templates, retries, and preferences are implemented; Gmail credentials/live delivery and the future payment provider remain. |
| NEXT-10 | Add full-stack contract/integration/accessibility tests, CI, staging, monitoring, backups, and acceptance review. | **Partial** | Completion of the active TypeScript backend modules. |

## Compatibility decisions

- Keep the legacy Java source temporarily as read-only behavior reference; do not extend or deploy it.
- Preserve useful endpoint shapes only when they fit the new TypeScript modules; there is no requirement to maintain Spring implementation compatibility.
- Use PickleTayo/Supabase environment names for the active application. Do not add new `TARAPICKLE_*` variables.
- Remove the Java application, Maven files, Docker database setup, and obsolete docs in a dedicated cleanup after the TypeScript replacement covers the required behavior.

## Current blockers and cautions

- The Supabase project URL, publishable and server-only secret keys, pooled/direct database access, identity migration, RLS policies, administrator password, and platform-admin role are configured and verified.
- Existing React screens and API clients were built around the legacy API contracts. They must be connected to the new Next.js Route Handlers as each TypeScript module is implemented.
- Java/Spring behavior and passing tests are legacy reference only and must not be reported as active backend completion.
- Email and payments remain intentionally unavailable until providers are selected and implemented in server-only TypeScript modules.
- The Git root is `E:\Development`, not this project folder. Commits must be scoped to `picklehub` so neighboring project changes are never included.
