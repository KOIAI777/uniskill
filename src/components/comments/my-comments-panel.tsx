"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  COMMENTS_PAGE_SIZE,
  getCommentTargetHref,
  getCommentTargetLabel,
} from "@/lib/comments";
import type { SkillComment } from "@/types";

export function MyCommentsPanel({
  initialComments,
  initialPagination,
}: {
  initialComments: SkillComment[];
  initialPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}) {
  const [comments, setComments] = useState(initialComments);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
    setPagination(initialPagination);
  }, [initialComments, initialPagination]);

  const loadComments = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/comments?scope=mine&page=${page}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as {
        comments?: SkillComment[];
        pagination?: typeof initialPagination;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "评论加载失败");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "评论加载失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient border border-outline-variant/20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
            My Comments
          </p>
          <h2 className="text-3xl font-black tracking-tight mb-2">
            我的评论
          </h2>
          <p className="text-on-surface-variant">
            这里会聚合你发过的评论。以后社区 Skill 上的评论也会一起显示在这里。
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-sm text-on-surface-variant">
          <Icon name="forum" className="text-base text-primary" filled />
          共 {pagination.total} 条评论
        </span>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-surface-container-low p-6 text-sm text-on-surface-variant animate-pulse">
          正在加载我的评论...
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-on-surface-variant">
            第 {pagination.page} / {pagination.totalPages} 页，每页 {pagination.pageSize} 条。
          </p>
          {comments.map((comment) => {
            const href = getCommentTargetHref(comment.targetKind, comment.targetKey);

            return (
              <article
                key={comment.id}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {getCommentTargetLabel(comment.targetKind, comment.targetKey)}
                      </span>
                      {comment.status === "hidden" && (
                        <span className="px-2.5 py-1 rounded-full bg-error/10 text-error text-xs font-bold">
                          已隐藏
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(comment.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>

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
                      社区 Skill 页面上线后可跳转
                    </span>
                  )}
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
                当前共 {pagination.total} 条评论
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadComments(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page <= 1 || loading}
                  className="px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-semibold disabled:opacity-40"
                >
                  上一页
                </button>
                <button
                  type="button"
                  onClick={() =>
                    loadComments(Math.min(pagination.totalPages, pagination.page + 1))
                  }
                  disabled={pagination.page >= pagination.totalPages || loading}
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
            name="chat_bubble"
            className="text-5xl text-outline-variant mb-4 block"
          />
          <h3 className="font-bold mb-2">你还没有评论</h3>
          <p className="text-sm text-on-surface-variant mb-5">
            去任意 Skill 页面写下第一条使用体验吧。
          </p>
          <Link
            href="/community"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-on-primary font-bold"
          >
            <Icon name="travel_explore" className="text-lg" />
            去逛市场
          </Link>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}
    </div>
  );
}
