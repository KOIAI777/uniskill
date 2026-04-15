import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getManagedSchoolBySlug } from "@/lib/managed-schools";
import type { CommunitySkillStatus } from "@/types";

type ProfileRow = {
  role: string | null;
};

type CustomSchoolRow = {
  id: string;
  custom_school_name: string | null;
  status: CommunitySkillStatus;
  created_at: string;
};

interface GroupedCustomSchool {
  name: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  latestCreatedAt: string;
}

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
      user: null,
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
        { error: "Only administrators can manage school mappings." },
        { status: 403 }
      ),
      supabase: null,
      user: null,
    };
  }

  return {
    error: null,
    supabase,
    user,
  };
}

export async function GET() {
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

  const { data, error } = await auth.supabase
    .from("community_skills")
    .select("id, custom_school_name, status, created_at")
    .not("custom_school_name", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load custom school names." },
      { status: 500 }
    );
  }

  const grouped = new Map<string, GroupedCustomSchool>();

  for (const row of (data ?? []) as CustomSchoolRow[]) {
    const name = row.custom_school_name?.trim();
    if (!name) continue;

    const current =
      grouped.get(name) ??
      ({
        name,
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        latestCreatedAt: row.created_at,
      } satisfies GroupedCustomSchool);

    current.total += 1;
    current[row.status] += 1;
    if (new Date(row.created_at) > new Date(current.latestCreatedAt)) {
      current.latestCreatedAt = row.created_at;
    }
    grouped.set(name, current);
  }

  return NextResponse.json({
    customSchools: Array.from(grouped.values()).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime();
    }),
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
  if (auth.error || !auth.supabase || !auth.user) {
    return auth.error!;
  }

  const body = (await request.json()) as {
    customSchoolName?: string;
    targetSchoolSlug?: string;
  };

  const customSchoolName = body.customSchoolName?.trim();
  const targetSchoolSlug = body.targetSchoolSlug?.trim();

  if (!customSchoolName || !targetSchoolSlug) {
    return NextResponse.json(
      { error: "customSchoolName and targetSchoolSlug are required." },
      { status: 400 }
    );
  }

  if (
    !(await getManagedSchoolBySlug(targetSchoolSlug, {
      includeInactive: true,
      supabase: auth.supabase,
    }))
  ) {
    return NextResponse.json(
      { error: "Target official school does not exist." },
      { status: 400 }
    );
  }

  const { data, error } = await auth.supabase
    .from("community_skills")
    .update({
      school_slug: targetSchoolSlug,
      custom_school_name: null,
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("custom_school_name", customSchoolName)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: "Failed to merge the custom school name." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    mergedName: customSchoolName,
    targetSchoolSlug,
    updatedCount: data?.length ?? 0,
  });
}
