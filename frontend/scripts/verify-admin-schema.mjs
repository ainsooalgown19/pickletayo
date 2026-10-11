import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL is required in .env.local.");
}

const expectedTables = [
  "booking_status_history",
  "court_availability_blocks",
  "court_bookings",
  "court_rate_rules",
  "courts",
  "facilities",
  "facility_locations",
  "facility_operating_hours",
  "organization_members",
  "organizations",
  "notification_outbox",
  "notification_preferences",
];

const client = new pg.Client({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query("begin read only");

  const tables = await client.query(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
      order by table_name`,
    [expectedTables],
  );
  const policies = await client.query(
    `select count(*)::int as count
       from pg_policies
      where schemaname = 'public'
        and tablename = any($1::text[])`,
    [expectedTables],
  );
  const migration = await client.query(
    `select exists(
       select 1 from public._prisma_migrations
        where migration_name = '202610030003_notification_outbox'
          and finished_at is not null
     ) as applied`,
  );

  const actualTables = tables.rows.map(({ table_name }) => table_name);
  const missingTables = expectedTables.filter((table) => !actualTables.includes(table));
  const result = {
    ok: missingTables.length === 0 && migration.rows[0].applied,
    tables: actualTables.length,
    policies: policies.rows[0].count,
    migrationApplied: migration.rows[0].applied,
    missingTables,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} finally {
  await client.query("rollback").catch(() => undefined);
  await client.end();
}
