import { createHash } from "node:crypto";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const apply = process.argv.includes("--apply");
if (process.argv.slice(2).some((argument) => argument !== "--apply")) {
  throw new Error("Usage: node scripts/seed-sample-data.mjs [--apply]");
}
if (process.env.NODE_ENV === "production") {
  throw new Error("Sample data must not be seeded in production.");
}
if (!process.env.DIRECT_URL)
  throw new Error("DIRECT_URL is required in .env.local.");

// Stable IDs make repeat runs insert-only: manually edited demo records are preserved.
function sampleId(key) {
  const bytes = createHash("sha256")
    .update(`pickletayo:visual-demo:v1:${key}`)
    .digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const venues = [
  {
    key: "riverside",
    name: "Riverside Pickleball Club",
    city: "Pasig",
    province: "Metro Manila",
    latitude: 14.5764,
    longitude: 121.0851,
    type: "INDOOR",
    courts: 4,
    rate: 650,
    surface: "Cushioned acrylic",
    description:
      "Spacious indoor courts with spectator seating and a beginner-friendly atmosphere.",
  },
  {
    key: "skyline",
    name: "Skyline Rooftop Courts",
    city: "Taguig",
    province: "Metro Manila",
    latitude: 14.5507,
    longitude: 121.0508,
    type: "OUTDOOR",
    courts: 2,
    rate: 950,
    surface: "Acrylic hard court",
    description:
      "Rooftop pickleball with city views, evening lighting, and space to relax between games.",
  },
  {
    key: "garden",
    name: "Garden City Pickleball Park",
    city: "Quezon City",
    province: "Metro Manila",
    latitude: 14.6507,
    longitude: 121.0497,
    type: "COVERED",
    courts: 4,
    rate: 400,
    surface: "Textured acrylic",
    description:
      "Covered neighborhood courts surrounded by greenery, ideal for casual games and group sessions.",
    maintenanceCourt: 4,
  },
  {
    key: "coastline",
    name: "Coastline Sports Hub",
    city: "Cebu City",
    province: "Cebu",
    latitude: 10.3157,
    longitude: 123.8854,
    type: "INDOOR",
    courts: 3,
    rate: 550,
    surface: "Cushioned acrylic",
    description:
      "Bright indoor courts with comfortable sidelines and a welcoming local pickleball community.",
  },
  {
    key: "southside",
    name: "Southside Community Courts",
    city: "Muntinlupa",
    province: "Metro Manila",
    latitude: 14.4081,
    longitude: 121.0415,
    type: "OUTDOOR",
    courts: 2,
    rate: 300,
    surface: "Painted concrete",
    description:
      "Affordable outdoor courts for morning practice, friendly doubles, and weekend play.",
  },
  {
    key: "highland",
    name: "Highland Pickleball Pavilion",
    city: "Davao City",
    province: "Davao del Sur",
    latitude: 7.0731,
    longitude: 125.6128,
    type: "COVERED",
    courts: 3,
    rate: 450,
    surface: "Acrylic hard court",
    description:
      "An airy covered pavilion with shaded seating and courts for players of all skill levels.",
  },
];

const organizationId = sampleId("organization");
const organizationName = "PickleTayo Demo Venues (Sample Data)";
const database = new pg.Client({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});
const inserted = {};

async function insert(table, columns, values) {
  // Identifiers below are internal constants, never user input.
  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
  const result = await database.query(
    `insert into public.${table} (${columns.join(", ")}) values (${placeholders}) on conflict do nothing`,
    values,
  );
  inserted[table] = (inserted[table] ?? 0) + result.rowCount;
}

try {
  await database.connect();
  await database.query("begin");
  // Serialize repeat invocations so two runs cannot race.
  await database.query("select pg_advisory_xact_lock(861004001)");
  const owners = await database.query(
    `select u.id from auth.users u
       join public.user_roles r on r.user_id = u.id
       join public.profiles p on p.user_id = u.id
      where r.role_code = 'PLATFORM_ADMIN' and p.status = 'ACTIVE'
        and (($1::uuid is not null and u.id = $1::uuid)
          or ($1::uuid is null and u.email like '%.test'))`,
    [process.env.SAMPLE_OWNER_USER_ID || null],
  );
  if (owners.rows.length !== 1) {
    throw new Error(
      "Expected one active test platform administrator. Set SAMPLE_OWNER_USER_ID to an existing development administrator to select explicitly.",
    );
  }
  const ownerId = owners.rows[0].id;
  const existing = await database.query(
    "select display_name, owner_user_id from public.organizations where id = $1",
    [organizationId],
  );
  if (
    existing.rows.length &&
    (existing.rows[0].display_name !== organizationName ||
      existing.rows[0].owner_user_id !== ownerId)
  ) {
    throw new Error(
      "The demo organization was changed. No data was written; review its ownership/name before reseeding.",
    );
  }
  await insert(
    "organizations",
    [
      "id",
      "organization_type",
      "legal_name",
      "display_name",
      "status",
      "owner_user_id",
    ],
    [
      organizationId,
      "COURT_OPERATOR",
      organizationName,
      organizationName,
      "ACTIVE",
      ownerId,
    ],
  );

  for (const venue of venues) {
    const facilityId = sampleId(`facility:${venue.key}`);
    await insert(
      "facilities",
      [
        "id",
        "organization_id",
        "facility_name",
        "branch_code",
        "description",
        "facility_status",
        "timezone",
      ],
      [
        facilityId,
        organizationId,
        `${venue.name} (Demo)`,
        `DEMO-${venue.key.toUpperCase()}`,
        `FICTIONAL SAMPLE VENUE — for development and visual testing only. ${venue.description}`,
        "ACTIVE",
        "Asia/Manila",
      ],
    );
    const facility = await database.query(
      "select organization_id from public.facilities where id = $1",
      [facilityId],
    );
    if (facility.rows[0]?.organization_id !== organizationId)
      throw new Error(
        "Demo facility ID collision; all seed changes rolled back.",
      );
    await insert(
      "facility_locations",
      [
        "id",
        "facility_id",
        "address_line_1",
        "city_municipality",
        "province",
        "country_code",
        "latitude",
        "longitude",
        "directions_landmark",
        "is_verified",
      ],
      [
        sampleId(`location:${venue.key}`),
        facilityId,
        "Demo Court Road (fictional address)",
        venue.city,
        venue.province,
        "PH",
        venue.latitude,
        venue.longitude,
        "Sample map position only; not a real venue or verified address.",
        false,
      ],
    );
    for (let day = 1; day <= 7; day += 1) {
      await insert(
        "facility_operating_hours",
        [
          "id",
          "facility_id",
          "day_of_week",
          "opens_at",
          "closes_at",
          "is_closed",
        ],
        [
          sampleId(`hours:${venue.key}:${day}`),
          facilityId,
          day,
          "06:00",
          "23:00",
          false,
        ],
      );
    }
    for (let number = 1; number <= venue.courts; number += 1) {
      const courtId = sampleId(`court:${venue.key}:${number}`);
      const rate = venue.rate + (number > 2 ? 50 : 0);
      await insert(
        "courts",
        [
          "id",
          "facility_id",
          "court_code",
          "court_name",
          "court_type",
          "surface_type",
          "court_status",
          "has_lighting",
          "base_hourly_rate",
          "currency_code",
        ],
        [
          courtId,
          facilityId,
          `C${number}`,
          `Court ${number}`,
          venue.type,
          venue.surface,
          number === venue.maintenanceCourt ? "MAINTENANCE" : "ACTIVE",
          true,
          rate,
          "PHP",
        ],
      );
      const court = await database.query(
        "select facility_id from public.courts where id = $1",
        [courtId],
      );
      if (court.rows[0]?.facility_id !== facilityId)
        throw new Error(
          "Demo court ID collision; all seed changes rolled back.",
        );
      await insert(
        "court_rate_rules",
        [
          "id",
          "court_id",
          "rule_name",
          "starts_at",
          "ends_at",
          "hourly_rate",
          "priority",
          "active",
        ],
        [
          sampleId(`rate:${venue.key}:${number}`),
          courtId,
          "Demo evening peak rate",
          "17:00",
          "21:00",
          rate + 150,
          10,
          true,
        ],
      );
    }
  }
  await database.query(apply ? "commit" : "rollback");
  console.log(
    JSON.stringify(
      {
        mode: apply ? "applied" : "preview (rolled back; pass --apply to save)",
        inserted,
        dataset: {
          facilities: venues.length,
          courts: venues.reduce((count, venue) => count + venue.courts, 0),
          maintenanceCourts: 1,
          hours: "06:00–23:00 daily",
          basePriceRange: "PHP 300–950/hour",
        },
        note: "Fictional venues; no new accounts, bookings, payments, or real contact details. Repeat runs preserve existing records.",
      },
      null,
      2,
    ),
  );
} catch (error) {
  await database.query("rollback").catch(() => undefined);
  // Avoid logging database errors that might include connection/account details.
  console.error(
    error instanceof Error && !error.code
      ? error.message
      : "Sample seed failed; all changes rolled back. Check database connectivity and schema.",
  );
  process.exitCode = 1;
} finally {
  await database.end();
}
