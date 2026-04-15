import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  mapManagedSchoolRow,
  normalizeSchoolSlug,
  type ManagedSchoolRow,
} from "@/lib/managed-schools";

type ProfileRow = {
  role: string | null;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "You must be signed in to manage schools." },
        { status: 401 }
      ),
      supabase: null,
    };
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData as ProfileRow | null) ?? null;

  if (profile?.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Only administrators can manage schools." },
        { status: 403 }
      ),
      supabase: null,
    };
  }

  return { error: null, supabase };
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const includeInactive = request.nextUrl.searchParams.get("all") === "true";
  const supabase = await createClient();
  let query = supabase
    .from("managed_schools")
    .select("slug, name, name_zh, country, active, created_at, updated_at")
    .order("name_zh", { ascending: true });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to load managed schools." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    schools: ((data ?? []) as ManagedSchoolRow[]).map(mapManagedSchoolRow),
  });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return auth.error!;
  }

  const body = (await request.json()) as {
    slug?: string;
    name?: string;
    nameZh?: string;
    country?: string;
  };

  const slug = normalizeSchoolSlug(body.slug ?? body.name ?? body.nameZh ?? "");
  const name = body.name?.trim();
  const nameZh = body.nameZh?.trim();
  const country = body.country?.trim().toUpperCase() || "CN";

  if (!slug || !name || !nameZh) {
    return NextResponse.json(
      { error: "slug, name, and nameZh are required." },
      { status: 400 }
    );
  }

  const { data, error } = await auth.supabase
    .from("managed_schools")
    .insert({
      slug,
      name,
      name_zh: nameZh,
      country,
      active: true,
    })
    .select("slug, name, name_zh, country, active, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create the managed school." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    school: mapManagedSchoolRow(data as ManagedSchoolRow),
  });
}
