import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, publishableKey } = requireSupabasePublicConfig();
  browserClient = createBrowserClient(url, publishableKey);

  return browserClient;
}
