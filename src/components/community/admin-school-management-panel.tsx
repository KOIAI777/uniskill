"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { ManagedSchool } from "@/types";

type CustomSchoolGroup = {
  name: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  latestCreatedAt: string;
};

export function AdminSchoolManagementPanel({
  enabled,
}: {
  enabled: boolean;
}) {
  const [groups, setGroups] = useState<CustomSchoolGroup[]>([]);
  const [schools, setSchools] = useState<ManagedSchool[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [actingName, setActingName] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    setLoading(true);
    setError(null);

    fetch("/api/community-skills/custom-schools", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as {
          customSchools?: CustomSchoolGroup[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "自定义学校加载失败");
        }

        if (!active) return;
        setGroups(payload.customSchools ?? []);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "自定义学校加载失败");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    fetch("/api/managed-schools?all=true", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as {
          schools?: ManagedSchool[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "官方学校加载失败");
        }

        if (!active) return;
        setSchools(payload.schools ?? []);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "官方学校加载失败");
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  const mergeSchool = async (groupName: string) => {
    const targetSchoolSlug = selectedTargets[groupName];

    if (!targetSchoolSlug) {
      setError("请先选择一个官方学校再执行归并。");
      return;
    }

    setActingName(groupName);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/community-skills/custom-schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customSchoolName: groupName,
          targetSchoolSlug,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        updatedCount?: number;
      };

      if (!response.ok) {
        throw new Error(payload.error || "归并失败");
      }

      setGroups((current) => current.filter((group) => group.name !== groupName));
      setSuccess(
        `已将「${groupName}」归并到「${targetSchoolSlug}」，共更新 ${payload.updatedCount ?? 0} 条社区 Skill。`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "归并失败");
    } finally {
      setActingName(null);
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
            School Management
          </p>
          <h2 className="text-3xl font-black tracking-tight mb-2">
            学校归并面板
          </h2>
          <p className="text-on-surface-variant">
            把用户填写的自定义学校名，归并到当前的官方学校列表中，统一社区 Skill 的学校维度。
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-sm text-on-surface-variant">
          <Icon name="school" className="text-base text-primary" filled />
          {groups.length} 个待归并学校名
        </span>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-surface-container-low p-6 text-sm text-on-surface-variant animate-pulse">
          正在加载自定义学校...
        </div>
      ) : groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <article
              key={group.name}
              className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{group.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      总计 {group.total}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold">
                      待审核 {group.pending}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      已上线 {group.approved}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-error/10 text-error text-xs font-bold">
                      已拒绝 {group.rejected}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    最近一次出现：
                    {new Date(group.latestCreatedAt).toLocaleString("zh-CN")}
                  </p>
                </div>

                <div className="w-full lg:max-w-sm space-y-3">
                  <div className="relative">
                    <select
                      value={selectedTargets[group.name] ?? ""}
                      onChange={(event) =>
                        setSelectedTargets((current) => ({
                          ...current,
                          [group.name]: event.target.value,
                        }))
                      }
                      className="w-full h-12 appearance-none rounded-xl border border-outline-variant/30 bg-surface px-4 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">选择要归并到的官方学校</option>
                      {schools.map((school) => (
                        <option key={school.slug} value={school.slug}>
                          {school.nameZh}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-outline">
                      <Icon name="expand_more" className="text-lg" />
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => mergeSchool(group.name)}
                    disabled={actingName === group.name}
                    className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-primary text-on-primary font-bold disabled:opacity-60"
                  >
                    <Icon name="swap_horiz" className="text-base" />
                    {actingName === group.name ? "归并中..." : "归并到官方学校"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-surface-container-low p-8 text-center">
          <Icon
            name="task_alt"
            className="text-5xl text-outline-variant mb-4 block"
          />
          <h3 className="font-bold mb-2">当前没有待归并的自定义学校</h3>
          <p className="text-sm text-on-surface-variant">
            目前社区 Skill 已经使用官方学校列表或通用学校标签。
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
