import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { SkillCard } from "@/components/skill/skill-card";
import {
  getSchoolBySlug,
  getSkillsBySchool,
  getAllSchools,
} from "@/lib/skills";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAllSchools().map((school) => ({ school: school.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ school: string }>;
}): Promise<Metadata> {
  const { school: schoolSlug } = await params;
  const school = getSchoolBySlug(schoolSlug);
  if (!school) return {};
  const skills = getSkillsBySchool(schoolSlug);
  return {
    title: `${school.name} Skills`,
    description: `${school.name} 的 ${skills.length} 个可用 AI 学术工具，免费下载即用。`,
    openGraph: {
      title: `${school.name} Skills - UniSkill`,
      description: `浏览 ${school.name} 的 AI 学术 Skills`,
    },
  };
}

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ school: string }>;
}) {
  const { school: schoolSlug } = await params;
  const school = getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const skills = getSkillsBySchool(schoolSlug);

  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Icon name="chevron_right" className="text-sm" />
            <Link href="/schools" className="hover:text-primary transition-colors">
              Schools
            </Link>
            <Icon name="chevron_right" className="text-sm" />
            <span className="text-on-surface font-medium">{school.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-4">
                {school.name}
              </h1>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-primary-fixed-dim text-on-primary-fixed text-xs font-bold rounded-full">
                  {skills.length} Available Skills
                </span>
                <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs font-bold rounded-full">
                  {school.nameZh}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Filter bar */}
          <div className="flex items-center justify-between py-4 bg-surface-container-low rounded-2xl px-6 mb-10">
            <div className="flex gap-8 overflow-x-auto">
              <span className="text-sm text-primary font-bold whitespace-nowrap">
                All Skills (所有)
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-on-surface-variant">
              <span>Sort by:</span>
              <span className="font-bold text-on-surface">Most Popular</span>
            </div>
          </div>

          {skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {skills.map((skill) => (
                <SkillCard key={skill.slug} skill={skill} />
              ))}

              {/* Promotional card */}
              <div className="relative overflow-hidden rounded-xl bg-primary p-8 text-on-primary flex flex-col justify-between">
                <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary-container/30 rounded-full blur-3xl" />
                <div className="relative">
                  <h3 className="text-3xl font-black mb-4">
                    Master Every Skill.
                  </h3>
                  <p className="text-sm opacity-90 mb-6">
                    探索 {school.name} 的所有可用 AI 学术工具，提升你的学习效率。
                  </p>
                  <Link
                    href="/contribute"
                    className="block w-full py-3 bg-white text-primary text-center font-bold rounded-lg hover:bg-white/90 transition-colors"
                  >
                    投稿 Skill
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <Icon name="school" className="text-7xl text-outline-variant mb-6 block" />
              <h3 className="text-2xl font-black mb-3">
                {school.name} 暂无可用 Skill
              </h3>
              <p className="text-on-surface-variant mb-8 max-w-lg mx-auto leading-relaxed">
                我们正在为 {school.name} 的学生开发专属 AI 学术工具。
                <br />
                如果你有好的 Skill 创意，欢迎提交！
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={`mailto:1146850129@qq.com?subject=Skill%20提交%20-%20${school.name}`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-on-primary font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <Icon name="mail" className="text-lg" />
                  邮件提交 Skill
                </a>
                <Link
                  href="/contribute"
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-outline-variant text-on-surface-variant font-bold rounded-xl hover:border-primary hover:text-primary transition-all"
                >
                  <Icon name="help" className="text-lg" />
                  查看投稿指南
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
