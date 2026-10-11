import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });
if (!process.env.DIRECT_URL) throw new Error("DIRECT_URL is required.");

const client = new pg.Client({ connectionString: process.env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
let overlapProtected = false;
let idempotencyProtected = false;

try {
  await client.query("begin");
  const user = await client.query("select id from auth.users order by created_at limit 1");
  if (!user.rowCount) throw new Error("A Supabase Auth user is required for constraint verification.");
  const organizationId = randomUUID();
  const facilityId = randomUUID();
  const courtId = randomUUID();
  const key = `constraint-check-${randomUUID()}`;
  await client.query("insert into public.organizations (id, organization_type, legal_name, display_name, owner_user_id) values ($1, 'COURT_OPERATOR', 'Constraint Check', 'Constraint Check', $2)", [organizationId, user.rows[0].id]);
  await client.query("insert into public.facilities (id, organization_id, facility_name, branch_code, facility_status) values ($1, $2, 'Constraint Check', $3, 'ACTIVE')", [facilityId, organizationId, `CHECK-${randomUUID()}`]);
  await client.query("insert into public.courts (id, facility_id, court_code, court_name, court_type, surface_type, base_hourly_rate) values ($1, $2, 'CHECK', 'Constraint Court', 'INDOOR', 'Synthetic', 1)", [courtId, facilityId]);
  await client.query(`insert into public.court_bookings (organization_id, booking_reference, facility_id, court_id, booked_by_user_id, booking_start, booking_end, booking_status, subtotal_amount, total_amount, idempotency_key, hold_expires_at)
    values ($1, $2, $3, $4, $5, '2099-01-01T01:00:00Z', '2099-01-01T02:00:00Z', 'HOLD', 1, 1, $6, '2099-01-01T00:10:00Z')`, [organizationId, `VERIFY-${randomUUID()}`, facilityId, courtId, user.rows[0].id, key]);

  await client.query("savepoint overlap_check");
  try {
    await client.query(`insert into public.court_bookings (organization_id, booking_reference, facility_id, court_id, booked_by_user_id, booking_start, booking_end, booking_status, subtotal_amount, total_amount, idempotency_key, hold_expires_at)
      values ($1, $2, $3, $4, $5, '2099-01-01T01:30:00Z', '2099-01-01T02:30:00Z', 'HOLD', 1, 1, $6, '2099-01-01T00:10:00Z')`, [organizationId, `VERIFY-${randomUUID()}`, facilityId, courtId, user.rows[0].id, `${key}-overlap`]);
  } catch (cause) {
    overlapProtected = cause && typeof cause === "object" && "code" in cause && cause.code === "23P01";
    await client.query("rollback to savepoint overlap_check");
  }

  await client.query("savepoint idempotency_check");
  try {
    await client.query(`insert into public.court_bookings (organization_id, booking_reference, facility_id, court_id, booked_by_user_id, booking_start, booking_end, booking_status, subtotal_amount, total_amount, idempotency_key, hold_expires_at)
      values ($1, $2, $3, $4, $5, '2099-01-01T03:00:00Z', '2099-01-01T04:00:00Z', 'HOLD', 1, 1, $6, '2099-01-01T00:10:00Z')`, [organizationId, `VERIFY-${randomUUID()}`, facilityId, courtId, user.rows[0].id, key]);
  } catch (cause) {
    idempotencyProtected = cause && typeof cause === "object" && "code" in cause && cause.code === "23505";
    await client.query("rollback to savepoint idempotency_check");
  }

  await client.query("rollback");
  console.log(JSON.stringify({ overlapProtected, idempotencyProtected, persistedTestRecords: false }, null, 2));
  if (!overlapProtected || !idempotencyProtected) process.exitCode = 1;
} catch (cause) {
  await client.query("rollback").catch(() => undefined);
  throw cause;
} finally {
  await client.end();
}
