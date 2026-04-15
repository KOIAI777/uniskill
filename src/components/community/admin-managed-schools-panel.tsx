"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { ManagedSchool } from "@/types";

export function AdminManagedSchoolsPanel({ enabled }: { enabled: boolean }) {
  const [schools, setSchools] = useState<ManagedSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingSlug, setActingSlug] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { name: string; nameZh: string; country: string }>
  >({});
  const [createDraft, setCreateDraft] = useState({
    slug: "",
    name: "",
    nameZh: "",
    country: "CN",
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    setLoading(true);
    setError(null);

    fetch("/api/managed-schools?all=true", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as {
          schools?: ManagedSchool[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "学校列表加载失败");
        }

        if (!active) return;
        const loadedSchools = payload.schools ?? [];
        setSchools(loadedSchools);
        setDrafts(
          Object.fromEntries(
            loadedSchools.map((school) => [
              school.slug,
              {
                name: school.name,
                nameZh: school.nameZh,
                country: school.country,
              },
            ])
          )
        );
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "学校列表加载失败");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  const saveSchool = async (slug: string) => {
    setActingSlug(slug);
    setSuccess(null);
    setError(null);

    try {
      const draft = drafts[slug];
      const response = await fetch(`/api/managed-schools/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const payload = (await response.json()) as {
        school?: ManagedSchool;
        error?: string;
      };

      if (!response.ok || !payload.school) {
        throw new Error(payload.error || "保存失败");
      }

      setSchools((current) =>
        current.map((school) =>
          school.slug === slug ? (payload.school as ManagedSchool) : school
        )
      );
      setSuccess(`学校「${slug}」已更新。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setActingSlug(null);
    }
  };

  const toggleSchool = async (slug: string, active: boolean) => {
    setActingSlug(slug);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch(`/api/managed-schools/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });

      const payload = (await response.json()) as {
        school?: ManagedSchool;
        error?: string;
      };

      if (!response.ok || !payload.school) {
        throw new Error(payload.error || "更新失败");
      }

      setSchools((current) =>
        current.map((school) =>
          school.slug === slug ? (payload.school as ManagedSchool) : school
        )
      );
      setSuccess(
        active ? `学校「${slug}」已启用。` : `学校「${slug}」已停用。`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    } finally {
      setActingSlug(null);
    }
  };

  const createSchool = async () => {
    setActingSlug("__create__");
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/managed-schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createDraft),
      });
      const payload = (await response.json()) as {
        school?: ManagedSchool;
        error?: string;
      };

      if (!response.ok || !payload.school) {
        throw new Error(payload.error || "创建失败");
      }

      setSchools((current) => [...current, payload.school as ManagedSchool]);
      setDrafts((current) => ({
        ...current,
        [(payload.school as ManagedSchool).slug]: {
          name: (payload.school as ManagedSchool).name,
          nameZh: (payload.school as ManagedSchool).nameZh,
          country: (payload.school as ManagedSchool).country,
        },
      }));
      setCreateDraft({
        slug: "",
        name: "",
        nameZh: "",
        country: "CN",
      });
      setSuccess(`学校「${(payload.school as ManagedSchool).slug}」已创建。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setActingSlug(null);
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
            Official Schools
          </p>
          <h2 className="text-3xl font-black tracking-tight mb-2">
            官方学校管理
          </h2>
          <p className="text-on-surface-variant">
            管理运行时使用的官方学校列表，可新增、编辑、停用，并给学校归并面板提供目标选项。
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-sm text-on-surface-variant">
          <Icon name="school" className="text-base text-primary" filled />
          {schools.length} 个学校
        </span>
      </div>

      <div className="rounded-2xl bg-surface-container-low p-6 mb-8">
        <h3 className="text-lg font-black mb-4">新增官方学校</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            value={createDraft.slug}
            onChange={(event) =>
              setCreateDraft((current) => ({ ...current, slug: event.target.value }))
            }
            placeholder="slug，例如 bnu"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={createDraft.name}
            onChange={(event) =>
              setCreateDraft((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="英文名 / 缩写"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={createDraft.nameZh}
            onChange={(event) =>
              setCreateDraft((current) => ({ ...current, nameZh: event.target.value }))
            }
            placeholder="中文名"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <div className="flex items-center gap-3">
            <input
              value={createDraft.country}
              onChange={(event) =>
                setCreateDraft((current) => ({ ...current, country: event.target.value }))
              }
              placeholder="国家代码"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={createSchool}
              disabled={actingSlug === "__create__"}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-primary text-on-primary font-bold disabled:opacity-60"
            >
              <Icon name="add" className="text-base" />
              {actingSlug === "__create__" ? "创建中..." : "新增"}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-surface-container-low p-6 text-sm text-on-surface-variant animate-pulse">
          正在加载官方学校...
        </div>
      ) : schools.length > 0 ? (
        <div className="space-y-4">
          {schools.map((school) => (
            <article
              key={school.slug}
              className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div className="md:col-span-1">
                  <p className="text-xs text-on-surface-variant mb-1">Slug</p>
                  <p className="font-mono text-sm">{school.slug}</p>
                </div>
                <input
                  value={drafts[school.slug]?.name ?? school.name}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [school.slug]: {
                        name: event.target.value,
                        nameZh: current[school.slug]?.nameZh ?? school.nameZh,
                        country: current[school.slug]?.country ?? school.country,
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <input
                  value={drafts[school.slug]?.nameZh ?? school.nameZh}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [school.slug]: {
                        name: current[school.slug]?.name ?? school.name,
                        nameZh: event.target.value,
                        country: current[school.slug]?.country ?? school.country,
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <input
                  value={drafts[school.slug]?.country ?? school.country}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [school.slug]: {
                        name: current[school.slug]?.name ?? school.name,
                        nameZh: current[school.slug]?.nameZh ?? school.nameZh,
                        country: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <div className="flex flex-wrap gap-3 justify-start md:justify-end">
                  <button
                    type="button"
                    onClick={() => saveSchool(school.slug)}
                    disabled={actingSlug === school.slug}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-on-primary text-sm font-bold disabled:opacity-60"
                  >
                    <Icon name="save" className="text-base" />
                    {actingSlug === school.slug ? "保存中..." : "保存"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSchool(school.slug, !school.active)}
                    disabled={actingSlug === school.slug}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-60"
                  >
                    <Icon
                      name={school.active ? "visibility_off" : "visibility"}
                      className="text-base"
                    />
                    {school.active ? "停用" : "启用"}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    school.active
                      ? "bg-primary/10 text-primary"
                      : "bg-error/10 text-error"
                  }`}
                >
                  {school.active ? "启用中" : "已停用"}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-surface-container-low p-8 text-center">
          <Icon
            name="school"
            className="text-5xl text-outline-variant mb-4 block"
          />
          <h3 className="font-bold mb-2">目前还没有托管学校</h3>
          <p className="text-sm text-on-surface-variant">
            先在上方新增学校，之后就可以用于社区投稿和学校归并。
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
