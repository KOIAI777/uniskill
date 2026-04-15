import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  mapCommunitySkillRow,
  type CommunitySkillRow,
} from "@/lib/community-skills";
import type { Skill } from "@/types";

type OfficialSkillSelectRow = CommunitySkillRow & {
  featured?: boolean;
  downloads?: number;
  install_command?: string | null;
};

export async function getOfficialSkillBySlugFromDb(slug: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("community_skills")
    .select(
      "id, slug, source_type, author_id, author_name, author_email, name, name_zh, description, description_zh, category, school_slug, custom_school_name, tags, github_url, version, file_path, original_file_name, file_size, status, review_note, reviewed_at, reviewed_by, created_at, updated_at, featured, downloads, install_command, is_verified, published_at"
    )
    .eq("slug", slug)
    .eq("source_type", "official")
    .eq("status", "approved")
    .maybeSingle();

  if (!data) {
    return null;
  }

  return mapCommunitySkillRow(data as OfficialSkillSelectRow);
}

export async function getOfficialSkillsFromDb() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("community_skills")
    .select(
      "id, slug, source_type, author_id, author_name, author_email, name, name_zh, description, description_zh, category, school_slug, custom_school_name, tags, github_url, version, file_path, original_file_name, file_size, status, review_note, reviewed_at, reviewed_by, created_at, updated_at, featured, downloads, install_command, is_verified, published_at"
    )
    .eq("source_type", "official")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return ((data ?? []) as OfficialSkillSelectRow[]).map(mapCommunitySkillRow);
}

export function mapOfficialCommunitySkillToSkill(skill: Awaited<
  ReturnType<typeof getOfficialSkillBySlugFromDb>
> extends infer T
  ? Exclude<T, null>
  : never): Skill {
  return {
    slug: skill.slug,
    name: skill.name,
    nameZh: skill.nameZh,
    description: skill.description,
    descriptionZh: skill.descriptionZh,
    category: skill.category,
    schools: skill.schoolSlug ? [skill.schoolSlug] : [],
    tags: skill.tags,
    installCommand:
      skill.installCommand ||
      `claude skill install https://uniskill.online/api/community-skills/${skill.id}/download`,
    downloadPath: `/api/community-skills/${skill.id}/download`,
    githubUrl: skill.githubUrl || "https://github.com/uniskill/skills",
    version: skill.version,
    downloads: skill.downloads,
    featured: skill.featured,
    createdAt: (skill.publishedAt || skill.createdAt).split("T")[0],
    preview: {
      screenshots: [],
      exampleInput: "",
      exampleOutput: "",
    },
  };
}
