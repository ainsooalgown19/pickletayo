import { config as loadEnvironment } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnvironment({ path: ".env.local" });
loadEnvironment();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Supabase owns auth.users. Prisma recreates only this minimal stand-in in
    // its disposable shadow database so relations can be validated safely.
    initShadowDb: `
      create schema if not exists auth;
      create table if not exists auth.users (
        id uuid primary key,
        raw_user_meta_data jsonb
      );
      create or replace function auth.uid()
      returns uuid language sql stable as 'select null::uuid';
      do $shadow$
      begin
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then
          execute 'create role authenticated nologin';
        end if;
      end
      $shadow$;
    `,
  },
  datasource: {
    // Prisma CLI operations need the direct Supabase connection. Falling back
    // to DATABASE_URL also supports ordinary PostgreSQL deployments.
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://prisma:prisma@127.0.0.1:5432/prisma",
  },
  experimental: {
    externalTables: true,
  },
  tables: {
    external: ["auth.users"],
  },
});
