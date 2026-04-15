export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

function readPublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    "";

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  return readPublicConfig();
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}

export function requireSupabasePublicConfig(): SupabasePublicConfig {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return config;
}
