import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { SkillCard } from "@/components/skill/skill-card";
import {
  getCategoryBySlug,
  getSkillsByCategory,
  getAllCategories,
} from "@/lib/skills";
import type { Category } from "@/types";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAllCategories().map((cat) => ({ type: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const category = getCategoryBySlug(type);
  if (!category) return {};
  return {
    title: `${category.name} Skills`,
    description: `浏览 ${category.name} 类别的 AI 学术工具，免费下载即用。`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const category = getCategoryBySlug(type);
  if (!category) notFound();

  const skills = getSkillsByCategory(type as Category);

  return (
    <>
      <section className="pt-32 pb-16 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Icon name="chevron_right" className="text-sm" />
            <span className="text-on-surface font-medium">{category.name}</span>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon name={category.icon} className="text-4xl text-primary" filled />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tight">
                {category.name}
              </h1>
              <p className="text-xl text-on-surface-variant">{category.nameZh}</p>
            </div>
          </div>
          <p className="text-on-surface-variant max-w-2xl">
            {category.description}
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {skills.map((skill) => (
                <SkillCard key={skill.slug} skill={skill} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Icon
                name={category.icon}
                className="text-6xl text-outline-variant mb-4"
              />
              <p className="text-lg text-on-surface-variant">
                该分类暂无 Skill，敬请期待
              </p>
              <Link
                href="/contribute"
                className="inline-block mt-4 px-6 py-3 bg-gradient-primary text-on-primary font-bold rounded-xl"
              >
                提交 Skill
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
