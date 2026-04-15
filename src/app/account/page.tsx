import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { AdminCommentsPanel } from "@/components/comments/admin-comments-panel";
import { MyCommentsPanel } from "@/components/comments/my-comments-panel";
import {
  AdminCommunitySkillsPanel,
  AdminFeaturedSkillsPanel,
} from "@/components/community/admin-community-skills-panel";
import { AdminManagedSchoolsPanel } from "@/components/community/admin-managed-schools-panel";
import { MyCommunitySkillsPanel } from "@/components/community/my-community-skills-panel";
import { AdminSchoolManagementPanel } from "@/components/community/admin-school-management-panel";
import {
  COMMENTS_PAGE_SIZE,
  mapCommentRow,
  type CommentRow,
} from "@/lib/comments";
import {
  COMMUNITY_SKILLS_PAGE_SIZE,
  mapCommunitySkillRow,
  type CommunitySkillRow,
} from "@/lib/community-skills";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "我的账号",
  description: "查看当前登录用户信息、我的评论、我的投稿和管理员审核入口。",
};

type ProfileRow = {
  display_name: string | null;
  role: string | null;
  created_at: string | null;
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <SupabaseSetupNotice />
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const { notice } = await searchParams;
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/login?next=/account");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("display_name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData as ProfileRow | null) ?? null;

  const { data: commentsData, count: commentsCount } = await supabase
    .from("comments")
    .select(
      "id, target_kind, target_key, author_id, author_name, content, status, created_at, updated_at",
      { count: "exact" }
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .range(0, COMMENTS_PAGE_SIZE - 1);

  const initialComments = ((commentsData ?? []) as CommentRow[]).map((row) =>
    mapCommentRow(row, {
      currentUserId: user.id,
      viewerRole: profile?.role === "admin" ? "admin" : "user",
    })
  );

  const {
    data: communitySkillsData,
    count: communitySkillsCount,
  } = await supabase
    .from("community_skills")
    .select(
      "id, slug, author_id, author_name, author_email, name, name_zh, description, description_zh, category, school_slug, custom_school_name, tags, github_url, version, file_path, original_file_name, file_size, status, review_note, reviewed_at, reviewed_by, created_at, updated_at",
      { count: "exact" }
    )
    .eq("author_id", user.id)
    .eq("source_type", "community")
    .order("created_at", { ascending: false })
    .range(0, COMMUNITY_SKILLS_PAGE_SIZE - 1);

  const initialCommunitySkills = (
    (communitySkillsData ?? []) as CommunitySkillRow[]
  ).map(mapCommunitySkillRow);

  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {notice === "upload_submitted" && (
          <div className="rounded-2xl border border-secondary/20 bg-secondary/5 px-6 py-4 text-sm text-secondary">
            投稿已成功提交，当前状态为“审核中”。管理员审核通过后，它会自动出现在社区市场。
          </div>
        )}
        {notice === "featured_published" && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4 text-sm text-primary">
            精选 Skill 已直接发布成功。你可以在下方“精选 Skill 管理面板”继续编辑、下线或删除它。
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
              Account Center
            </p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
              你的账号
            </h1>
            <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              在这里查看你的账号资料、评论记录、投稿进度，以及管理员审核结果。
            </p>
          </div>

          <SignOutButton className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-outline-variant/40 text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-8 shadow-ambient border border-outline-variant/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center text-2xl font-black uppercase">
                {(profile?.display_name || user.email || "U").slice(0, 1)}
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">
                  {profile?.display_name || user.user_metadata.display_name || "New User"}
                </h2>
                <p className="text-on-surface-variant">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ["User ID", user.id],
                ["Email", user.email || "-"],
                ["Role", profile?.role || "user"],
                [
                  "Created At",
                  profile?.created_at
                    ? new Date(profile.created_at).toLocaleString("zh-CN")
                    : user.created_at
                      ? new Date(user.created_at).toLocaleString("zh-CN")
                      : "-",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 py-4 border-b border-outline-variant/20"
                >
                  <span className="text-sm font-semibold text-on-surface-variant">
                    {label}
                  </span>
                  <span className="font-mono text-sm break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/20">
              <h2 className="text-lg font-black mb-4">快捷入口</h2>
              <div className="space-y-4">
                {[
                  ["forum", "Skill 评论", "登录后发表评论，并归属到当前用户。"],
                  ["upload_file", "Skill 投稿", "上传 zip、填写元数据，进入审核。"],
                  ["storefront", "社区市场", "浏览已通过审核的精选与社区 Skill。"],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="flex gap-3">
                    <Icon name={icon} className="text-xl text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="text-sm text-on-surface-variant">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-on-primary text-sm font-bold"
                >
                  <Icon name="upload_file" className="text-base" />
                  提交 Skill
                </Link>
                <Link
                  href="/community"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                >
                  <Icon name="storefront" className="text-base" />
                  市场首页
                </Link>
              </div>
            </div>

            <div className="bg-primary text-on-primary rounded-3xl p-6 overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-2">
                  Account
                </p>
                <h2 className="text-2xl font-black mb-3">管理你的社区内容</h2>
                <p className="text-sm opacity-90 leading-relaxed">
                  在这里查看你的评论、投稿记录，以及管理员审核结果。
                </p>
              </div>
            </div>
          </div>
        </div>

        <MyCommunitySkillsPanel
          initialSkills={initialCommunitySkills}
          initialPagination={{
            page: 1,
            pageSize: COMMUNITY_SKILLS_PAGE_SIZE,
            total: communitySkillsCount ?? 0,
            totalPages: Math.max(
              1,
              Math.ceil((communitySkillsCount ?? 0) / COMMUNITY_SKILLS_PAGE_SIZE)
            ),
          }}
        />

        <MyCommentsPanel
          initialComments={initialComments}
          initialPagination={{
            page: 1,
            pageSize: COMMENTS_PAGE_SIZE,
            total: commentsCount ?? 0,
            totalPages: Math.max(
              1,
              Math.ceil((commentsCount ?? 0) / COMMENTS_PAGE_SIZE)
            ),
          }}
        />

        <AdminCommentsPanel enabled={profile?.role === "admin"} />
        <AdminFeaturedSkillsPanel enabled={profile?.role === "admin"} />
        <AdminCommunitySkillsPanel enabled={profile?.role === "admin"} />
        <AdminSchoolManagementPanel enabled={profile?.role === "admin"} />
        <AdminManagedSchoolsPanel enabled={profile?.role === "admin"} />
      </div>
    </section>
  );
}
