import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  isValidCommunitySkillHttpUrl,
  mapCommunitySkillRow,
  validateCommunitySkillDescription,
  validateCommunitySkillName,
  validateCommunitySkillVersion,
  type CommunitySkillRow,
} from "@/lib/community-skills";

type ProfileRow = {
  role: string | null;
};

type CommunitySkillDeleteRow = {
  id: string;
  author_id: string;
  file_path: string;
  slug: string;
  source_type: "official" | "community";
  status: "pending" | "approved" | "rejected";
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const { id } = await params;
  const body = (await request.json()) as {
    action?: string;
    reviewNote?: string;
    featured?: boolean;
    name?: string;
    nameZh?: string;
    description?: string;
    descriptionZh?: string;
    version?: string;
    githubUrl?: string;
  };

  if (
    body.action !== "approve" &&
    body.action !== "reject" &&
    body.action !== "feature" &&
    body.action !== "unfeature" &&
    body.action !== "offline" &&
    body.action !== "online" &&
    body.action !== "edit"
  ) {
    return NextResponse.json(
      { error: "Unsupported moderation action." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to review uploads." },
      { status: 401 }
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData as ProfileRow | null) ?? null;

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Only administrators can review uploads." },
      { status: 403 }
    );
  }

  const reviewNote = body.reviewNote?.trim() || null;
  const updateData: Record<string, string | boolean | null> = {};

  if (body.action === "approve" || body.action === "online") {
    updateData.status = "approved";
    updateData.review_note = reviewNote;
    updateData.reviewed_at = new Date().toISOString();
    updateData.reviewed_by = user.id;
    updateData.published_at = new Date().toISOString();
    updateData.is_verified = true;
  }

  if (body.action === "reject" || body.action === "offline") {
    updateData.status = "rejected";
    updateData.review_note = reviewNote;
    updateData.reviewed_at = new Date().toISOString();
    updateData.reviewed_by = user.id;
  }

  if (body.action === "feature") {
    updateData.featured = true;
  }

  if (body.action === "unfeature") {
    updateData.featured = false;
  }

  if (body.action === "edit") {
    let touchedField = false;

    if (typeof body.name === "string") {
      const trimmedName = body.name.trim();
      const nameError = validateCommunitySkillName(trimmedName || null);

      if (nameError) {
        return NextResponse.json({ error: nameError }, { status: 400 });
      }

      updateData.name = trimmedName;
      touchedField = true;
    }

    if (typeof body.nameZh === "string") {
      updateData.name_zh = body.nameZh.trim() || null;
      touchedField = true;
    }

    if (typeof body.description === "string") {
      const trimmedDescription = body.description.trim();
      const descriptionError = validateCommunitySkillDescription(
        trimmedDescription || null
      );

      if (descriptionError) {
        return NextResponse.json(
          { error: descriptionError },
          { status: 400 }
        );
      }

      updateData.description = trimmedDescription;
      touchedField = true;
    }

    if (typeof body.descriptionZh === "string") {
      updateData.description_zh = body.descriptionZh.trim() || null;
      touchedField = true;
    }

    if (typeof body.version === "string") {
      const trimmedVersion = body.version.trim();
      const versionError = validateCommunitySkillVersion(trimmedVersion || null);

      if (versionError) {
        return NextResponse.json({ error: versionError }, { status: 400 });
      }

      updateData.version = trimmedVersion;
      touchedField = true;
    }

    if (typeof body.githubUrl === "string") {
      const trimmedGithubUrl = body.githubUrl.trim() || null;

      if (!isValidCommunitySkillHttpUrl(trimmedGithubUrl)) {
        return NextResponse.json(
          {
            error:
              "GitHub / reference URL must start with http:// or https://.",
          },
          { status: 400 }
        );
      }

      updateData.github_url = trimmedGithubUrl;
      touchedField = true;
    }

    if (!touchedField) {
      return NextResponse.json(
        { error: "No valid edits were provided." },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("community_skills")
    .update(updateData)
    .eq("id", id)
    .select(
      "id, slug, source_type, author_id, author_name, author_email, name, name_zh, description, description_zh, category, school_slug, custom_school_name, tags, github_url, version, install_command, downloads, featured, is_verified, published_at, file_path, original_file_name, file_size, status, review_note, reviewed_at, reviewed_by, created_at, updated_at"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to review this upload." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Upload not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    skill: mapCommunitySkillRow(data as CommunitySkillRow),
  });
}

export async function DELETE(
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to delete uploads." },
      { status: 401 }
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData as ProfileRow | null) ?? null;
  const isAdmin = profile?.role === "admin";

  const { data: skillData, error: skillError } = await supabase
    .from("community_skills")
    .select("id, author_id, file_path, slug, source_type, status")
    .eq("id", id)
    .maybeSingle();

  if (skillError) {
    return NextResponse.json(
      { error: "Failed to load the community skill." },
      { status: 500 }
    );
  }

  if (!skillData) {
    return NextResponse.json(
      { error: "Community skill not found." },
      { status: 404 }
    );
  }

  const skill = skillData as CommunitySkillDeleteRow;
  const isOwner = skill.author_id === user.id;
  const ownerAllowed = isOwner;

  if (!isAdmin && !ownerAllowed) {
    return NextResponse.json(
      {
        error:
          "You can only delete your own community skills. Administrators can delete any community skill.",
      },
      { status: 403 }
    );
  }

  const commentTargetKind =
    skill.source_type === "official" ? "official_skill" : "community_skill";

  const { error: deleteCommentsError } = await supabase
    .from("comments")
    .delete()
    .eq("target_kind", commentTargetKind)
    .eq("target_key", skill.slug);

  const { error: deleteSkillError } = await supabase
    .from("community_skills")
    .delete()
    .eq("id", id);

  if (deleteSkillError) {
    return NextResponse.json(
      { error: "Failed to delete the community skill." },
      { status: 500 }
    );
  }

  const { error: storageError } = await supabase.storage
    .from("community-skill-files")
    .remove([skill.file_path]);

  const warnings: string[] = [];

  if (deleteCommentsError) {
    warnings.push("The skill was deleted, but related comments could not be cleaned up automatically.");
  }

  if (storageError) {
    warnings.push("The skill was deleted, but the zip file could not be removed from storage automatically.");
  }

  return NextResponse.json({
    deletedId: id,
    warnings,
  });
}
