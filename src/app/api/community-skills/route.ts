import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getManagedSchoolBySlug, getManagedSchools } from "@/lib/managed-schools";
import {
  buildCommunitySkillSlug,
  COMMUNITY_SKILL_BUCKET,
  COMMUNITY_SKILL_FILE_SIZE_LIMIT,
  COMMUNITY_SKILLS_PAGE_SIZE,
  isValidCommunitySkillHttpUrl,
  isAllowedCommunitySkillFile,
  isCommunitySkillCategory,
  mapCommunitySkillRow,
  normalizeTagList,
  validateCommunitySkillCustomSchoolName,
  validateCommunitySkillDescription,
  validateCommunitySkillName,
  validateCommunitySkillVersion,
  type CommunitySkillRow,
} from "@/lib/community-skills";
import { inspectSkillArchiveForPrefill } from "@/lib/skill-archive";

type ProfileRow = {
  display_name: string | null;
  role: string | null;
};

function parseOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const scope = request.nextUrl.searchParams.get("scope");
  const status = request.nextUrl.searchParams.get("status");
  const sourceType = request.nextUrl.searchParams.get("sourceType");
  const page = Math.max(
    1,
    Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1
  );
  const from = (page - 1) * COMMUNITY_SKILLS_PAGE_SIZE;
  const to = from + COMMUNITY_SKILLS_PAGE_SIZE - 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to access this feed." },
      { status: 401 }
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData as ProfileRow | null) ?? null;

  let query = supabase
    .from("community_skills")
    .select(
      "id, slug, source_type, author_id, author_name, author_email, name, name_zh, description, description_zh, category, school_slug, custom_school_name, tags, github_url, version, install_command, downloads, featured, is_verified, published_at, file_path, original_file_name, file_size, status, review_note, reviewed_at, reviewed_by, created_at, updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (sourceType === "community" || sourceType === "official") {
    query = query.eq("source_type", sourceType);
  } else if (sourceType !== "all") {
    query = query.eq("source_type", "community");
  }

  if (scope === "admin") {
    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can access moderation feeds." },
        { status: 403 }
      );
    }

    if (status === "pending" || status === "approved" || status === "rejected") {
      query = query.eq("status", status);
    }
  } else {
    query = query.eq("author_id", user.id);
    if (status === "pending" || status === "approved" || status === "rejected") {
      query = query.eq("status", status);
    }
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load community skills." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    skills: ((data ?? []) as CommunitySkillRow[]).map(mapCommunitySkillRow),
    pagination: {
      page,
      pageSize: COMMUNITY_SKILLS_PAGE_SIZE,
      total: count ?? 0,
      totalPages: Math.max(
        1,
        Math.ceil((count ?? 0) / COMMUNITY_SKILLS_PAGE_SIZE)
      ),
    },
  });
}

export async function POST(request: NextRequest) {
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
      { error: "You must be signed in to upload a skill." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
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

  const managedSchools = await getManagedSchools({
    includeInactive: true,
    supabase,
  });
  let parsedDefaults = null as Awaited<
    ReturnType<typeof inspectSkillArchiveForPrefill>
  > | null;

  try {
    parsedDefaults = await inspectSkillArchiveForPrefill(
      file,
      managedSchools.map((school) => school.slug)
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "The uploaded zip could not be inspected. Please make sure it is a valid zip file and try again.",
      },
      { status: 400 }
    );
  }

  const name = parseOptionalText(formData.get("name")) ?? parsedDefaults.prefill.name;
  const nameZh =
    parseOptionalText(formData.get("nameZh")) ?? parsedDefaults.prefill.nameZh;
  const description =
    parseOptionalText(formData.get("description")) ??
    parsedDefaults.prefill.description;
  const descriptionZh =
    parseOptionalText(formData.get("descriptionZh")) ??
    parsedDefaults.prefill.descriptionZh;
  const category =
    parseOptionalText(formData.get("category")) || parsedDefaults.prefill.category;
  const requestedSchoolMode = parseOptionalText(formData.get("schoolMode"));
  const schoolMode =
    requestedSchoolMode === "general" ||
    requestedSchoolMode === "official" ||
    requestedSchoolMode === "custom"
      ? requestedSchoolMode
      : parsedDefaults.prefill.schoolMode;
  const schoolSlug =
    schoolMode === "official"
      ? parseOptionalText(formData.get("schoolSlug")) ||
        parsedDefaults.prefill.schoolSlug
      : null;
  const customSchoolName =
    schoolMode === "custom"
      ? parseOptionalText(formData.get("customSchoolName")) ||
        parsedDefaults.prefill.customSchoolName
      : null;
  const requestedSourceType = parseOptionalText(formData.get("sourceType"));
  const githubUrl =
    parseOptionalText(formData.get("githubUrl")) ?? parsedDefaults.prefill.githubUrl;
  const version =
    parseOptionalText(formData.get("version")) ?? parsedDefaults.prefill.version;
  const tags = normalizeTagList(
    parseOptionalText(formData.get("tags")) ?? parsedDefaults.prefill.tags
  );

  const nameError = validateCommunitySkillName(name);
  if (nameError) {
    return NextResponse.json(
      { error: nameError },
      { status: 400 }
    );
  }

  const descriptionError = validateCommunitySkillDescription(description);
  if (descriptionError) {
    return NextResponse.json(
      { error: descriptionError },
      { status: 400 }
    );
  }

  if (!isCommunitySkillCategory(category)) {
    return NextResponse.json(
      { error: "Please choose a valid category." },
      { status: 400 }
    );
  }

  if (schoolSlug && customSchoolName) {
    return NextResponse.json(
      {
        error:
          "Choose either an official school or a custom school name, not both.",
      },
      { status: 400 }
    );
  }

  if (schoolMode === "official" && !schoolSlug) {
    return NextResponse.json(
      { error: "Please choose one official school." },
      { status: 400 }
    );
  }

  if (schoolMode === "custom" && !customSchoolName) {
    return NextResponse.json(
      { error: "Please fill in your custom school name." },
      { status: 400 }
    );
  }

  const customSchoolNameError =
    validateCommunitySkillCustomSchoolName(customSchoolName);
  if (customSchoolNameError) {
    return NextResponse.json(
      { error: customSchoolNameError },
      { status: 400 }
    );
  }

  if (
    schoolSlug &&
    !(await getManagedSchoolBySlug(schoolSlug, {
      includeInactive: true,
      supabase,
    }))
  ) {
    return NextResponse.json(
      { error: "Selected school is not in the official school list." },
      { status: 400 }
    );
  }

  const versionError = validateCommunitySkillVersion(version);
  if (versionError) {
    return NextResponse.json(
      { error: versionError },
      { status: 400 }
    );
  }

  if (!isValidCommunitySkillHttpUrl(githubUrl)) {
    return NextResponse.json(
      { error: "GitHub / reference URL must start with http:// or https://." },
      { status: 400 }
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData as ProfileRow | null) ?? null;
  const isAdmin = profile?.role === "admin";
  const authorName =
    profile?.display_name?.trim() ||
    (typeof user.user_metadata.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "") ||
    user.email?.split("@")[0] ||
    "匿名用户";

  const slug = buildCommunitySkillSlug(name);
  const filePath = `${user.id}/${slug}.zip`;
  const sourceType =
    isAdmin && requestedSourceType === "official" ? "official" : "community";
  const publishNow = sourceType === "official";
  const insertedStatus = "pending";

  const { error: uploadError } = await supabase.storage
    .from(COMMUNITY_SKILL_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/zip",
    });

  if (uploadError) {
    const message =
      uploadError.message.includes("Bucket not found") ||
      uploadError.message.includes("bucket")
        ? "Upload bucket is missing. Create a private bucket named community-skill-files in Supabase Storage first."
        : "Failed to upload the skill package.";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("community_skills")
    .insert({
      slug,
      source_type: sourceType,
      author_id: user.id,
      author_name: authorName,
      author_email: user.email ?? "",
      name,
      name_zh: nameZh,
      description,
      description_zh: descriptionZh,
      category,
      school_slug: schoolSlug,
      custom_school_name: customSchoolName,
      tags,
      github_url: githubUrl,
      version,
      file_path: filePath,
      original_file_name: file.name,
      file_size: file.size,
      status: insertedStatus,
      featured: false,
      downloads: 0,
      install_command: null,
      is_verified: false,
      published_at: null,
    })
    .select(
      "id, slug, source_type, author_id, author_name, author_email, name, name_zh, description, description_zh, category, school_slug, custom_school_name, tags, github_url, version, install_command, downloads, featured, is_verified, published_at, file_path, original_file_name, file_size, status, review_note, reviewed_at, reviewed_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    await supabase.storage.from(COMMUNITY_SKILL_BUCKET).remove([filePath]);

    return NextResponse.json(
      { error: "Failed to save the community skill record." },
      { status: 500 }
    );
  }

  let finalRow = data as CommunitySkillRow;

  if (publishNow) {
    const publishedAt = new Date().toISOString();
    const { data: updatedData, error: updateError } = await supabase
      .from("community_skills")
      .update({
        status: "approved",
        reviewed_at: publishedAt,
        reviewed_by: user.id,
        source_type: "official",
        is_verified: true,
        published_at: publishedAt,
      })
      .eq("id", data.id)
      .select(
        "id, slug, source_type, author_id, author_name, author_email, name, name_zh, description, description_zh, category, school_slug, custom_school_name, tags, github_url, version, install_command, downloads, featured, is_verified, published_at, file_path, original_file_name, file_size, status, review_note, reviewed_at, reviewed_by, created_at, updated_at"
      )
      .single();

    if (updateError || !updatedData) {
      await supabase.from("community_skills").delete().eq("id", data.id);
      await supabase.storage.from(COMMUNITY_SKILL_BUCKET).remove([filePath]);

      return NextResponse.json(
        {
          error:
            "The skill package was uploaded, but it could not be published as an official skill. Please verify the admin update policy and unified skill columns in Supabase.",
        },
        { status: 500 }
      );
    }

    finalRow = updatedData as CommunitySkillRow;
  }

  return NextResponse.json(
    { skill: mapCommunitySkillRow(finalRow) },
    { status: 201 }
  );
}
