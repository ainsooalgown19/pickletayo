import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnvironment } from "./env";

let browserClient: SupabaseClient | undefined;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const environment = getSupabasePublicEnvironment();
    browserClient = createBrowserClient(environment.url, environment.publishableKey);
  }

  return browserClient;
}
