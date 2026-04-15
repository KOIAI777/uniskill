import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { mapManagedSchoolRow, type ManagedSchoolRow } from "@/lib/managed-schools";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

  const { slug } = await params;
  const body = (await request.json()) as {
    name?: string;
    nameZh?: string;
    country?: string;
    active?: boolean;
  };

  const updates: Record<string, string | boolean> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim();
  }
  if (typeof body.nameZh === "string" && body.nameZh.trim()) {
    updates.name_zh = body.nameZh.trim();
  }
  if (typeof body.country === "string" && body.country.trim()) {
    updates.country = body.country.trim().toUpperCase();
  }
  if (typeof body.active === "boolean") {
    updates.active = body.active;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid updates were provided." },
      { status: 400 }
    );
  }

  const { data, error } = await auth.supabase
    .from("managed_schools")
    .update(updates)
    .eq("slug", slug)
    .select("slug, name, name_zh, country, active, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update the managed school." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Managed school not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    school: mapManagedSchoolRow(data as ManagedSchoolRow),
  });
}
