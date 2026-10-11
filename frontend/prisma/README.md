# Prisma database workflow

Prisma manages PickleTayo's application tables in PostgreSQL. Supabase Auth
continues to manage `auth.users`, passwords, sessions, and identities. Prisma's
external-table configuration allows relations to `auth.users` without giving
Prisma ownership of that table.

1. Copy the pooled and direct PostgreSQL URLs from **Supabase Dashboard >
   Connect** into the ignored `.env.local` file as `DATABASE_URL` and
   `DIRECT_URL`.
2. Run `pnpm db:setup` to generate the client and apply committed migrations.
3. Run `pnpm dev` to start Next.js.

For a schema change, edit `prisma/schema.prisma`, run `pnpm db:migrate`, review
the generated SQL, and commit the migration. Add Supabase RLS policies,
triggers, or functions to the generated SQL because Prisma Schema Language does
not represent those database features.

Deployments run `pnpm db:deploy` before starting the application. Next.js does
not mutate the database schema automatically at application startup.

Prisma connects with a privileged server-side database role and therefore may
bypass Supabase RLS. Application services must authorize the signed-in user
before issuing Prisma queries; never import the Prisma client into browser code.
