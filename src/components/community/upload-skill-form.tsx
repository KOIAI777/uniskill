"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { buildLocalizedPath, type AppLocale } from "@/i18n/config";
import {
  SKILL_MD_TEMPLATE_PROMPT,
  type SkillUploadPrefill,
} from "@/lib/skill-manifest";
import type { CategoryInfo, School } from "@/types";

const EMPTY_FORM_VALUES: SkillUploadPrefill = {
  name: "",
  nameZh: "",
  description: "",
  descriptionZh: "",
  category: "",
  schoolMode: "general",
  schoolSlug: "",
  customSchoolName: "",
  tags: "",
  version: "1.0.0",
  githubUrl: "",
};

interface InspectPayload {
  manifest: {
    categories: string[];
    schools: string[];
    tags: string[];
  };
  manifestPath: string;
  warnings: string[];
  prefill: SkillUploadPrefill;
}

interface ParsedArchiveSummary {
  fileName: string;
  manifestPath: string;
  categories: string[];
  schools: string[];
  tags: string[];
  warnings: string[];
}

export function UploadSkillForm({
  schools,
  categories,
  canPublishOfficial = false,
  locale = "zh",
}: {
  schools: School[];
  categories: CategoryInfo[];
  canPublishOfficial?: boolean;
  locale?: AppLocale;
}) {
  const router = useRouter();
  const isEn = locale === "en";
  const [sourceType, setSourceType] = useState<"community" | "official">(
    "community"
  );
  const [formValues, setFormValues] =
    useState<SkillUploadPrefill>(EMPTY_FORM_VALUES);
  const [parsedArchive, setParsedArchive] = useState<ParsedArchiveSummary | null>(
    null
  );
  const [inspectPending, setInspectPending] = useState(false);
  const [pending, setPending] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schoolMode = formValues.schoolMode;

  const updateField = <K extends keyof SkillUploadPrefill>(
    key: K,
    value: SkillUploadPrefill[K]
  ) => {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateSchoolMode = (mode: SkillUploadPrefill["schoolMode"]) => {
    setFormValues((current) => ({
      ...current,
      schoolMode: mode,
      schoolSlug: mode === "official" ? current.schoolSlug : "",
      customSchoolName: mode === "custom" ? current.customSchoolName : "",
    }));
  };

  const handleArchiveInspect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      setParsedArchive(null);
      return;
    }

    setInspectPending(true);

    try {
      const inspectFormData = new FormData();
      inspectFormData.set("file", file);

      const response = await fetch("/api/community-skills/inspect", {
        method: "POST",
        body: inspectFormData,
      });
      const payload = (await response.json()) as InspectPayload & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error || (isEn ? "Failed to read SKILL.md" : "读取 SKILL.md 失败")
        );
      }

      setFormValues(payload.prefill);
      setParsedArchive({
        fileName: file.name,
        manifestPath: payload.manifestPath,
        categories: payload.manifest.categories,
        schools: payload.manifest.schools,
        tags: payload.manifest.tags,
        warnings: payload.warnings,
      });
    } catch (err) {
      setParsedArchive(null);
      setError(
        err instanceof Error
          ? err.message
          : isEn
            ? "Failed to read SKILL.md"
            : "读取 SKILL.md 失败"
      );
    } finally {
      setInspectPending(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const submitFormData = new FormData(event.currentTarget);
      const response = await fetch("/api/community-skills", {
        method: "POST",
        body: submitFormData,
      });

      const payload = (await response.json()) as {
        error?: string;
        skill?: {
          sourceType: "community" | "official";
        };
      };

      if (!response.ok) {
        throw new Error(payload.error || (isEn ? "Submission failed" : "投稿失败"));
      }

      const notice =
        payload.skill?.sourceType === "official"
          ? "featured_published"
          : "upload_submitted";
      router.push(buildLocalizedPath(locale, `/account?notice=${notice}`));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEn
            ? "Submission failed"
            : "投稿失败"
      );
    } finally {
      setPending(false);
    }
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(SKILL_MD_TEMPLATE_PROMPT);
    setPromptCopied(true);
    window.setTimeout(() => setPromptCopied(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-primary via-primary/90 to-secondary p-[1px] shadow-[0_24px_80px_rgba(32,76,157,0.16)]">
        <div className="rounded-[31px] bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(246,248,252,0.92))] p-6 md:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Icon name="auto_awesome" className="text-sm" />
              Smart Upload
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight">
              {isEn
                ? "Inspect `SKILL.md` automatically after uploading a zip"
                : "上传 zip 后，自动读取 `SKILL.md`"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant md:text-base">
              {isEn
                ? "The current submission flow inspects the archive first, then parses key fields from `SKILL.md` to prefill the name, description, category, school, tags, and version. You just review, tweak, and submit."
                : "现在的投稿流程会先检查压缩包，并自动解析 `SKILL.md` 里的核心字段，帮你预填名称、简介、分类、学校、标签和版本号。你只需要确认、微调，然后提交。"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm lg:w-[320px]">
            {[
              [
                "inventory_2",
                isEn ? "Choose a zip" : "先选 zip",
                isEn
                  ? "We check whether the archive actually contains SKILL.md."
                  : "系统会检查压缩包里是否真的包含 SKILL.md。",
              ],
              [
                "dataset",
                isEn ? "Autofill metadata" : "自动预填",
                isEn
                  ? "Recognized frontmatter fields are written into the form below immediately."
                  : "能识别的 frontmatter 字段会立刻写入下面表单。",
              ],
              [
                "fact_check",
                isEn ? "Review and submit" : "再确认提交",
                isEn
                  ? "You can still edit everything manually before it enters moderation."
                  : "你仍然可以手动修改，确认后再进入审核。",
              ],
            ].map(([icon, title, description]) => (
              <div
                key={title}
                className="rounded-2xl bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                    <Icon name={icon} className="text-xl" filled />
                  </div>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="mt-1 text-on-surface-variant">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </section>

      {canPublishOfficial && (
        <div className="space-y-3">
          <span className="block text-sm font-semibold">
            {isEn ? "Publish type" : "发布类型"}
          </span>
          <div className="grid grid-cols-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-1.5">
            {[
              ["community", isEn ? "Community Skill" : "社区 Skill", "groups"],
              ["official", isEn ? "Featured Skill" : "精选 Skill", "verified"],
            ].map(([value, label, icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSourceType(value as "community" | "official")}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  sourceType === value
                    ? "bg-primary text-on-primary shadow-md shadow-primary/15"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                <Icon name={icon} className="text-base" />
                {label}
              </button>
            ))}
          </div>
          <input type="hidden" name="sourceType" value={sourceType} />
          <p className="text-xs text-on-surface-variant">
            {isEn
              ? "Featured Skills go directly into the curated collection; community Skills continue through the review workflow before going live."
              : "精选 Skill 会直接进入精选展示体系；社区 Skill 会继续走审核后上线流程。"}
          </p>
        </div>
      )}

      <section className="rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest p-6 md:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Step 1
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              {isEn ? "Choose the Skill archive" : "选择 Skill 压缩包"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              {isEn
                ? "Only `.zip` uploads are supported for now, up to 1MB, and the archive must contain `SKILL.md`. Putting metadata in frontmatter gives the parser the best chance of recognizing it reliably."
                : "当前只支持上传 `.zip`，大小上限为 1MB，且压缩包内部必须包含 `SKILL.md`。建议你先把元数据写进 frontmatter，这样系统就能稳定识别。"}
            </p>
          </div>

          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant xl:w-[320px]">
            <p className="font-semibold text-on-surface">
              {isEn ? "Currently parsed automatically:" : "系统当前会自动读取："}
            </p>
            <p className="mt-2">
              `name`、`nameZh`、`description`、`descriptionZh`、`category`、
              `schools`、`tags`、`version`、`githubUrl`
            </p>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-semibold">
            {isEn ? "Skill archive (.zip)" : "Skill 压缩包 (.zip)"}
          </span>
          <input
            required
            type="file"
            name="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={handleArchiveInspect}
            className="w-full rounded-2xl border border-dashed border-outline-variant/40 bg-surface px-4 py-4 outline-none transition-colors focus:border-primary"
          />
        </label>

        {inspectPending && (
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {isEn
              ? "Reading `SKILL.md` from the archive and prefilling the form..."
              : "正在读取压缩包里的 `SKILL.md`，马上帮你自动填表..."}
          </div>
        )}

        {parsedArchive && !inspectPending && (
          <div className="mt-4 rounded-3xl border border-secondary/20 bg-secondary/5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-secondary">
                  <Icon name="check_circle" className="text-sm" />
                  Parsed
                </div>
                <h3 className="mt-3 text-lg font-black">{parsedArchive.fileName}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {isEn
                    ? `Read \`${parsedArchive.manifestPath}\`. The fields below are now prefilled from the parsed result and remain editable.`
                    : `已读取 \`${parsedArchive.manifestPath}\`，下面字段已经按解析结果自动预填，你可以继续修改。`}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3 lg:w-[420px]">
                <div className="rounded-2xl bg-white/70 px-3 py-3">
                  <p className="font-bold text-on-surface">
                    {isEn ? "Category" : "分类"}
                  </p>
                  <p className="mt-1 text-on-surface-variant">
                    {parsedArchive.categories.length > 0
                      ? parsedArchive.categories.join(" / ")
                      : isEn
                        ? "Not detected"
                        : "未识别"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/70 px-3 py-3">
                  <p className="font-bold text-on-surface">
                    {isEn ? "School" : "学校"}
                  </p>
                  <p className="mt-1 text-on-surface-variant">
                    {parsedArchive.schools.length > 0
                      ? parsedArchive.schools.join(" / ")
                      : isEn
                        ? "General"
                        : "通用"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/70 px-3 py-3">
                  <p className="font-bold text-on-surface">
                    {isEn ? "Tags" : "标签"}
                  </p>
                  <p className="mt-1 text-on-surface-variant">
                    {parsedArchive.tags.length > 0
                      ? parsedArchive.tags.slice(0, 3).join(", ")
                      : isEn
                        ? "Not detected"
                        : "未识别"}
                  </p>
                </div>
              </div>
            </div>

            {parsedArchive.warnings.length > 0 && (
              <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/5 px-4 py-4 text-sm text-warning">
                <p className="font-bold">{isEn ? "Parsing notes" : "解析提醒"}</p>
                <div className="mt-2 space-y-1">
                  {parsedArchive.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest p-6 md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Step 2
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              {isEn ? "Review or complete the metadata" : "确认或补充元数据"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              {isEn
                ? "If `SKILL.md` is complete, this step is mostly just a final review. You can still edit anything manually; prefilling is only here to reduce typing, not lock the content."
                : "如果 `SKILL.md` 写得完整，这里基本只需要做最后确认。你也可以手动修改，前端预填只是为了帮你少填表，不会锁死内容。"}
            </p>
          </div>

          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant lg:w-[300px]">
            {isEn
              ? "If you fill in the form before uploading the zip, that's fine too. Re-selecting the archive will overwrite these fields with the latest parsed result."
              : "如果你先填表、后上传 zip，也没关系。重新选择 zip 后，系统会用最新解析结果覆盖这些字段。"}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Skill Name</span>
            <input
              required
              name="name"
              value={formValues.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:border-primary"
              placeholder="my-awesome-skill"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">中文名称</span>
            <input
              name="nameZh"
              value={formValues.nameZh}
              onChange={(event) => updateField("nameZh", event.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:border-primary"
              placeholder="我的超强 Skill"
            />
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">分类</span>
            <div className="relative">
              <select
                required
                name="category"
                value={formValues.category}
                onChange={(event) => updateField("category", event.target.value as SkillUploadPrefill["category"])}
                className="h-12 w-full appearance-none rounded-xl border border-outline-variant/30 bg-surface px-4 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="" disabled>
                  {isEn ? "Choose a category" : "选择分类"}
                </option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {isEn
                      ? `${category.name} / ${category.nameZh}`
                      : `${category.nameZh} / ${category.name}`}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-outline">
                <Icon name="expand_more" className="text-lg" />
              </span>
            </div>
          </label>

          <div className="space-y-3">
            <span className="block text-sm font-semibold">
              {isEn ? "School scope" : "适用学校"}
            </span>
            <div className="grid grid-cols-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-1.5">
              {[
                ["general", isEn ? "General" : "通用", "globe"],
                ["official", isEn ? "Official school" : "官方学校", "school"],
                ["custom", isEn ? "Custom" : "自定义", "edit_note"],
              ].map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    updateSchoolMode(value as SkillUploadPrefill["schoolMode"])
                  }
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                    schoolMode === value
                      ? "bg-primary text-on-primary shadow-md shadow-primary/15"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  <Icon name={icon} className="text-base" />
                  {label}
                </button>
              ))}
            </div>

            <input type="hidden" name="schoolMode" value={schoolMode} />

            {schoolMode === "official" && (
              <div className="relative">
                <select
                  value={formValues.schoolSlug}
                  onChange={(event) => updateField("schoolSlug", event.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-outline-variant/30 bg-surface px-4 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="" disabled>
                    {isEn ? "Choose an official school" : "选择官方学校"}
                  </option>
                  {schools.map((school) => (
                    <option key={school.slug} value={school.slug}>
                      {isEn ? school.name : school.nameZh}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-outline">
                  <Icon name="expand_more" className="text-lg" />
                </span>
              </div>
            )}

            {schoolMode === "custom" && (
              <input
                value={formValues.customSchoolName}
                onChange={(event) =>
                  updateField("customSchoolName", event.target.value)
                }
                className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:border-primary"
                placeholder={isEn ? "Enter your school name" : "填写你的学校名称"}
              />
            )}

            <input
              type="hidden"
              name="schoolSlug"
              value={schoolMode === "official" ? formValues.schoolSlug : ""}
            />
            <input
              type="hidden"
              name="customSchoolName"
              value={
                schoolMode === "custom" ? formValues.customSchoolName : ""
              }
            />

            <p className="text-xs text-on-surface-variant">
              {isEn
                ? "Official schools support consistent filtering. If your school is not listed yet, use a custom school name for now and an admin can merge it later."
                : "官方学校用于统一筛选；如果学校暂时不在列表中，可以先用自定义学校名，管理员后续可归并。"}
            </p>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-semibold">
            {isEn ? "English description" : "英文描述"}
          </span>
          <textarea
            required
            name="description"
            rows={4}
            value={formValues.description}
            onChange={(event) => updateField("description", event.target.value)}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:border-primary"
            placeholder={
              isEn
                ? "It just needs to be non-empty. A simple one-line explanation of what the Skill does is enough."
                : "只要非空即可，建议简单写清楚这个 Skill 是干什么的。"
            }
          />
        </label>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-semibold">
            {isEn ? "Chinese description" : "中文描述"}
          </span>
          <textarea
            name="descriptionZh"
            rows={4}
            value={formValues.descriptionZh}
            onChange={(event) => updateField("descriptionZh", event.target.value)}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:border-primary"
            placeholder={
              isEn
                ? "Describe in Chinese what problem this Skill is meant to solve."
                : "用中文介绍这个 Skill 适合解决什么问题。"
            }
          />
        </label>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold">
              {isEn ? "Tags" : "标签"}
            </span>
            <input
              name="tags"
              value={formValues.tags}
              onChange={(event) => updateField("tags", event.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:border-primary"
              placeholder="essay, formatting, apa7"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              {isEn ? "Version" : "版本号"}
            </span>
            <input
              name="version"
              value={formValues.version}
              onChange={(event) => updateField("version", event.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:border-primary"
            />
          </label>
        </div>

        <label className="mt-6 block">
            <span className="mb-2 block text-sm font-semibold">
              {isEn ? "GitHub / reference link" : "GitHub / 参考链接"}
            </span>
          <input
            type="url"
            name="githubUrl"
            value={formValues.githubUrl}
            onChange={(event) => updateField("githubUrl", event.target.value)}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:border-primary"
            placeholder="https://github.com/..."
          />
        </label>
      </section>

      <section className="rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest p-6 md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Step 3
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              {isEn
                ? "Final check before submitting, with a ready-made prompt if needed"
                : "提交前检查，必要时复制标准提示词"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              {isEn
                ? "If your `SKILL.md` is still messy or the parsed result is incomplete, copy the prompt below into your AI tool and ask it to rewrite the file using the fields our upload parser currently handles reliably. Then zip it again and re-upload."
                : "如果你的 `SKILL.md` 还没整理好，或者解析结果不完整，可以直接复制下面这段提示词给 AI，让它按我们当前上传系统能稳定解析的字段格式重写一版，然后重新打包上传。"}
            </p>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant lg:w-[320px]">
            <p className="font-semibold text-on-surface">
              {isEn ? "Recommended when" : "推荐使用场景"}
            </p>
            <p className="mt-2">
              {isEn
                ? "Use this when parsing warnings are numerous, frontmatter is incomplete, or you have not started writing `SKILL.md` yet."
                : "解析提醒较多、frontmatter 字段不齐、或者你还没开始写 `SKILL.md` 时，直接复制下面提示词给 AI 最省事。"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <textarea
            readOnly
            value={SKILL_MD_TEMPLATE_PROMPT}
            className="min-h-72 w-full rounded-2xl border border-outline-variant/20 bg-surface px-4 py-4 font-mono text-xs leading-6 text-on-surface outline-none"
          />

          <div className="flex flex-col gap-4 rounded-3xl bg-surface-container-low p-5">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20"
            >
              <Icon
                name={promptCopied ? "check" : "content_copy"}
                className="text-base"
              />
              {promptCopied
                ? isEn
                  ? "Prompt copied"
                  : "已复制提示词"
                : isEn
                  ? "Copy prompt"
                  : "复制提示词"}
            </button>

            {error && (
              <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <div className="rounded-2xl bg-surface px-4 py-4 text-sm text-on-surface-variant">
              <p className="font-semibold text-on-surface">
                {isEn ? "Submission note" : "提交说明"}
              </p>
              <p className="mt-2 leading-relaxed">
                {canPublishOfficial && sourceType === "official"
                  ? isEn
                    ? "This upload will be published directly as a featured Skill and appear in the curated collection."
                    : "这次将作为精选 Skill 直接发布到后台内容体系，并出现在精选展示入口中。"
                  : isEn
                    ? "Submissions enter moderation by default and stay private until approved. Once approved, they appear in the community list and automatically gain comment support."
                    : "提交后默认进入审核。管理员批准前不会公开展示。审核通过后会出现在社区 Skill 列表，并自动接入现有评论系统。"}
              </p>
            </div>

            <button
              type="submit"
              disabled={pending || inspectPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 py-4 font-bold text-on-primary shadow-lg shadow-primary/20 disabled:opacity-70"
            >
              <Icon
                name={pending ? "hourglass_top" : "upload_file"}
                className="text-lg"
              />
              {pending
                ? isEn
                  ? "Submitting..."
                  : "提交中..."
                : isEn
                  ? "Submit for review"
                  : "提交审核"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
