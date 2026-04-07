import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { CopyButton } from "@/components/skill/copy-button";
import { DownloadButton } from "@/components/skill/download-button";
import { SkillCard } from "@/components/skill/skill-card";
import { AdSlot } from "@/components/layout/ad-slot";
import { getSkillBySlug, getRelatedSkills, getAllSkills } from "@/lib/skills";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAllSkills().map((skill) => ({ slug: skill.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);
  if (!skill) return {};
  return {
    title: `${skill.nameZh} (${skill.name})`,
    description: skill.descriptionZh || skill.description,
    keywords: skill.tags,
    openGraph: {
      title: `${skill.nameZh} - UniSkill`,
      description: skill.descriptionZh || skill.description,
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

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);
  if (!skill) notFound();

  const related = getRelatedSkills(skill);
  const primaryCategory = Array.isArray(skill.category) ? skill.category[0] : skill.category;
  const feat = featureIcons[primaryCategory] || featureIcons.formatting;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: skill.nameZh || skill.name,
    description: skill.descriptionZh || skill.description,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
    softwareVersion: skill.version,
    datePublished: skill.createdAt,
  };

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <Link href="/schools" className="hover:text-primary transition-colors">
          Skills
        </Link>
        <Icon name="chevron_right" className="text-sm" />
        <span className="text-on-surface font-medium">{skill.name}</span>
      </nav>

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
        {/* Left */}
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
              Active
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2">
            {skill.name}
          </h1>
          <p className="text-2xl font-medium text-on-surface-variant mb-8">
            {skill.nameZh}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <CopyButton text={skill.installCommand} label="复制安装命令" />
            <DownloadButton downloadPath={skill.downloadPath} />
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-6 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Icon name="verified" className="text-base text-secondary" />
              Verified Script
            </span>
          </div>
        </div>

        {/* Right - Preview */}
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
                <span className="text-inverse-primary">$</span> claude skill install \{"\n"}
                {"  "}{skill.slug}{"\n"}
                {"\n"}
                <span className="text-secondary-fixed">✓</span> Skill installed successfully{"\n"}
                <span className="text-secondary-fixed">✓</span> Ready to use
              </code>
            </pre>
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <span className="text-[10px] font-mono uppercase opacity-60">
                System Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="mb-20">
        <h2 className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-8">
          功能说明 / Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`flex gap-4 p-6 bg-surface-container-low rounded-xl border-l-4 ${feat.color}`}>
            <Icon name={feat.icon} className="text-3xl text-primary" />
            <div>
              <h3 className="font-bold mb-1">{skill.name}</h3>
              <p className="text-sm text-on-surface-variant">{skill.description}</p>
            </div>
          </div>
          <div className="flex gap-4 p-6 bg-surface-container-low rounded-xl border-l-4 border-secondary">
            <Icon name="auto_awesome" className="text-3xl text-secondary" />
            <div>
              <h3 className="font-bold mb-1">AI 驱动</h3>
              <p className="text-sm text-on-surface-variant">
                基于 Claude Code SKILL.md 格式，智能处理你的学术任务
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Usage */}
      <section className="mb-20">
        <h2 className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-8">
          使用教程 / Usage Tutorial
        </h2>
        <div className="space-y-4">
          {[
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
          ].map((step) => (
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

      {/* Ad */}
      <section className="mb-20">
        <AdSlot format="horizontal" />
      </section>

      {/* Metadata sidebar */}
      <section className="mb-20">
        <div className="bg-surface-container rounded-xl p-6 max-w-md">
          <h3 className="text-xs font-black uppercase text-on-surface-variant mb-4">
            Skill Info
          </h3>
          {[
            ["Type", "CLI Tool"],
            ["License", "MIT"],
            ["Category", Array.isArray(skill.category) ? skill.category.join(", ") : skill.category],
            ["Schools", skill.schools.join(", ").toUpperCase()],
            ["Created", skill.createdAt],
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

      {/* Related Skills */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-8">
            相关推荐 / Related Skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {related.map((s) => (
              <SkillCard key={s.slug} skill={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
