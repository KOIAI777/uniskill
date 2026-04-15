"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  formatCommunitySkillTargetHref,
  getCommunitySkillSchoolLabel,
} from "@/lib/community-skills";
import type {
  CommunitySkill,
  CommunitySkillStatus,
  SkillSourceType,
} from "@/types";

type Filter = "pending" | "approved" | "rejected";

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DraftState {
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  version: string;
  githubUrl: string;
}

const STATUS_STYLES: Record<
  CommunitySkillStatus,
  { label: string; className: string }
> = {
  pending: { label: "待审核", className: "bg-secondary/10 text-secondary" },
  approved: { label: "已上线", className: "bg-primary/10 text-primary" },
  rejected: { label: "已拒绝", className: "bg-error/10 text-error" },
};

function buildDraft(skill: CommunitySkill): DraftState {
  return {
    name: skill.name,
    nameZh: skill.nameZh,
    description: skill.description,
    descriptionZh: skill.descriptionZh,
    version: skill.version,
    githubUrl: skill.githubUrl ?? "",
  };
}

function SkillManagementPanel({
  enabled,
  sourceType,
  title,
  description,
  loadingText,
  emptyText,
  deleteConfirmText,
  deleteSuccessText,
}: {
  enabled: boolean;
  sourceType: SkillSourceType;
  title: string;
  description: string;
  loadingText: string;
  emptyText: string;
  deleteConfirmText: string;
  deleteSuccessText: string;
}) {
  const [filter, setFilter] = useState<Filter>(
    sourceType === "official" ? "approved" : "pending"
  );
  const [skills, setSkills] = useState<CommunitySkill[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 1,
  });
  const [actingId, setActingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detailHrefForSkill = (skill: CommunitySkill) =>
    skill.sourceType === "official"
      ? `/skills/${skill.slug}`
      : formatCommunitySkillTargetHref(skill.slug);

  const loadSkills = useCallback(async () => {
    if (!enabled) return;

    setError(null);
    const params = new URLSearchParams({
      scope: "admin",
      status: filter,
      page: String(pagination.page),
      sourceType,
    });
    const response = await fetch(`/api/community-skills?${params.toString()}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as {
      skills?: CommunitySkill[];
      pagination?: PaginationState;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error || "加载失败");
    }

    const loadedSkills = payload.skills ?? [];
    setSkills(loadedSkills);
    setDrafts(
      Object.fromEntries(loadedSkills.map((skill) => [skill.id, buildDraft(skill)]))
    );
    setPagination(
      payload.pagination ?? {
        page: 1,
        pageSize: 12,
        total: payload.skills?.length ?? 0,
        totalPages: 1,
      }
    );
  }, [enabled, filter, pagination.page, sourceType]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    setLoading(true);

    loadSkills()
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, loadSkills]);

  useEffect(() => {
    setPagination((current) => ({ ...current, page: 1 }));
  }, [filter]);

  const updateDraft = (
    skill: CommunitySkill,
    key: keyof DraftState,
    value: string
  ) => {
    setDrafts((current) => ({
      ...current,
      [skill.id]: {
        ...(current[skill.id] ?? buildDraft(skill)),
        [key]: value,
      },
    }));
  };

  const reviewSkill = async (
    skillId: string,
    action: "approve" | "reject" | "offline" | "online" | "edit"
  ) => {
    setActingId(skillId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/community-skills/${skillId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewNote: notes[skillId] ?? "",
          ...(action === "edit" ? drafts[skillId] : {}),
        }),
      });

      const payload = (await response.json()) as {
        skill?: CommunitySkill;
        error?: string;
      };

      if (!response.ok || !payload.skill) {
        throw new Error(payload.error || "处理失败");
      }

      const updatedSkill = payload.skill;
      setSkills((current) => {
        if (filter !== updatedSkill.status) {
          return current.filter((skill) => skill.id !== skillId);
        }

        return current.map((skill) =>
          skill.id === skillId ? updatedSkill : skill
        );
      });

      setSuccess(
        action === "approve"
          ? "Skill 已批准上线。"
          : action === "reject"
            ? "Skill 已拒绝，并保留审核备注。"
            : action === "offline"
              ? "Skill 已下线。"
              : action === "online"
                ? "Skill 已重新上线。"
                : "Skill 信息已保存。"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败");
    } finally {
      setActingId(null);
    }
  };

  const deleteSkill = async (skillId: string) => {
    const confirmed = window.confirm(deleteConfirmText);

    if (!confirmed) {
      return;
    }

    setActingId(skillId);
    setError(null);
    setSuccess(null);

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
        throw new Error(payload.error || "删除失败");
      }

      setSkills((current) =>
        current.filter((skill) => skill.id !== payload.deletedId)
      );
      const warningSuffix =
        payload.warnings && payload.warnings.length > 0
          ? `（清理提醒：${payload.warnings.join(" ")}）`
          : "";
      setSuccess(`${deleteSuccessText}${warningSuffix}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
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
            {sourceType === "official" ? "Featured Management" : "Upload Moderation"}
          </p>
          <h2 className="text-3xl font-black tracking-tight mb-2">{title}</h2>
          <p className="text-on-surface-variant">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["pending", sourceType === "official" ? "待发布" : "待审核"],
            ["approved", "已上线"],
            ["rejected", sourceType === "official" ? "已下线" : "已拒绝"],
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
          {loadingText}
        </div>
      ) : skills.length > 0 ? (
        <div className="space-y-4">
          <div
            className={`grid grid-cols-1 gap-4 ${
              sourceType === "community" ? "lg:grid-cols-2" : "2xl:grid-cols-2"
            }`}
          >
            {skills.map((skill) => {
              const status = STATUS_STYLES[skill.status];
              const detailHref = detailHrefForSkill(skill);

              return (
                <article
                  key={skill.id}
                  className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold uppercase">
                          {skill.sourceType === "official" ? "精选" : "社区"}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold uppercase">
                          {skill.category}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                          {getCommunitySkillSchoolLabel(skill)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{skill.nameZh}</h3>
                      <p className="text-sm text-on-surface-variant mb-1">{skill.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        投稿人：{skill.authorName} ({skill.authorEmail}) ·{' '}
                        {new Date(skill.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={detailHref}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        查看详情
                        <Icon name="arrow_forward" className="text-base" />
                      </Link>
                      <a
                        href={`/api/community-skills/${skill.id}/download`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary"
                      >
                        <Icon name="download" className="text-base" />
                        下载 zip
                      </a>
                    </div>
                  </div>

                  <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                    {skill.descriptionZh}
                  </p>

                  {sourceType === "official" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 rounded-2xl bg-surface-container-lowest p-4">
                      <input
                        value={drafts[skill.id]?.name ?? skill.name}
                        onChange={(event) => updateDraft(skill, 'name', event.target.value)}
                        className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder="英文名"
                      />
                      <input
                        value={drafts[skill.id]?.nameZh ?? skill.nameZh}
                        onChange={(event) => updateDraft(skill, 'nameZh', event.target.value)}
                        className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder="中文名"
                      />
                      <textarea
                        value={drafts[skill.id]?.description ?? skill.description}
                        onChange={(event) => updateDraft(skill, 'description', event.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder="英文描述"
                      />
                      <textarea
                        value={drafts[skill.id]?.descriptionZh ?? skill.descriptionZh}
                        onChange={(event) => updateDraft(skill, 'descriptionZh', event.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder="中文描述"
                      />
                      <input
                        value={drafts[skill.id]?.version ?? skill.version}
                        onChange={(event) => updateDraft(skill, 'version', event.target.value)}
                        className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder="版本号"
                      />
                      <input
                        value={drafts[skill.id]?.githubUrl ?? skill.githubUrl ?? ''}
                        onChange={(event) => updateDraft(skill, 'githubUrl', event.target.value)}
                        className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder="GitHub / 参考链接"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {skill.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <textarea
                    value={notes[skill.id] ?? skill.reviewNote ?? ''}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [skill.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="审核备注（可选）"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary mb-4"
                  />

                  <div className="flex flex-wrap gap-3">
                    {sourceType === 'official' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => reviewSkill(skill.id, 'edit')}
                          disabled={actingId === skill.id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-on-primary text-sm font-bold disabled:opacity-60"
                        >
                          <Icon name="save" className="text-base" />
                          {actingId === skill.id ? '保存中...' : '保存信息'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            reviewSkill(
                              skill.id,
                              skill.status === 'approved' ? 'offline' : 'online'
                            )
                          }
                          disabled={actingId === skill.id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:border-error hover:text-error disabled:opacity-60"
                        >
                          <Icon
                            name={skill.status === 'approved' ? 'visibility_off' : 'visibility'}
                            className="text-base"
                          />
                          {skill.status === 'approved' ? '下线' : '发布上线'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => reviewSkill(skill.id, 'approve')}
                          disabled={actingId === skill.id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-on-primary text-sm font-bold disabled:opacity-60"
                        >
                          <Icon name="check_circle" className="text-base" />
                          {actingId === skill.id ? '处理中...' : '批准上线'}
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewSkill(skill.id, 'reject')}
                          disabled={actingId === skill.id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:border-error hover:text-error disabled:opacity-60"
                        >
                          <Icon name="cancel" className="text-base" />
                          {actingId === skill.id ? '处理中...' : '拒绝'}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteSkill(skill.id)}
                      disabled={actingId === skill.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:border-error hover:text-error disabled:opacity-60"
                    >
                      <Icon name="delete" className="text-base" />
                      {actingId === skill.id ? '处理中...' : '删除'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

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
            name="inventory_2"
            className="text-5xl text-outline-variant mb-4 block"
          />
          <h3 className="font-bold mb-2">当前筛选下没有内容</h3>
          <p className="text-sm text-on-surface-variant">{emptyText}</p>
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

export function AdminCommunitySkillsPanel({ enabled }: { enabled: boolean }) {
  return (
    <SkillManagementPanel
      enabled={enabled}
      sourceType="community"
      title="社区 Skill 审核面板"
      description="处理用户投稿并决定是否上线到社区 Skill 列表。"
      loadingText="正在加载社区投稿..."
      emptyText="等用户提交更多社区 Skill，或者切换筛选查看其他状态。"
      deleteConfirmText="确认删除这个社区 Skill 吗？删除后会尝试同时清理 zip 文件和相关评论，且无法恢复。"
      deleteSuccessText="社区 Skill 已删除。"
    />
  );
}

export function AdminFeaturedSkillsPanel({ enabled }: { enabled: boolean }) {
  return (
    <SkillManagementPanel
      enabled={enabled}
      sourceType="official"
      title="精选 Skill 管理面板"
      description="管理精选展示流，可直接编辑、发布、下线或删除精选 Skill。"
      loadingText="正在加载精选 Skill..."
      emptyText="当前筛选下没有精选 Skill。你可以直接去上传页发布新的精选 Skill。"
      deleteConfirmText="确认删除这个精选 Skill 吗？删除后会尝试同时清理 zip 文件和相关评论，且无法恢复。"
      deleteSuccessText="精选 Skill 已删除。"
    />
  );
}
