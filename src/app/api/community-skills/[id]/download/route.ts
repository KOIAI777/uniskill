import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { COMMUNITY_SKILL_BUCKET } from "@/lib/community-skills";

type CommunitySkillDownloadRow = {
  id: string;
  file_path: string;
  original_file_name: string;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_skills")
    .select("id, file_path, original_file_name")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to load the community skill." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Community skill not found." },
      { status: 404 }
    );
  }

  const skill = data as CommunitySkillDownloadRow;
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(COMMUNITY_SKILL_BUCKET)
    .createSignedUrl(skill.file_path, 60, {
      download: skill.original_file_name,
    });

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to create the download link." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signedUrlData.signedUrl);
}
