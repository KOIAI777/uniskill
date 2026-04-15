"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  getCommentTargetHref,
  getCommentTargetLabel,
} from "@/lib/comments";
import type { SkillComment } from "@/types";

type Filter = "all" | "published" | "hidden";

interface AdminCommentsPanelProps {
  enabled: boolean;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function AdminCommentsPanel({ enabled }: AdminCommentsPanelProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [comments, setComments] = useState<SkillComment[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!enabled) return;

    setError(null);
    const params = new URLSearchParams({
      scope: "admin",
      page: String(pagination.page),
    });

    if (filter !== "all") {
      params.set("status", filter);
    }

    const response = await fetch(`/api/comments?${params.toString()}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as {
      comments?: SkillComment[];
      pagination?: PaginationState;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error || "审核评论加载失败");
    }

    setComments(payload.comments ?? []);
    setPagination(
      payload.pagination ?? {
        page: 1,
        pageSize: 10,
        total: payload.comments?.length ?? 0,
        totalPages: 1,
      }
    );
  }, [enabled, filter, pagination.page]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    setLoading(true);
    loadComments()
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "审核评论加载失败");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, loadComments]);

  useEffect(() => {
    setPagination((current) => ({ ...current, page: 1 }));
  }, [filter]);

  const moderate = async (commentId: string, action: "hide" | "restore") => {
    setActingId(commentId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as {
        comment?: SkillComment;
        error?: string;
      };

      if (!response.ok || !payload.comment) {
        throw new Error(payload.error || "评论审核失败");
      }

      const updatedComment = payload.comment as SkillComment;
      setComments((current) => {
        if (filter !== "all" && filter !== updatedComment.status) {
          return current.filter((comment) => comment.id !== commentId);
        }

        return current.map((comment) =>
          comment.id === commentId ? updatedComment : comment
        );
      });
      setSuccess(action === "hide" ? "评论已隐藏。" : "评论已恢复公开显示。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "评论审核失败");
    } finally {
      setActingId(null);
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient border border-outline-variant/20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
            Moderation
          </p>
          <h2 className="text-3xl font-black tracking-tight mb-2">
            评论审核面板
          </h2>
          <p className="text-on-surface-variant">
            查看最新评论、已隐藏评论，并快速跳回原 Skill 页面处理。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "全部"],
            ["published", "已发布"],
            ["hidden", "已隐藏"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as Filter)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                filter === value
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-surface-container-low p-6 text-sm text-on-surface-variant animate-pulse">
          正在加载审核评论...
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => {
            const href = getCommentTargetHref(comment.targetKind, comment.targetKey);

            return (
              <article
                key={comment.id}
                className={`rounded-2xl border p-6 ${
                  comment.status === "hidden"
                    ? "bg-surface-container-low border-error/20"
                    : "bg-surface-container-lowest border-outline-variant/20"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {getCommentTargetLabel(comment.targetKind, comment.targetKey)}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          comment.status === "hidden"
                            ? "bg-error/10 text-error"
                            : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        {comment.status === "hidden" ? "已隐藏" : "已发布"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">{comment.authorName}</p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(comment.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {href ? (
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        查看原 Skill
                        <Icon name="arrow_forward" className="text-base" />
                      </Link>
                    ) : (
                      <span className="text-sm text-on-surface-variant">
                        暂无原页跳转
                      </span>
                    )}

                    {comment.status === "published" ? (
                      <button
                        type="button"
                        onClick={() => moderate(comment.id, "hide")}
                        disabled={actingId === comment.id}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:border-error hover:text-error transition-colors disabled:opacity-50"
                      >
                        <Icon name="visibility_off" className="text-base" />
                        {actingId === comment.id ? "处理中..." : "隐藏"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => moderate(comment.id, "restore")}
                        disabled={actingId === comment.id}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors disabled:opacity-50"
                      >
                        <Icon name="visibility" className="text-base" />
                        {actingId === comment.id ? "处理中..." : "恢复"}
                      </button>
                    )}
                  </div>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
                  {comment.content}
                </p>
              </article>
            );
          })}

          {pagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="text-xs text-on-surface-variant">
                第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPagination((current) => ({
                      ...current,
                      page: Math.max(1, current.page - 1),
                    }))
                  }
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-semibold disabled:opacity-40"
                >
                  上一页
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPagination((current) => ({
                      ...current,
                      page: Math.min(current.totalPages, current.page + 1),
                    }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-semibold disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-surface-container-low p-8 text-center">
          <Icon
            name="admin_panel_settings"
            className="text-5xl text-outline-variant mb-4 block"
          />
          <h3 className="font-bold mb-2">当前筛选下没有评论</h3>
          <p className="text-sm text-on-surface-variant">
            试试切换到别的筛选标签，或者等待用户产生更多评论。
          </p>
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
  );
}
