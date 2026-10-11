# PickleTayo

PickleTayo's MVP development workspace. The active architecture is one full-stack Next.js and TypeScript modular monolith: React provides the UI, Next.js server modules and Route Handlers provide the backend, and Supabase provides managed PostgreSQL, authentication, and storage.

The product requirements and design system are maintained separately in `D:\ProjectSource\Picklehub\picklehub`; application changes belong in this development folder.

See [MVP_IMPLEMENTATION_TRACKER.md](MVP_IMPLEMENTATION_TRACKER.md) for the current implementation status and next priorities.

See [UPDATE_LOG.md](UPDATE_LOG.md) for concise development updates and verification results.

See [the accepted modular-monolith architecture](docs/architecture/modular-monolith.md) for the permanent stack decision, module ownership, dependency rules, and implementation order.

> **Architecture constraint:** Do not continue the Java/Spring backend. The Java source is retained only as legacy reference and does not count as active MVP backend completion.

## Run locally

1. Open the `frontend` directory.
2. Run `pnpm install`.
3. Run `pnpm dev --port 3000`.

Open <http://127.0.0.1:3000>.

The ignored `frontend/.env.local` stores local Supabase configuration. Server-only secrets must never be prefixed with `NEXT_PUBLIC_` or committed to Git. The Supabase identity and facility-operation migrations are deployed, live administrator authentication is verified, and the routed admin console is available at `/admin`.

## Sample venues for visual testing

From `frontend`, run `pnpm db:seed-sample` to preview, then `pnpm db:seed-sample --apply` to save to the development database configured by `DIRECT_URL`. Never target a production database. The script also refuses `NODE_ENV=production`.

The fictional dataset includes six demo venues, 18 courts (one under maintenance), daily opening hours, and evening peak rates. Venues are marked `(Demo)`; addresses and map positions are illustrative, not verified. Discover and admin facility pages use these database records; Open Play, Events, Clubs, and Manage retain their existing static samples. No accounts, bookings, or payments are created.

Repeat runs only insert missing records and preserve edits. Ownership defaults to the single active platform administrator with a `.test` email; set `SAMPLE_OWNER_USER_ID` explicitly if needed. All inserts run in one transaction.
