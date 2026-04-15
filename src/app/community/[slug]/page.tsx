import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { SkillComments } from "@/components/comments/skill-comments";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getCommunitySkillSchoolLabel,
  mapCommunitySkillRow,
  type CommunitySkillRow,
} from "@/lib/community-skills";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `${slug} | 社区 Skill`,
    description: "社区 Skill 详情页",
  };
}

export default async function CommunitySkillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <SupabaseSetupNotice />
        </div>
      </section>
    );
  }

  const { slug } = await params;
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

  return (
    <div className="pt-24 pb-24 max-w-7xl mx-auto px-6">
      <nav className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <Link href="/community" className="hover:text-primary transition-colors">
          Community
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <span className="text-on-surface font-medium">{skill.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-20">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
              Community Skill
            </span>
            <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold uppercase">
              {skill.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase">
              {getCommunitySkillSchoolLabel(skill)}
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2">
            {skill.nameZh}
          </h1>
          <p className="text-2xl font-medium text-on-surface-variant mb-8">
            {skill.name}
          </p>

          <p className="text-lg leading-relaxed text-on-surface-variant mb-8">
            {skill.descriptionZh}
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <a
              href={`/api/community-skills/${skill.id}/download`}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-primary text-on-primary font-bold"
            >
              <Icon name="download" className="text-lg" />
              下载社区 Skill
            </a>
            {skill.githubUrl && (
              <a
                href={skill.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold hover:border-primary hover:text-primary transition-colors"
              >
                <Icon name="open_in_new" className="text-lg" />
                查看参考链接
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
            <h2 className="text-lg font-black mb-4">投稿信息</h2>
            <div className="space-y-4">
              {[
                ["作者", skill.authorName],
                ["状态", skill.status],
                ["版本", skill.version],
                ["文件", skill.originalFileName],
                ["大小", `${(skill.fileSize / 1024 / 1024).toFixed(2)} MB`],
                ["创建时间", new Date(skill.createdAt).toLocaleString("zh-CN")],
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
                  Review Note
                </p>
                <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                  {skill.reviewNote}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SkillComments targetKind="community_skill" targetKey={skill.slug} />
    </div>
  );
}
