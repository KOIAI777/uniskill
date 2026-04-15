"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { buildLocalizedPath, type AppLocale } from "@/i18n/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  COMMENT_MAX_LENGTH,
  COMMENT_PREVIEW_LENGTH,
  COMMENTS_PAGE_SIZE,
} from "@/lib/comments";
import type { CommentTargetKind, SkillComment } from "@/types";

interface SkillCommentsProps {
  targetKind: CommentTargetKind;
  targetKey: string;
  title?: string;
  locale?: AppLocale;
}

interface ViewerState {
  email: string | null;
  role: "user" | "admin";
  canModerate: boolean;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function formatCommentDate(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SkillComments({
  targetKind,
  targetKey,
  title = "评论 / Comments",
  locale = "zh",
}: SkillCommentsProps) {
  const pathname = usePathname();
  const isEn = locale === "en";
  const configured = isSupabaseConfigured();
  const [comments, setComments] = useState<SkillComment[]>([]);
  const [viewer, setViewer] = useState<ViewerState>({
    email: null,
    role: "user",
    canModerate: false,
  });
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hidingId, setHidingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: COMMENTS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams({
      targetKind,
      targetKey,
      page: String(page),
    });

    const response = await fetch(`/api/comments?${params.toString()}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as {
      comments?: SkillComment[];
      pagination?: PaginationState;
      viewer?: ViewerState;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error || (isEn ? "Failed to load comments" : "评论加载失败"));
    }

    setComments(payload.comments ?? []);
    setPagination(
      payload.pagination ?? {
        page,
        pageSize: COMMENTS_PAGE_SIZE,
        total: payload.comments?.length ?? 0,
        totalPages: 1,
      }
    );
    setViewer(
      payload.viewer ?? {
        email: null,
        role: "user",
        canModerate: false,
      }
    );
  }, [isEn, page, targetKind, targetKey]);

  useEffect(() => {
    if (!configured) {
      return;
    }

    let active = true;

    loadComments()
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : isEn ? "Failed to load comments" : "评论加载失败");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [configured, isEn, loadComments]);

  useEffect(() => {
    setExpandedIds([]);
    setPage(1);
  }, [targetKind, targetKey]);

  const goToPage = (nextPage: number) => {
    const boundedPage = Math.min(
      Math.max(1, nextPage),
      Math.max(1, pagination.totalPages)
    );

    setExpandedIds([]);
    setPage(boundedPage);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();

    if (!trimmed) {
      setError(isEn ? "Comment cannot be empty." : "评论不能为空。");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKind,
          targetKey,
          content: trimmed,
        }),
      });
      const payload = (await response.json()) as {
        comment?: SkillComment;
        error?: string;
      };

      if (!response.ok || !payload.comment) {
        throw new Error(payload.error || (isEn ? "Failed to publish comment" : "评论发布失败"));
      }

      setPage(1);
      setComments((current) =>
        page === 1
          ? [payload.comment as SkillComment, ...current].slice(
              0,
              pagination.pageSize
            )
          : current
      );
      setPagination((current) => ({
        ...current,
        page: 1,
        total: current.total + 1,
        totalPages: Math.max(
          1,
          Math.ceil((current.total + 1) / current.pageSize)
        ),
      }));
      setContent("");
      setSuccess(isEn ? "Comment published successfully." : "评论已成功发布。");
    } catch (err) {
      setError(err instanceof Error ? err.message : isEn ? "Failed to publish comment" : "评论发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || (isEn ? "Failed to delete comment" : "删除评论失败"));
      }

      setComments((current) =>
        current.filter((comment) => comment.id !== commentId)
      );
      setPagination((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
        totalPages: Math.max(
          1,
          Math.ceil(Math.max(0, current.total - 1) / current.pageSize)
        ),
      }));
      setSuccess(isEn ? "Comment deleted." : "评论已删除。");
    } catch (err) {
      setError(err instanceof Error ? err.message : isEn ? "Failed to delete comment" : "删除评论失败");
    } finally {
      setDeletingId(null);
    }
  };

  const handleHide = async (commentId: string) => {
    setHidingId(commentId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hide" }),
      });
      const payload = (await response.json()) as {
        comment?: SkillComment;
        error?: string;
      };

      if (!response.ok || !payload.comment) {
        throw new Error(payload.error || (isEn ? "Failed to hide comment" : "隐藏评论失败"));
      }

      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId ? (payload.comment as SkillComment) : comment
        )
      );
      setSuccess(isEn ? "Comment hidden." : "评论已隐藏。");
    } catch (err) {
      setError(err instanceof Error ? err.message : isEn ? "Failed to hide comment" : "隐藏评论失败");
    } finally {
      setHidingId(null);
    }
  };

  const toggleExpanded = (commentId: string) => {
    setExpandedIds((current) =>
      current.includes(commentId)
        ? current.filter((id) => id !== commentId)
        : [...current, commentId]
    );
  };

  const refreshPage = () => {
    setLoading(true);
    loadComments()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "评论加载失败");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const startIndex =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1;
  const endIndex = Math.min(
    pagination.total,
    pagination.page * pagination.pageSize
  );
  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, index) => index + 1
  ).filter((pageNumber) => {
    if (pagination.totalPages <= 7) return true;
    if (pageNumber === 1 || pageNumber === pagination.totalPages) return true;
    return Math.abs(pageNumber - pagination.page) <= 1;
  });

  if (!configured) {
    return (
      <section
        id="comments"
        className="mb-20 rounded-3xl bg-surface-container-low p-8 border border-outline-variant/20"
      >
        <h2 className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-4">
          {title}
        </h2>
        <p className="text-sm text-on-surface-variant">
          {isEn
            ? "The comment section will appear here once Supabase is configured."
            : "Supabase 配置完成后，这里会显示评论区。"}
        </p>
      </section>
    );
  }

  return (
    <section id="comments" className="mb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-3">
            {title}
          </h2>
          <p className="text-on-surface-variant">
            {isEn ? "Newest comments first. Current target:" : "最新评论优先展示。当前目标："}
            <span className="font-mono text-sm mx-1">{targetKind}</span>
            <span className="font-mono text-sm">{targetKey}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-sm text-on-surface-variant">
            <Icon name="forum" className="text-base text-primary" filled />
            {isEn ? `${pagination.total} comments` : `${pagination.total} 条评论`}
          </span>
          {viewer.canModerate && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold">
              <Icon name="verified_user" className="text-base" filled />
              {isEn ? "Moderator mode" : "管理员模式"}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          {loading ? (
            <div className="rounded-2xl bg-surface-container-low p-6 text-sm text-on-surface-variant animate-pulse">
              {isEn ? "Loading comments..." : "正在加载评论..."}
            </div>
          ) : comments.length > 0 ? (
            <>
              <div className="text-xs text-on-surface-variant">
                {isEn
                  ? `Page ${pagination.page} of ${pagination.totalPages}, showing ${startIndex}-${endIndex}. Up to ${pagination.pageSize} comments per page.`
                  : `第 ${pagination.page} / ${pagination.totalPages} 页，显示第 ${startIndex}-${endIndex} 条。每页最多 ${pagination.pageSize} 条评论。`}
              </div>

              {comments.map((comment) => {
                const isLong = comment.content.length > COMMENT_PREVIEW_LENGTH;
                const expanded = expandedIds.includes(comment.id);
                const edited =
                  new Date(comment.updatedAt).getTime() -
                    new Date(comment.createdAt).getTime() >
                  1000;
                const displayContent =
                  isLong && !expanded
                    ? `${comment.content.slice(0, COMMENT_PREVIEW_LENGTH)}...`
                    : comment.content;

                return (
                  <article
                    key={comment.id}
                    className={`rounded-2xl p-6 border shadow-sm ${
                      comment.status === "hidden"
                        ? "bg-surface-container-low border-error/20"
                        : "bg-surface-container-lowest border-outline-variant/20"
                    }`}
                  >
                    {comment.status === "hidden" && (
                      <div className="mb-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error flex items-center gap-2">
                        <Icon name="visibility_off" className="text-base" />
                        {isEn
                          ? "This comment is hidden and only visible to the author and moderators."
                          : "这条评论已隐藏，仅作者和管理员可见。"}
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-black uppercase flex-shrink-0">
                          {comment.authorName.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold truncate">{comment.authorName}</h3>
                            {comment.canDelete && (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                {isEn ? "You" : "我"}
                              </span>
                            )}
                            {comment.status === "hidden" && (
                              <span className="px-2 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-bold">
                                {isEn ? "Hidden" : "已隐藏"}
                              </span>
                            )}
                            {edited && (
                              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                                {isEn ? "Edited" : "已编辑"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            {formatCommentDate(comment.createdAt, locale)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {comment.canModerate && comment.status === "published" && (
                          <button
                            type="button"
                            onClick={() => handleHide(comment.id)}
                            disabled={hidingId === comment.id}
                            className="text-xs font-semibold text-on-surface-variant hover:text-error transition-colors disabled:opacity-60"
                          >
                            {hidingId === comment.id
                              ? isEn
                                ? "Hiding..."
                                : "隐藏中..."
                              : isEn
                                ? "Hide"
                                : "隐藏"}
                          </button>
                        )}
                        {comment.canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(comment.id)}
                            disabled={deletingId === comment.id}
                            className="text-xs font-semibold text-on-surface-variant hover:text-error transition-colors disabled:opacity-60"
                          >
                            {deletingId === comment.id
                              ? isEn
                                ? "Deleting..."
                                : "删除中..."
                              : isEn
                                ? "Delete"
                                : "删除"}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
                      {displayContent}
                    </p>
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(comment.id)}
                        className="mt-3 text-sm font-semibold text-primary hover:underline"
                      >
                        {expanded
                          ? isEn
                            ? "Show less"
                            : "收起"
                          : isEn
                            ? "Read more"
                            : "展开全文"}
                      </button>
                    )}
                    {comment.status === "hidden" && (
                      <p className="mt-3 text-xs text-error">
                        {isEn
                          ? "This comment has been hidden by a moderator and is only visible to the author and moderators."
                          : "此评论已被管理员隐藏，仅作者和管理员可见。"}
                      </p>
                    )}
                  </article>
                );
              })}

              {pagination.totalPages > 1 && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
                  <p className="text-xs text-on-surface-variant">
                    {isEn
                      ? `${pagination.total} comments total, ${pagination.pageSize} per page.`
                      : `每页最多 ${pagination.pageSize} 条，合计 ${pagination.total} 条。`}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:hover:border-outline-variant/30 disabled:hover:text-on-surface-variant"
                    >
                      <Icon name="chevron_left" className="text-base" />
                      {isEn ? "Previous" : "上一页"}
                    </button>

                    <button
                      type="button"
                      onClick={refreshPage}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                    >
                      <Icon name="refresh" className="text-base" />
                      {isEn ? "Refresh" : "刷新"}
                    </button>

                    {pageNumbers.map((pageNumber, index) => {
                      const previous = pageNumbers[index - 1];
                      const hasGap = previous && pageNumber - previous > 1;

                      return (
                        <span key={pageNumber} className="inline-flex items-center gap-2">
                          {hasGap && (
                            <span className="px-1 text-sm text-outline">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => goToPage(pageNumber)}
                            className={`min-w-10 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                              pageNumber === pagination.page
                                ? "bg-primary text-on-primary"
                                : "border border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        </span>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:hover:border-outline-variant/30 disabled:hover:text-on-surface-variant"
                    >
                      {isEn ? "Next" : "下一页"}
                      <Icon name="chevron_right" className="text-base" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl bg-surface-container-low p-8 text-center">
              <Icon
                name="chat_bubble"
                className="text-5xl text-outline-variant mb-4 block"
              />
              <h3 className="font-bold mb-2">
                {isEn ? "No comments yet" : "还没有评论"}
              </h3>
              <p className="text-sm text-on-surface-variant">
                {isEn
                  ? "Be the first to share your experience."
                  : "成为第一个分享使用体验的人。"}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-3xl bg-surface-container-low p-6 border border-outline-variant/20">
            <h3 className="text-xl font-black mb-2">
              {isEn ? "Share your thoughts" : "发表你的看法"}
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">
              {isEn
                ? "Share your installation experience, suggestions, or areas the author could improve. Comments go through basic moderation and must not include harassment, spam, ghostwriting, or illicit promotion."
                : "分享安装体验、使用建议，或者告诉作者哪里可以改进。评论会经过基础内容检查，禁止引流、辱骂、代写与违规推广。"}
            </p>

            {loading ? (
              <div className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant animate-pulse">
                {isEn ? "Checking sign-in state..." : "正在检查登录状态..."}
              </div>
            ) : viewer.email ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-xl bg-surface-container-lowest px-4 py-3 text-xs text-on-surface-variant">
                  {isEn ? "Commenting as " : "以 "}
                  <span className="font-semibold">{viewer.email}</span>
                  {isEn ? "" : " 身份评论"}
                </div>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={COMMENT_MAX_LENGTH}
                  rows={6}
                  placeholder={isEn ? "Write your comment..." : "写下你的评论..."}
                  className="w-full resize-y rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-on-surface-variant">
                    {content.length}/{COMMENT_MAX_LENGTH}
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-on-primary font-bold disabled:opacity-70"
                    >
                      <Icon
                        name={submitting ? "hourglass_top" : "send"}
                        className="text-lg"
                      />
                    {submitting
                      ? isEn
                        ? "Posting..."
                        : "发布中..."
                      : isEn
                        ? "Post comment"
                        : "发表评论"}
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {isEn
                    ? "Rules: no contact farming, harassment, discrimination, spam, ghostwriting, gambling, or scams."
                    : "评论规范：禁止联系方式引流、辱骂歧视、垃圾广告、代写代做、博彩诈骗等内容。"}
                </p>
              </form>
            ) : (
              <div className="rounded-2xl bg-surface-container-lowest p-5">
                <p className="text-sm text-on-surface-variant mb-4">
                  {isEn
                    ? "Sign in to leave a comment. Public comments remain visible to signed-out visitors."
                    : "登录后可以发表评论。未登录用户仍然可以查看全部公开评论。"}
                </p>
                <Link
                  href={buildLocalizedPath(
                    locale,
                    `/login?next=${encodeURIComponent(pathname)}`
                  )}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-on-primary font-bold"
                >
                  <Icon name="login" className="text-lg" />
                  {isEn ? "Sign in to comment" : "登录后评论"}
                </Link>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm text-secondary">
                {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
