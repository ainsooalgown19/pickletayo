import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const adminEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

export function getSupabaseAdminEnvironment() {
  const parsed = adminEnvironmentSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      "Supabase administrator access is not configured. Set the server-only SUPABASE_SERVICE_ROLE_KEY environment variable.",
    );
  }

  return {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function createSupabaseAdminClient() {
  const environment = getSupabaseAdminEnvironment();
  return createClient(environment.url, environment.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
