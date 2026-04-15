import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getManagedSchools } from "@/lib/managed-schools";
import {
  COMMUNITY_SKILL_FILE_SIZE_LIMIT,
  isAllowedCommunitySkillFile,
} from "@/lib/community-skills";
import { inspectSkillArchiveForPrefill } from "@/lib/skill-archive";

export async function POST(_request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to inspect a skill package." },
      { status: 401 }
    );
  }

  const formData = await _request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Please upload a .zip skill package." },
      { status: 400 }
    );
  }

  if (file.size <= 0 || file.size > COMMUNITY_SKILL_FILE_SIZE_LIMIT) {
    return NextResponse.json(
      {
        error: `Skill zip must be between 1 byte and ${Math.floor(
          COMMUNITY_SKILL_FILE_SIZE_LIMIT / (1024 * 1024)
        )}MB.`,
      },
      { status: 400 }
    );
  }

  if (!isAllowedCommunitySkillFile(file)) {
    return NextResponse.json(
      { error: "Only .zip files are supported right now." },
      { status: 400 }
    );
  }

  try {
    const schools = await getManagedSchools({
      includeInactive: true,
      supabase,
    });
    const inspection = await inspectSkillArchiveForPrefill(
      file,
      schools.map((school) => school.slug)
    );

    return NextResponse.json(inspection);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The uploaded zip could not be inspected.",
      },
      { status: 400 }
    );
  }
}
