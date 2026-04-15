import type { Category, CommunitySkill, CommunitySkillStatus } from "@/types";

export const COMMUNITY_SKILL_BUCKET = "community-skill-files";
export const COMMUNITY_SKILL_FILE_SIZE_LIMIT = 1 * 1024 * 1024;
export const COMMUNITY_SKILL_NAME_MIN_LENGTH = 3;
export const COMMUNITY_SKILL_NAME_MAX_LENGTH = 80;
export const COMMUNITY_SKILL_DESCRIPTION_MAX_LENGTH = 1500;
export const COMMUNITY_SKILL_CUSTOM_SCHOOL_NAME_MIN_LENGTH = 2;
export const COMMUNITY_SKILL_CUSTOM_SCHOOL_NAME_MAX_LENGTH = 120;
export const COMMUNITY_SKILL_VERSION_MAX_LENGTH = 40;
export const COMMUNITY_SKILL_CATEGORIES: Category[] = [
  "formatting",
  "reference",
  "email",
  "exam",
  "presentation",
  "research",
];
export const COMMUNITY_SKILL_ALLOWED_EXTENSIONS = [".zip"];
export const COMMUNITY_SKILL_ALLOWED_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
];
export const COMMUNITY_SKILLS_PAGE_SIZE = 12;

export interface CommunitySkillRow {
  id: string;
  slug: string;
  source_type: "official" | "community";
  author_id: string;
  author_name: string;
  author_email: string;
  name: string;
  name_zh: string | null;
  description: string;
  description_zh: string | null;
  category: Category;
  school_slug: string | null;
  custom_school_name: string | null;
  tags: string[] | null;
  github_url: string | null;
  version: string;
  install_command?: string | null;
  downloads?: number | null;
  featured?: boolean | null;
  is_verified?: boolean | null;
  published_at?: string | null;
  file_path: string;
  original_file_name: string;
  file_size: number;
  status: CommunitySkillStatus;
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export function mapCommunitySkillRow(row: CommunitySkillRow): CommunitySkill {
  return {
    id: row.id,
    slug: row.slug,
    sourceType: row.source_type,
    authorId: row.author_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    name: row.name,
    nameZh: row.name_zh || row.name,
    description: row.description,
    descriptionZh: row.description_zh || row.description,
    category: row.category,
    schoolSlug: row.school_slug,
    customSchoolName: row.custom_school_name,
    tags: row.tags ?? [],
    githubUrl: row.github_url,
    version: row.version,
    installCommand: row.install_command ?? null,
    downloads: row.downloads ?? 0,
    featured: row.featured ?? false,
    isVerified: row.is_verified ?? false,
    publishedAt: row.published_at ?? null,
    filePath: row.file_path,
    originalFileName: row.original_file_name,
    fileSize: row.file_size,
    status: row.status,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function slugifyCommunitySkillName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildCommunitySkillSlug(name: string) {
  const base = slugifyCommunitySkillName(name) || "community-skill";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export function normalizeTagList(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8)
    )
  );
}

export function isAllowedCommunitySkillFile(file: File) {
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = COMMUNITY_SKILL_ALLOWED_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );
  const hasValidMimeType =
    !file.type || COMMUNITY_SKILL_ALLOWED_TYPES.includes(file.type);

  return hasValidExtension && hasValidMimeType;
}

export function isCommunitySkillCategory(
  value: string | null | undefined
): value is Category {
  return (
    value !== null &&
    value !== undefined &&
    COMMUNITY_SKILL_CATEGORIES.includes(value as Category)
  );
}

export function validateCommunitySkillName(name: string | null) {
  if (!name) {
    return `Name must be between ${COMMUNITY_SKILL_NAME_MIN_LENGTH} and ${COMMUNITY_SKILL_NAME_MAX_LENGTH} characters.`;
  }

  if (
    name.length < COMMUNITY_SKILL_NAME_MIN_LENGTH ||
    name.length > COMMUNITY_SKILL_NAME_MAX_LENGTH
  ) {
    return `Name must be between ${COMMUNITY_SKILL_NAME_MIN_LENGTH} and ${COMMUNITY_SKILL_NAME_MAX_LENGTH} characters.`;
  }

  return null;
}

export function validateCommunitySkillDescription(description: string | null) {
  if (!description || description.length > COMMUNITY_SKILL_DESCRIPTION_MAX_LENGTH) {
    return `Description cannot be empty and must be at most ${COMMUNITY_SKILL_DESCRIPTION_MAX_LENGTH} characters.`;
  }

  return null;
}

export function validateCommunitySkillCustomSchoolName(
  customSchoolName: string | null
) {
  if (
    customSchoolName &&
    (customSchoolName.length < COMMUNITY_SKILL_CUSTOM_SCHOOL_NAME_MIN_LENGTH ||
      customSchoolName.length > COMMUNITY_SKILL_CUSTOM_SCHOOL_NAME_MAX_LENGTH)
  ) {
    return `Custom school name must be between ${COMMUNITY_SKILL_CUSTOM_SCHOOL_NAME_MIN_LENGTH} and ${COMMUNITY_SKILL_CUSTOM_SCHOOL_NAME_MAX_LENGTH} characters.`;
  }

  return null;
}

export function validateCommunitySkillVersion(version: string | null) {
  if (!version || version.length > COMMUNITY_SKILL_VERSION_MAX_LENGTH) {
    return `Version is required and must be at most ${COMMUNITY_SKILL_VERSION_MAX_LENGTH} characters.`;
  }

  return null;
}

export function isValidCommunitySkillHttpUrl(value: string | null) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function formatCommunitySkillTargetHref(slug: string) {
  return `/community/${slug}`;
}

export function getCommunitySkillSchoolLabel(skill: Pick<CommunitySkill, "schoolSlug" | "customSchoolName">) {
  return skill.customSchoolName || skill.schoolSlug || "通用 / General";
}
