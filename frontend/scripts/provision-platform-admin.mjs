import { config as loadEnvironment } from "dotenv";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";

loadEnvironment({ path: ".env.local" });
loadEnvironment();

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DIRECT_URL",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("ADMIN_EMAIL must be a valid email address.");
if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
  throw new Error("ADMIN_PASSWORD must contain 12+ characters with upper-case, lower-case, and a number.");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function findUserByEmail() {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
}

let user = await findUserByEmail();
if (user) {
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (error) throw error;
  user = data.user;
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { given_name: "System", family_name: "Administrator" },
  });
  if (error) throw error;
  user = data.user;
}

const database = new Client({ connectionString: process.env.DIRECT_URL });
await database.connect();
try {
  await database.query("begin");
  await database.query(
    `insert into public.application_roles (code, description)
     values ('PLATFORM_ADMIN', 'Administers the PickleTayo platform')
     on conflict (code) do update set description = excluded.description`,
  );
  await database.query(
    `insert into public.profiles (user_id, given_name, family_name, status)
     values ($1, 'System', 'Administrator', 'ACTIVE')
     on conflict (user_id) do update set status = 'ACTIVE', updated_at = now()`,
    [user.id],
  );
  await database.query(
    `insert into public.user_roles (user_id, role_code)
     values ($1, 'PLATFORM_ADMIN')
     on conflict (user_id, role_code) do nothing`,
    [user.id],
  );
  await database.query(
    `insert into public.security_events (user_id, event_type, metadata)
     values ($1, 'PLATFORM_ADMIN_PROVISIONED', jsonb_build_object('email', $2::text, 'source', 'admin_provision_command'))`,
    [user.id, email],
  );
  await database.query("commit");
} catch (error) {
  await database.query("rollback");
  throw error;
} finally {
  await database.end();
}

console.log(`Platform administrator provisioned for ${email}.`);
