import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { CompactSkillCard } from "@/components/skill/skill-card";
import { CommunitySkillCard } from "@/components/community/community-skill-card";
import { CommunitySkillFilters } from "@/components/community/community-skill-filters";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  COMMUNITY_SKILLS_PAGE_SIZE,
  mapCommunitySkillRow,
  type CommunitySkillRow,
} from "@/lib/community-skills";
import { getAllCategories } from "@/lib/skills";
import { getManagedSchools } from "@/lib/managed-schools";
import {
  getOfficialSkillsFromDb,
  mapOfficialCommunitySkillToSkill,
} from "@/lib/unified-skills";
import type { Category, Skill } from "@/types";

export const metadata: Metadata = {
  title: "社区",
  description: "统一浏览精选 Skill 与社区 Skill，并按关键词、分类、学校筛选。",
};

function officialSkillMatchesFilter(
  skill: Skill,
  query: string,
  category: string,
  school: string
) {
  const matchQuery =
    !query ||
    skill.name.toLowerCase().includes(query) ||
    skill.nameZh.toLowerCase().includes(query) ||
    skill.description.toLowerCase().includes(query) ||
    skill.descriptionZh.toLowerCase().includes(query) ||
    skill.tags.some((tag) => tag.toLowerCase().includes(query));

  const categories = Array.isArray(skill.category)
    ? skill.category
    : [skill.category];
  const matchCategory = !category || categories.includes(category as Category);

  const matchSchool =
    !school ||
    (school !== "general" &&
      school !== "custom" &&
      skill.schools.includes(school));

  return matchQuery && matchCategory && matchSchool;
}

function sanitizeSearchQuery(value: string) {
  return value.replace(/[%,()]/g, " ").trim();
}

function CommunityPaginationLink({
  q,
  category,
  school,
  page,
  disabled,
  children,
}: {
  q: string;
  category: string;
  school: string;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-semibold text-outline opacity-50">
        {children}
      </span>
    );
  }

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (school) params.set("school", school);
  params.set("page", String(page));

  return (
    <Link
      href={`/community?${params.toString()}`}
      className="px-3 py-2 rounded-lg border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
    >
      {children}
    </Link>
  );
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    school?: string;
    page?: string;
  }>;
}) {
  const { q = "", category = "", school = "", page: pageParam = "1" } =
    await searchParams;
  const query = q.trim().toLowerCase();
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1);

  const dbOfficialSkills = await getOfficialSkillsFromDb();
  const officialSkills = dbOfficialSkills.map(mapOfficialCommunitySkillToSkill);
  const filteredOfficialSkills = officialSkills.filter((skill) =>
    officialSkillMatchesFilter(skill, query, category, school)
  );
  const featuredSkills = filteredOfficialSkills.slice(0, 6);

  let communitySkills = [] as ReturnType<typeof mapCommunitySkillRow>[];
  let totalCommunityCount = 0;
  let filteredCommunityCount = 0;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();

    const { count: allCount } = await supabase
      .from("community_skills")
      .select("id", { count: "exact", head: true })
      .eq("source_type", "community")
      .eq("status", "approved");
    totalCommunityCount = allCount ?? 0;

    let communityQuery = supabase
      .from("community_skills")
      .select(
        "id, slug, source_type, author_id, author_name, author_email, name, name_zh, description, description_zh, category, school_slug, custom_school_name, tags, github_url, version, file_path, original_file_name, file_size, status, review_note, reviewed_at, reviewed_by, created_at, updated_at",
        { count: "exact" }
      )
      .eq("source_type", "community")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (category) {
      communityQuery = communityQuery.eq("category", category as Category);
    }

    if (school === "general") {
      communityQuery = communityQuery
        .is("school_slug", null)
        .is("custom_school_name", null);
    } else if (school === "custom") {
      communityQuery = communityQuery.not("custom_school_name", "is", null);
    } else if (school) {
      communityQuery = communityQuery.eq("school_slug", school);
    }

    const safeQuery = sanitizeSearchQuery(query);
    if (safeQuery) {
      communityQuery = communityQuery.or(
        [
          `name.ilike.%${safeQuery}%`,
          `name_zh.ilike.%${safeQuery}%`,
          `description.ilike.%${safeQuery}%`,
          `description_zh.ilike.%${safeQuery}%`,
        ].join(",")
      );
    }

    const from = (page - 1) * COMMUNITY_SKILLS_PAGE_SIZE;
    const to = from + COMMUNITY_SKILLS_PAGE_SIZE - 1;

    const { data, count } = await communityQuery.range(from, to);
    filteredCommunityCount = count ?? 0;
    communitySkills = ((data ?? []) as CommunitySkillRow[]).map(
      mapCommunitySkillRow
    );
  }

  const categories = getAllCategories();
  const schools = await getManagedSchools();
  const totalCount = officialSkills.length + totalCommunityCount;
  const matchedCount =
    filteredOfficialSkills.length + filteredCommunityCount;
  const displayedCount = featuredSkills.length + communitySkills.length;
  const communityTotalPages = Math.max(
    1,
    Math.ceil(filteredCommunityCount / COMMUNITY_SKILLS_PAGE_SIZE)
  );

  return (
    <>
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
              社区
            </p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">社区</h1>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              这里展示平台精选 Skill，以及通过审核的社区 Skill。你可以统一搜索、筛选、下载和评论。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-on-primary font-bold"
            >
              <Icon name="upload_file" className="text-lg" />
              提交我的 Skill
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold hover:border-primary hover:text-primary transition-colors"
            >
              <Icon name="account_circle" className="text-lg" />
              查看我的投稿
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <CommunitySkillFilters
            categories={categories}
            schools={schools}
            counts={{
              displayed: displayedCount,
              matched: matchedCount,
              total: totalCount,
            }}
          />

          {featuredSkills.length > 0 || communitySkills.length > 0 ? (
            <div className="space-y-14">
              {featuredSkills.length > 0 && (
                <section>
                  <div className="flex items-end justify-between gap-4 mb-8">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                        Featured Collection
                      </p>
                      <h2 className="text-3xl font-black tracking-tight mb-2">
                        精选 Skill
                      </h2>
                      <p className="text-on-surface-variant">
                        平台精选与维护的 Skill，适合稳定使用和长期参考。
                      </p>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {filteredOfficialSkills.length} 个精选 Skill
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    {featuredSkills.map((skill) => (
                      <div key={skill.slug} className="relative">
                        <div className="pointer-events-none absolute -top-2 left-3 z-10 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-on-primary shadow-sm">
                          精选
                        </div>
                        <CompactSkillCard skill={skill} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {communitySkills.length > 0 && (
                <section>
                  <div className="flex items-end justify-between gap-4 mb-8">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                        Community Collection
                      </p>
                      <h2 className="text-3xl font-black tracking-tight mb-2">
                        社区 Skill
                      </h2>
                      <p className="text-on-surface-variant">
                        社区贡献者投稿并通过审核的 Skill，覆盖更多细分场景与学校需求。
                      </p>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-bold">
                      {filteredCommunityCount} 个社区 Skill
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {communitySkills.map((skill) => (
                      <CommunitySkillCard key={skill.id} skill={skill} />
                    ))}
                  </div>

                  {communityTotalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
                      <p className="text-xs text-on-surface-variant">
                        社区 Skill 第 {page} / {communityTotalPages} 页，共{" "}
                        {filteredCommunityCount} 个结果
                      </p>
                      <div className="flex items-center gap-2">
                        <CommunityPaginationLink
                          q={q}
                          category={category}
                          school={school}
                          page={page - 1}
                          disabled={page <= 1}
                        >
                          上一页
                        </CommunityPaginationLink>
                        <CommunityPaginationLink
                          q={q}
                          category={category}
                          school={school}
                          page={page + 1}
                          disabled={page >= communityTotalPages}
                        >
                          下一页
                        </CommunityPaginationLink>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          ) : (
            <div className="rounded-3xl bg-surface-container-low p-12 text-center">
              <Icon
                name="inventory_2"
                className="text-6xl text-outline-variant mb-4 block"
              />
              <h2 className="text-2xl font-black mb-3">没有匹配的 Skill</h2>
              <p className="text-on-surface-variant mb-6">
                当前筛选条件下没有找到结果。你可以清空筛选后重试，或者投稿新的社区 Skill。
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-on-primary font-bold"
              >
                <Icon name="upload_file" className="text-lg" />
                去投稿
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
