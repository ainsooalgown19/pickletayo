# PickleTayo TypeScript modular monolith

**Decision status:** Accepted  
**Effective date:** 2026-09-30  
**Supersedes:** The Spring Boot modular-monolith plan

## Non-negotiable architecture decision

PickleTayo MVP is one full-stack **Next.js and TypeScript modular monolith**. React renders the user interface; Next.js Route Handlers and server-only TypeScript modules provide the backend. Supabase provides managed infrastructure such as PostgreSQL, authentication, and storage.

The Java/Spring code in the repository is legacy reference code. It must not receive new features, and it does not count as completion of the active backend. Do not start, extend, migrate, or deploy the Java backend unless a later written architecture decision explicitly reverses this decision.

## Deployment boundary

The MVP has one application and one deployment boundary:

```text
Browser
  -> Next.js UI (React)
  -> Next.js API/Server layer (TypeScript)
  -> Supabase (PostgreSQL, Auth, Storage)
```

- Client components may use the Supabase publishable key only for approved user-scoped operations.
- Privileged data access, validation, authorization, booking rules, and service-role operations must run in server-only modules.
- The Supabase service-role key must never be exposed through a `NEXT_PUBLIC_*` variable or sent to the browser.
- Browser code must not contain business rules that protect inventory, permissions, prices, or payments.

## Module boundaries

Active backend modules live under `frontend/src/modules`. Each module owns its domain rules, application services, server adapters, and tests.

```text
frontend/src/
  app/
    api/v1/                 # thin Next.js Route Handlers
  features/                 # React screens and UI orchestration
  modules/
    identity/
    players/
    organizations/
    facilities/
    bookings/
    notifications/
    payments/
  lib/
    supabase/               # browser/server clients and shared infrastructure
    validation/
```

Within a module, use these boundaries where needed:

```text
domain/          # entities, value objects, and invariant rules
application/     # use cases and ports
infrastructure/  # Supabase repositories and external providers
api/             # request/response schemas used by Route Handlers
```

Route Handlers remain thin: authenticate, validate input, call one application use case, and map the result. They must not implement business logic or query Supabase directly.

## Dependency direction

```text
payments -> bookings -> facilities -> organizations -> identity -> shared infrastructure
notifications -> application events from other modules
players -> identity
```

- A module may use another module only through its exported public interface.
- Modules must not import another module's internal repository or database adapter.
- Shared infrastructure contains technical utilities only and must not own product rules.
- Cross-module side effects use explicit application events or orchestrating use cases, not hidden database triggers as the primary application workflow.

## Supabase ownership

- **PostgreSQL:** authoritative product data and transactional constraints.
- **Supabase Auth:** identity and secure session lifecycle for the Next.js application.
- **Row Level Security:** defense in depth; server application authorization remains mandatory.
- **Storage:** facility and profile images with validated paths, MIME types, and size limits.
- **Migrations:** versioned SQL committed to the repository and applied consistently across environments.

The publishable key may be public. Database passwords and service-role keys are server-only secrets stored in ignored local environment files and deployment secret storage.

## MVP module order

1. Supabase clients, environment validation, schema migrations, and health check.
2. Identity, roles, sessions, and the platform-admin bootstrap process.
3. Player profile and account security.
4. Organizations, facilities, courts, hours, prices, blocks, and discovery.
5. Server-calculated availability and transactional booking holds.
6. Booking history, cancellation, and operator tools.
7. Transactional notifications.
8. Provider-backed payments, webhooks, reconciliation, and refunds.
9. Audit, accessibility, end-to-end tests, CI, staging, and release hardening.

## Legacy Java policy

The existing Java source may be consulted for domain behavior and API-contract ideas only. New implementation must be TypeScript in the Next.js modular monolith. Java test results, Flyway migrations, controllers, and services are historical evidence and are not active MVP backend completion.

Removing the legacy Java files is a separate cleanup task. Until then, documentation and task status must clearly label them as legacy so no future work accidentally continues that stack.
