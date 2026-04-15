import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { SkillComments } from "@/components/comments/skill-comments";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapCommunitySkillRow, type CommunitySkillRow } from "@/lib/community-skills";
import { buildLocalizedPath, isLocale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;

  return {
    title: lang === "en" ? `${slug} | Community Skill` : `${slug} | 社区 Skill`,
    description: lang === "en" ? "Community Skill detail page" : "社区 Skill 详情页",
  };
}

export default async function LocalizedCommunitySkillPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const isEn = lang === "en";

  if (!isSupabaseConfigured()) {
    return (
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <SupabaseSetupNotice locale={lang} />
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("community_skills")
    .select(
      "id, slug, source_type, author_id, author_name, author_email, name, name_zh, description, description_zh, category, school_slug, custom_school_name, tags, github_url, version, file_path, original_file_name, file_size, status, review_note, reviewed_at, reviewed_by, created_at, updated_at"
    )
    .eq("slug", slug)
    .eq("source_type", "community")
    .eq("status", "approved")
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const skill = mapCommunitySkillRow(data as CommunitySkillRow);
  const title = isEn ? skill.name : skill.nameZh;
  const secondaryName = isEn ? skill.nameZh : skill.name;
  const description = isEn ? skill.description : skill.descriptionZh;
  const schoolLabel =
    skill.customSchoolName || skill.schoolSlug || (isEn ? "General" : "通用 / General");

  return (
    <div className="pt-24 pb-24 max-w-7xl mx-auto px-6">
      <nav className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant">
        <Link
          href={buildLocalizedPath(lang, "/")}
          className="hover:text-primary transition-colors"
        >
          {isEn ? "Home" : "首页"}
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <Link
          href={buildLocalizedPath(lang, "/community")}
          className="hover:text-primary transition-colors"
        >
          {isEn ? "Community" : "社区"}
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <span className="text-on-surface font-medium">{title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-20">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
              {isEn ? "Community Skill" : "社区 Skill"}
            </span>
            <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold uppercase">
              {skill.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase">
              {schoolLabel}
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2">
            {title}
          </h1>
          <p className="text-2xl font-medium text-on-surface-variant mb-8">
            {secondaryName}
          </p>

          <p className="text-lg leading-relaxed text-on-surface-variant mb-8">
            {description}
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <a
              href={`/api/community-skills/${skill.id}/download`}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-primary text-on-primary font-bold"
            >
              <Icon name="download" className="text-lg" />
              {isEn ? "Download community Skill" : "下载社区 Skill"}
            </a>
            {skill.githubUrl && (
              <a
                href={skill.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold hover:border-primary hover:text-primary transition-colors"
              >
                <Icon name="open_in_new" className="text-lg" />
                {isEn ? "Open reference link" : "查看参考链接"}
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {skill.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-bold"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-3xl bg-surface-container-low p-8 border border-outline-variant/20">
            <h2 className="text-lg font-black mb-4">
              {isEn ? "Submission details" : "投稿信息"}
            </h2>
            <div className="space-y-4">
              {[
                [isEn ? "Author" : "作者", skill.authorName],
                [isEn ? "Status" : "状态", skill.status],
                [isEn ? "Version" : "版本", skill.version],
                [isEn ? "File" : "文件", skill.originalFileName],
                [isEn ? "Size" : "大小", `${(skill.fileSize / 1024 / 1024).toFixed(2)} MB`],
                [
                  isEn ? "Created at" : "创建时间",
                  new Date(skill.createdAt).toLocaleString(isEn ? "en-US" : "zh-CN"),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 text-sm border-b border-outline-variant/20 pb-3"
                >
                  <span className="text-on-surface-variant">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>

            {skill.reviewNote && (
              <div className="mt-6 rounded-2xl bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
                  {isEn ? "Review Note" : "审核备注"}
                </p>
                <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                  {skill.reviewNote}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SkillComments
        locale={lang}
        title={isEn ? "Comments" : "评论 / Comments"}
        targetKind="community_skill"
        targetKey={skill.slug}
      />
    </div>
  );
}
