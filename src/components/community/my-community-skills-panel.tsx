"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  COMMUNITY_SKILLS_PAGE_SIZE,
  formatCommunitySkillTargetHref,
  getCommunitySkillSchoolLabel,
} from "@/lib/community-skills";
import type { CommunitySkill } from "@/types";

export function MyCommunitySkillsPanel({
  initialSkills,
  initialPagination,
}: {
  initialSkills: CommunitySkill[];
  initialPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}) {
  const [skills, setSkills] = useState(initialSkills);
  const [pagination, setPagination] = useState(initialPagination);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSkills(initialSkills);
    setPagination(initialPagination);
  }, [initialPagination, initialSkills]);

  const loadSkills = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        sourceType: "community",
      });
      const response = await fetch(`/api/community-skills?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        skills?: CommunitySkill[];
        pagination?: typeof initialPagination;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "投稿加载失败");
      }

      setSkills(payload.skills ?? []);
      setPagination(
        payload.pagination ?? {
          page,
          pageSize: COMMUNITY_SKILLS_PAGE_SIZE,
          total: payload.skills?.length ?? 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿加载失败");
    } finally {
      setLoading(false);
    }
  };

  const removeSkill = async (skillId: string) => {
    const confirmed = window.confirm(
      "确认删除这个社区 Skill 吗？删除后会尝试同时清理 zip 文件和相关评论，且无法恢复。"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(skillId);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch(`/api/community-skills/${skillId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        deletedId?: string;
        error?: string;
        warnings?: string[];
      };

      if (!response.ok || !payload.deletedId) {
        throw new Error(payload.error || "删除投稿失败");
      }

      setSkills((current) =>
        current.filter((skill) => skill.id !== payload.deletedId)
      );

      const warningSuffix =
        payload.warnings && payload.warnings.length > 0
          ? `（但有清理提醒：${payload.warnings.join(" ")}）`
          : "";

      setSuccess(`社区 Skill 已删除。${warningSuffix}`);
      await loadSkills(
        Math.min(
          pagination.page,
          Math.max(1, Math.ceil(Math.max(0, pagination.total - 1) / pagination.pageSize))
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除投稿失败");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient border border-outline-variant/20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
            My Uploads
          </p>
          <h2 className="text-3xl font-black tracking-tight mb-2">
            我的投稿
          </h2>
          <p className="text-on-surface-variant">
            跟踪你提交的社区 Skill 审核状态。你可以删除自己提交的任意社区 Skill。
          </p>
          <p className="text-xs text-on-surface-variant mt-2">
            说明：删除已上线的社区 Skill 后，它会从市场页下线，并尝试一起清理 zip 文件和相关评论。
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-sm text-on-surface-variant">
          <Icon name="upload_file" className="text-base text-primary" filled />
          共 {pagination.total} 条投稿
        </span>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-surface-container-low p-6 text-sm text-on-surface-variant animate-pulse">
          正在加载我的投稿...
        </div>
      ) : skills.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-on-surface-variant">
            第 {pagination.page} / {pagination.totalPages} 页，每页 {pagination.pageSize} 条。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {skills.map((skill) => {
              return (
                <article
                  key={skill.id}
                  className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 flex flex-col min-h-[320px]"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                      {skill.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold">
                      {getCommunitySkillSchoolLabel(skill)}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        skill.status === "approved"
                          ? "bg-primary/10 text-primary"
                          : skill.status === "pending"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-error/10 text-error"
                      }`}
                    >
                      {skill.status === "approved"
                        ? "已上线"
                        : skill.status === "pending"
                          ? "审核中"
                          : "已拒绝"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-1 line-clamp-2">
                    {skill.nameZh}
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-3">
                    {new Date(skill.createdAt).toLocaleString("zh-CN")}
                  </p>

                  <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-4">
                    {skill.descriptionZh}
                  </p>

                  {skill.reviewNote && (
                    <div className="mt-4 rounded-2xl bg-surface-container-lowest p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
                        Review Note
                      </p>
                      <p className="text-sm text-on-surface-variant whitespace-pre-wrap line-clamp-4">
                        {skill.reviewNote}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex flex-col gap-2">
                    <Link
                      href={formatCommunitySkillTargetHref(skill.slug)}
                      className="inline-flex items-center justify-between gap-2 text-sm font-semibold text-primary hover:underline"
                    >
                      查看详情
                      <Icon name="arrow_forward" className="text-base" />
                    </Link>
                    <a
                      href={`/api/community-skills/${skill.id}/download`}
                      className="inline-flex items-center justify-between gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary"
                    >
                      下载 zip
                      <Icon name="download" className="text-base" />
                    </a>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.id)}
                      disabled={deletingId === skill.id}
                      className="inline-flex items-center justify-between gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:border-error hover:text-error disabled:opacity-50"
                    >
                      {deletingId === skill.id ? "删除中..." : "删除投稿"}
                      <Icon name="delete" className="text-base" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="text-xs text-on-surface-variant">
                当前共 {pagination.total} 条投稿
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadSkills(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page <= 1 || loading}
                  className="px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-semibold disabled:opacity-40"
                >
                  上一页
                </button>
                <button
                  type="button"
                  onClick={() =>
                    loadSkills(Math.min(pagination.totalPages, pagination.page + 1))
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
            name="upload_file"
            className="text-5xl text-outline-variant mb-4 block"
          />
          <h3 className="font-bold mb-2">你还没有投稿</h3>
          <p className="text-sm text-on-surface-variant mb-5">
            上传第一个社区 Skill，看看审核流和上线流程是否顺手。
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-on-primary font-bold"
          >
            <Icon name="upload_file" className="text-lg" />
            去投稿
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
  );
}
