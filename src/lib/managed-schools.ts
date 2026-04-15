import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { ManagedSchool } from "@/types";

export interface ManagedSchoolRow {
  slug: string;
  name: string;
  name_zh: string;
  country: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function mapManagedSchoolRow(row: ManagedSchoolRow): ManagedSchool {
  return {
    slug: row.slug,
    name: row.name,
    nameZh: row.name_zh,
    country: row.country,
    active: row.active,
    skillCount: 0,
  };
}

export function normalizeSchoolSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

type ManagedSchoolsClient = SupabaseClient;

function createPublicManagedSchoolsClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getManagedSchools(options?: {
  includeInactive?: boolean;
  supabase?: ManagedSchoolsClient;
}) {
  if (!isSupabaseConfigured()) {
    return [] as ManagedSchool[];
  }

  const supabase = options?.supabase ?? createPublicManagedSchoolsClient();
  let query = supabase
    .from("managed_schools")
    .select("slug, name, name_zh, country, active, created_at, updated_at")
    .order("name_zh", { ascending: true });

  if (!options?.includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    return [] as ManagedSchool[];
  }

  return ((data ?? []) as ManagedSchoolRow[]).map(mapManagedSchoolRow);
}

export async function getManagedSchoolBySlug(
  slug: string,
  options?: { includeInactive?: boolean; supabase?: ManagedSchoolsClient }
) {
  const schools = await getManagedSchools(options);
  return schools.find((school) => school.slug === slug);
}
