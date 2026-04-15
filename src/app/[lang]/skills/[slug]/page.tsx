import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { CopyButton } from "@/components/skill/copy-button";
import { DownloadButton } from "@/components/skill/download-button";
import { SkillCard } from "@/components/skill/skill-card";
import { SkillComments } from "@/components/comments/skill-comments";
import { AdSlot } from "@/components/layout/ad-slot";
import { getSkillBySlug, getRelatedSkills, getAllSkills } from "@/lib/skills";
import { getOfficialSkillBySlugFromDb } from "@/lib/unified-skills";
import { buildLocalizedPath, isLocale } from "@/i18n/config";

export function generateStaticParams() {
  return getAllSkills().flatMap((skill) => [
    { lang: "zh", slug: skill.slug },
    { lang: "en", slug: skill.slug },
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const dbSkill = await getOfficialSkillBySlugFromDb(slug);
  const fallbackSkill = getSkillBySlug(slug);
  const skill = dbSkill
    ? {
        name: dbSkill.name,
        nameZh: dbSkill.nameZh,
        description: dbSkill.description,
        descriptionZh: dbSkill.descriptionZh,
        tags: dbSkill.tags,
      }
    : fallbackSkill;

  if (!skill) return {};

  const isEn = lang === "en";
  const title = isEn ? `${skill.name} (${skill.nameZh})` : `${skill.nameZh} (${skill.name})`;
  const description = isEn ? skill.description : skill.descriptionZh || skill.description;

  return {
    title,
    description,
    keywords: skill.tags,
    openGraph: {
      title: `${isEn ? skill.name : skill.nameZh} - UniSkill`,
      description,
    },
  };
}

const featureIcons: Record<string, { icon: string; color: string }> = {
  formatting: { icon: "article", color: "border-primary" },
  reference: { icon: "format_list_numbered", color: "border-secondary" },
  email: { icon: "spellcheck", color: "border-tertiary" },
  exam: { icon: "output", color: "border-primary-container" },
  presentation: { icon: "slideshow", color: "border-secondary" },
  research: { icon: "search", color: "border-primary" },
};

export default async function LocalizedSkillDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const isEn = lang === "en";
  const dbSkill = await getOfficialSkillBySlugFromDb(slug);
  const fallbackSkill = getSkillBySlug(slug);

  const skill = dbSkill
    ? {
        slug: dbSkill.slug,
        name: dbSkill.name,
        nameZh: dbSkill.nameZh,
        description: dbSkill.description,
        descriptionZh: dbSkill.descriptionZh,
        category: dbSkill.category,
        schools: dbSkill.schoolSlug ? [dbSkill.schoolSlug] : [],
        tags: dbSkill.tags,
        installCommand:
          dbSkill.installCommand ||
          `claude skill install https://uniskill.online/api/community-skills/${dbSkill.id}/download`,
        downloadPath: `/api/community-skills/${dbSkill.id}/download`,
        githubUrl: dbSkill.githubUrl || "https://github.com/uniskill/skills",
        version: dbSkill.version,
        downloads: dbSkill.downloads,
        featured: dbSkill.featured,
        createdAt: (dbSkill.publishedAt || dbSkill.createdAt).split("T")[0],
        preview: {
          screenshots: [],
          exampleInput: "",
          exampleOutput: "",
        },
      }
    : fallbackSkill;

  if (!skill) notFound();

  const related = getRelatedSkills(skill);
  const primaryCategory = Array.isArray(skill.category) ? skill.category[0] : skill.category;
  const feat = featureIcons[primaryCategory] || featureIcons.formatting;
  const displayName = isEn ? skill.name : skill.nameZh;
  const secondaryName = isEn ? skill.nameZh : skill.name;
  const description = isEn ? skill.description : skill.descriptionZh || skill.description;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: displayName || skill.name,
    description,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
    softwareVersion: skill.version,
    datePublished: skill.createdAt,
  };

  const usageSteps = isEn
    ? [
        {
          title: "1. Install the Skill",
          content: `Copy the install command and run it in your terminal: ${skill.installCommand}`,
        },
        {
          title: "2. Start using it",
          content: "Once installed, the Skill is available directly inside Claude Code.",
        },
        {
          title: "3. Check the help output",
          content: "Run /help in Claude Code to see available commands and examples.",
        },
      ]
    : [
        {
          title: "1. 安装 Skill",
          content: `复制安装命令并在终端中运行：${skill.installCommand}`,
        },
        {
          title: "2. 开始使用",
          content: "安装完成后，在 Claude Code 中即可直接使用该 Skill 的功能。",
        },
        {
          title: "3. 查看帮助",
          content: "在 Claude Code 中输入 /help 查看所有可用命令和使用示例。",
        },
      ];

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant">
        <Link
          href={buildLocalizedPath(lang, "/")}
          className="hover:text-primary transition-colors"
        >
          {isEn ? "Home" : "首页"}
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <Link
          href={buildLocalizedPath(lang, "/schools")}
          className="hover:text-primary transition-colors"
        >
          {isEn ? "Skills" : "技能"}
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <span className="text-on-surface font-medium">{displayName}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full mb-6">
            <span className="text-[10px] font-bold uppercase text-on-surface-variant">
              v{skill.version}
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="text-[10px] font-bold uppercase text-on-surface-variant">
              {skill.createdAt}
            </span>
            <span className="w-1 h-1 rounded-full bg-secondary" />
            <span className="text-[10px] font-bold uppercase text-secondary">
              {isEn ? "Active" : "已启用"}
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2">
            {displayName}
          </h1>
          <p className="text-2xl font-medium text-on-surface-variant mb-8">
            {secondaryName}
          </p>

          <div className="flex flex-wrap gap-4 mb-8">
            <CopyButton
              text={skill.installCommand}
              label={isEn ? "Copy install command" : "复制安装命令"}
              copiedLabel={isEn ? "Copied!" : "已复制!"}
            />
            <DownloadButton downloadPath={skill.downloadPath} locale={lang} />
          </div>

          <div className="flex items-center gap-6 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Icon name="verified" className="text-base text-secondary" />
              {isEn ? "Verified script" : "已验证脚本"}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 relative group">
          <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 to-secondary/10 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity rounded-2xl" />
          <div className="relative bg-inverse-surface rounded-xl p-8 text-inverse-on-surface">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-error" />
              <div className="w-3 h-3 rounded-full bg-secondary-fixed-dim" />
              <div className="w-3 h-3 rounded-full bg-inverse-primary" />
            </div>
            <pre className="font-mono text-sm leading-relaxed opacity-80">
              <code>
                <span className="text-inverse-primary">$</span> claude skill install {"\n"}
                {"  "}{skill.slug}{"\n"}
                {"\n"}
                <span className="text-secondary-fixed">✓</span>{" "}
                {isEn ? "Skill installed successfully" : "Skill 安装成功"}
                {"\n"}
                <span className="text-secondary-fixed">✓</span>{" "}
                {isEn ? "Ready to use" : "可以开始使用"}
              </code>
            </pre>
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <span className="text-[10px] font-mono uppercase opacity-60">
                {isEn ? "System active" : "系统运行中"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-20">
        <h2 className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-8">
          {isEn ? "Features" : "功能说明 / Features"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`flex gap-4 p-6 bg-surface-container-low rounded-xl border-l-4 ${feat.color}`}>
            <Icon name={feat.icon} className="text-3xl text-primary" />
            <div>
              <h3 className="font-bold mb-1">{displayName}</h3>
              <p className="text-sm text-on-surface-variant">{description}</p>
            </div>
          </div>
          <div className="flex gap-4 p-6 bg-surface-container-low rounded-xl border-l-4 border-secondary">
            <Icon name="auto_awesome" className="text-3xl text-secondary" />
            <div>
              <h3 className="font-bold mb-1">{isEn ? "AI powered" : "AI 驱动"}</h3>
              <p className="text-sm text-on-surface-variant">
                {isEn
                  ? "Built around the Claude Code SKILL.md format to help with academic tasks."
                  : "基于 Claude Code SKILL.md 格式，智能处理你的学术任务"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-20">
        <h2 className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-8">
          {isEn ? "Usage Tutorial" : "使用教程 / Usage Tutorial"}
        </h2>
        <div className="space-y-4">
          {usageSteps.map((step) => (
            <div
              key={step.title}
              className="p-6 bg-surface-container-lowest rounded-xl"
            >
              <h3 className="font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-on-surface-variant">{step.content}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-20">
        <AdSlot format="horizontal" />
      </section>

      <section className="mb-20">
        <div className="bg-surface-container rounded-xl p-6 max-w-md">
          <h3 className="text-xs font-black uppercase text-on-surface-variant mb-4">
            {isEn ? "Skill info" : "Skill 信息"}
          </h3>
          {[
            [isEn ? "Type" : "类型", "CLI Tool"],
            [isEn ? "License" : "许可", "MIT"],
            [
              isEn ? "Category" : "分类",
              Array.isArray(skill.category) ? skill.category.join(", ") : skill.category,
            ],
            [
              isEn ? "Schools" : "学校",
              skill.schools.length > 0
                ? skill.schools.join(", ").toUpperCase()
                : isEn
                  ? "General"
                  : "通用",
            ],
            [isEn ? "Created" : "创建时间", skill.createdAt],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between py-2 border-b border-outline-variant/20 text-sm"
            >
              <span className="text-on-surface-variant">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <SkillComments
        locale={lang}
        title={isEn ? "Comments" : "评论 / Comments"}
        targetKind="official_skill"
        targetKey={skill.slug}
      />

      {related.length > 0 && (
        <section>
          <h2 className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-8">
            {isEn ? "Related Skills" : "相关推荐 / Related Skills"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {related.map((s) => (
              <SkillCard key={s.slug} skill={s} locale={lang} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
