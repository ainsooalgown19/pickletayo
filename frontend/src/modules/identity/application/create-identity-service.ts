import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IdentityService } from "./identity-service";
import { SupabaseIdentityRepository } from "../infrastructure/supabase-identity-repository";

export async function createIdentityService() {
  const supabase = await createSupabaseServerClient();
  return new IdentityService(new SupabaseIdentityRepository(supabase));
}
