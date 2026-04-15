import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { CompactSkillCard } from "@/components/skill/skill-card";
import { SearchBar, type SearchBarSkill } from "@/components/skill/search-bar";
import { AdSlot } from "@/components/layout/ad-slot";
import { getFeaturedSkills, getAllCategories, getAllSkills } from "@/lib/skills";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapCommunitySkillRow, type CommunitySkillRow } from "@/lib/community-skills";
import { getManagedSchools } from "@/lib/managed-schools";
import { getOfficialSkillsFromDb, mapOfficialCommunitySkillToSkill } from "@/lib/unified-skills";

export default async function HomePage() {
  const dbOfficialSkills = await getOfficialSkillsFromDb();
  const officialSkills =
    dbOfficialSkills.length > 0
      ? dbOfficialSkills.map(mapOfficialCommunitySkillToSkill)
      : getAllSkills();
  let approvedCommunitySkills = [] as ReturnType<typeof mapCommunitySkillRow>[];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("community_skills")
      .select(
        "id, slug, source_type, author_id, author_name, author_email, name, name_zh, description, description_zh, category, school_slug, custom_school_name, tags, github_url, version, install_command, downloads, featured, is_verified, published_at, file_path, original_file_name, file_size, status, review_note, reviewed_at, reviewed_by, created_at, updated_at"
      )
      .eq("source_type", "community")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    approvedCommunitySkills = ((data ?? []) as CommunitySkillRow[]).map(
      mapCommunitySkillRow
    );
  }

  const searchSkills: SearchBarSkill[] = [
    ...officialSkills.map((skill) => ({
      slug: skill.slug,
      name: skill.name,
      nameZh: skill.nameZh,
      description: skill.description,
      descriptionZh: skill.descriptionZh,
      category: skill.category,
      tags: skill.tags,
      version: skill.version,
      href: `/skills/${skill.slug}`,
      sourceLabel: "精选",
    })),
    ...approvedCommunitySkills.map((skill) => ({
      slug: skill.slug,
      name: skill.name,
      nameZh: skill.nameZh,
      description: skill.description,
      descriptionZh: skill.descriptionZh,
      category: skill.category,
      tags: skill.tags,
      version: skill.version,
      href: `/community/${skill.slug}`,
      sourceLabel: "社区",
    })),
  ];
  const featuredSkills =
    dbOfficialSkills.length > 0
      ? officialSkills
      : getFeaturedSkills();
  const homeFeaturedSkills = featuredSkills.slice(0, 6);
  const categories = getAllCategories();
  const schools = await getManagedSchools();

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 py-24 md:py-32">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <h1 className="animate-fade-up text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
              你的学术 AI 工具箱
              <br />
              <span className="text-gradient">
                (Your Academic AI Toolbox)
              </span>
            </h1>
            <p className="animate-fade-up-1 text-xl md:text-2xl text-on-surface-variant mb-12 font-medium leading-relaxed">
              为 BNBU 学生定制的免费 Skill。无需登录，下载即用。
              <br />
              <span className="text-base opacity-70">
                (Free Skills for BNBU students. No login, download and use.)
              </span>
            </p>

            {/* Search Bar */}
            <div className="animate-fade-up-2">
              <SearchBar skills={searchSkills} />
            </div>

            {/* School Labels */}
            <div className="animate-fade-up-3 mt-8 flex flex-wrap items-center gap-3 relative z-0">
              <span className="text-sm font-bold uppercase tracking-wider text-outline mb-1 w-full md:w-auto md:mr-4">
                Target Schools:
              </span>
              {schools.map((school) => (
                <Link
                  key={school.slug}
                  href={`/schools/${school.slug}`}
                  className="px-5 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all"
                >
                  {school.name}
                </Link>
              ))}
              <span className="px-5 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium cursor-not-allowed">
                More schools coming soon...
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Submit notice */}
      <section className="animate-fade-up-4 px-6 py-4 bg-primary/5 border-y border-primary/10 relative z-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <Icon name="volunteer_activism" className="text-primary" />
          <p className="text-on-surface-variant font-medium">
            Have a skill to share? Submit your tools to{" "}
            <Link
              className="text-primary font-bold hover:underline"
              href="/upload"
            >
              /upload
            </Link>
          </p>
        </div>
      </section>

      {/* Featured Skills */}
      <section className="px-6 py-16 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                精选工具 (Featured Skills)
              </h2>
              <p className="text-on-surface-variant mt-2">
                最受学生欢迎的学术辅助工具
              </p>
            </div>
            {homeFeaturedSkills.length > 0 && (
              <Link
                href="/community"
                className="text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              >
                View All{" "}
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
            )}
          </div>
          {homeFeaturedSkills.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {homeFeaturedSkills.map((skill) => (
                <CompactSkillCard key={skill.slug} skill={skill} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-surface-container-lowest rounded-2xl">
              <Icon name="construction" className="text-6xl text-outline-variant mb-4 block" />
              <h3 className="text-xl font-bold mb-2">
                Skills 正在建设中...
              </h3>
              <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
                我们正在为 BNBU 学生打造专属的 AI 学术工具。
                <br />
                想成为第一个贡献者吗？
              </p>
              <a
                href="mailto:1146850129@qq.com?subject=Skill%20提交"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-on-primary font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Icon name="mail" className="text-lg" />
                提交你的第一个 Skill
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Ad */}
      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <AdSlot format="horizontal" />
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight">
              分类浏览 (Categories)
            </h2>
            <p className="text-on-surface-variant mt-3 max-w-lg mx-auto">
              快速找到您需要的学术技能场景
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/community?category=${cat.slug}`}
                className="group p-8 rounded-xl bg-surface-container-low text-center transition-all hover:bg-primary hover:text-on-primary flex flex-col items-center"
              >
                <span
                  className="material-symbols-outlined text-4xl mb-4 group-hover:scale-110 transition-transform"
                >
                  {cat.icon}
                </span>
                <span className="text-sm font-bold leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
