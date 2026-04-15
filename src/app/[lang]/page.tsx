import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { CompactSkillCard } from "@/components/skill/skill-card";
import { SearchBar, type SearchBarSkill } from "@/components/skill/search-bar";
import { AdSlot } from "@/components/layout/ad-slot";
import { getFeaturedSkills, getAllCategories, getAllSkills } from "@/lib/skills";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  mapCommunitySkillRow,
  type CommunitySkillRow,
} from "@/lib/community-skills";
import { getManagedSchools } from "@/lib/managed-schools";
import {
  getOfficialSkillsFromDb,
  mapOfficialCommunitySkillToSkill,
} from "@/lib/unified-skills";
import { buildLocalizedPath, isLocale, type AppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) {
    return {};
  }

  const dict = getDictionary(lang);

  return {
    title: dict.metadata.defaultTitle,
    description: dict.metadata.description,
  };
}

function getSkillSearchHref(locale: AppLocale, path: string) {
  return buildLocalizedPath(locale, path);
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const dict = getDictionary(lang);
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
      href: getSkillSearchHref(lang, `/skills/${skill.slug}`),
      sourceLabel: dict.search.featured,
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
      href: getSkillSearchHref(lang, `/community/${skill.slug}`),
      sourceLabel: dict.search.community,
    })),
  ];
  const featuredSkills = dbOfficialSkills.length > 0 ? officialSkills : getFeaturedSkills();
  const homeFeaturedSkills = featuredSkills.slice(0, 6);
  const categories = getAllCategories();
  const schools = await getManagedSchools();

  return (
    <>
      <section className="relative px-6 py-24 md:py-32">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <h1 className="animate-fade-up text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
              {dict.home.heroTitle}
            </h1>
            <p className="animate-fade-up-1 text-xl md:text-2xl text-on-surface-variant mb-12 font-medium leading-relaxed">
              {dict.home.heroSubtitle}
            </p>

            <div className="animate-fade-up-2">
              <SearchBar
                skills={searchSkills}
                messages={{
                  placeholder: dict.search.placeholder,
                  noResults: dict.search.noResults,
                  moreResults: dict.search.moreResults,
                }}
              />
            </div>

            <div className="animate-fade-up-3 mt-8 flex flex-wrap items-center gap-3 relative z-0">
              <span className="text-sm font-bold uppercase tracking-wider text-outline mb-1 w-full md:w-auto md:mr-4">
                {dict.home.targetSchools}:
              </span>
              {schools.map((school) => (
                <Link
                  key={school.slug}
                  href={buildLocalizedPath(lang, `/schools/${school.slug}`)}
                  className="px-5 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all"
                >
                  {lang === "en" ? school.name : school.nameZh}
                </Link>
              ))}
              <span className="px-5 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium cursor-not-allowed">
                {dict.home.moreSchools}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-fade-up-4 px-6 py-4 bg-primary/5 border-y border-primary/10 relative z-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <Icon name="volunteer_activism" className="text-primary" />
          <p className="text-on-surface-variant font-medium">
            {dict.home.submitNotice.split("/upload")[0]}
            <Link
              className="text-primary font-bold hover:underline"
              href={buildLocalizedPath(lang, "/upload")}
            >
              /upload
            </Link>
          </p>
        </div>
      </section>

      <section className="px-6 py-16 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {dict.home.featuredTitle}
              </h2>
              <p className="text-on-surface-variant mt-2">
                {dict.home.featuredDescription}
              </p>
            </div>
            {homeFeaturedSkills.length > 0 && (
              <Link
                href={buildLocalizedPath(lang, "/community")}
                className="text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              >
                {dict.home.viewAll}{" "}
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
            )}
          </div>
          {homeFeaturedSkills.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {homeFeaturedSkills.map((skill) => (
                <CompactSkillCard key={skill.slug} skill={skill} locale={lang} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-surface-container-lowest rounded-2xl">
              <Icon name="construction" className="text-6xl text-outline-variant mb-4 block" />
              <h3 className="text-xl font-bold mb-2">{dict.home.emptyTitle}</h3>
              <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
                {dict.home.emptyDescription}
              </p>
              <a
                href="mailto:1146850129@qq.com?subject=Skill%20%E6%8F%90%E4%BA%A4"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-on-primary font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Icon name="mail" className="text-lg" />
                {dict.home.emptyCta}
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <AdSlot format="horizontal" />
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight">
              {dict.home.categoriesTitle}
            </h2>
            <p className="text-on-surface-variant mt-3 max-w-lg mx-auto">
              {dict.home.categoriesDescription}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={buildLocalizedPath(lang, `/community?category=${cat.slug}`)}
                className="group p-8 rounded-xl bg-surface-container-low text-center transition-all hover:bg-primary hover:text-on-primary flex flex-col items-center"
              >
                <span
                  className="material-symbols-outlined text-4xl mb-4 group-hover:scale-110 transition-transform"
                >
                  {cat.icon}
                </span>
                <span className="text-sm font-bold leading-tight">
                  {lang === "en" ? cat.name : cat.nameZh}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
