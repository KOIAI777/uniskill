export type Category =
  | "formatting"
  | "reference"
  | "email"
  | "exam"
  | "presentation"
  | "research";

export interface Skill {
  slug: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  category: Category | Category[];
  schools: string[];
  tags: string[];
  installCommand: string;
  downloadPath: string;
  githubUrl: string;
  version: string;
  downloads: number;
  featured: boolean;
  createdAt: string;
  preview: {
    screenshots: string[];
    exampleInput: string;
    exampleOutput: string;
  };
}

export interface School {
  slug: string;
  name: string;
  nameZh: string;
  country: string;
  skillCount: number;
}

export interface ManagedSchool extends School {
  active: boolean;
}

export interface CategoryInfo {
  slug: Category;
  name: string;
  nameZh: string;
  icon: string;
  description: string;
}

export type CommentTargetKind = "official_skill" | "community_skill";
export type CommentStatus = "published" | "hidden";
export type CommunitySkillStatus = "pending" | "approved" | "rejected";
export type SkillSourceType = "official" | "community";

export interface CommunitySkill {
  id: string;
  slug: string;
  sourceType: SkillSourceType;
  authorId: string;
  authorName: string;
  authorEmail: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  category: Category;
  schoolSlug: string | null;
  customSchoolName: string | null;
  tags: string[];
  githubUrl: string | null;
  version: string;
  installCommand: string | null;
  downloads: number;
  featured: boolean;
  isVerified: boolean;
  publishedAt: string | null;
  filePath: string;
  originalFileName: string;
  fileSize: number;
  status: CommunitySkillStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillComment {
  id: string;
  targetKind: CommentTargetKind;
  targetKey: string;
  authorId: string;
  authorName: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  canModerate: boolean;
  canDelete: boolean;
}
