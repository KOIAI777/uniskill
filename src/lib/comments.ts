import type {
  CommentStatus,
  CommentTargetKind,
  SkillComment,
} from "@/types";

export const COMMENT_TARGET_KINDS: CommentTargetKind[] = [
  "official_skill",
  "community_skill",
];

export const COMMENT_MAX_LENGTH = 2000;
export const COMMENT_PREVIEW_LENGTH = 220;
export const COMMENTS_PAGE_SIZE = 10;

export interface CommentRow {
  id: string;
  target_kind: CommentTargetKind;
  target_key: string;
  author_id: string;
  author_name: string;
  content: string;
  status: CommentStatus;
  created_at: string;
  updated_at: string;
}

export type ViewerRole = "user" | "admin";

export function isCommentTargetKind(
  value: string | null | undefined
): value is CommentTargetKind {
  return value !== null && COMMENT_TARGET_KINDS.includes(value as CommentTargetKind);
}

export function isViewerRole(value: string | null | undefined): value is ViewerRole {
  return value === "user" || value === "admin";
}

export function normalizeCommentContent(value: string) {
  return value.trim().replace(/\r\n/g, "\n");
}

export function mapCommentRow(
  row: CommentRow,
  options?: {
    currentUserId?: string | null;
    viewerRole?: ViewerRole;
  }
): SkillComment {
  const currentUserId = options?.currentUserId ?? null;
  const viewerRole = options?.viewerRole ?? "user";

  return {
    id: row.id,
    targetKind: row.target_kind,
    targetKey: row.target_key,
    authorId: row.author_id,
    authorName: row.author_name,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    canModerate: viewerRole === "admin",
    canDelete: currentUserId === row.author_id,
  };
}

export function getCommentTargetHref(
  targetKind: CommentTargetKind,
  targetKey: string
) {
  if (targetKind === "official_skill") {
    return `/skills/${targetKey}#comments`;
  }

  return `/community/${targetKey}#comments`;
}

export function getCommentTargetLabel(
  targetKind: CommentTargetKind,
  targetKey: string
) {
  if (targetKind === "official_skill") {
    return `精选 Skill · ${targetKey}`;
  }

  return `社区 Skill · ${targetKey}`;
}
