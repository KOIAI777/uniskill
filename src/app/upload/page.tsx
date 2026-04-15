import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { UploadSkillForm } from "@/components/community/upload-skill-form";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllCategories } from "@/lib/skills";
import { getManagedSchools } from "@/lib/managed-schools";

export const metadata: Metadata = {
  title: "上传 Skill",
  description: "登录后提交你的 Skill zip，进入管理员审核并上线到社区列表。",
};

export default async function UploadPage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <SupabaseSetupNotice />
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/login?next=/upload");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const canPublishOfficial = (profileData as { role?: string } | null)?.role === "admin";

  const schools = await getManagedSchools();
  const categories = getAllCategories();

  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
              {canPublishOfficial ? "Featured / Community Upload" : "Community Upload"}
            </p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
              提交你的
              <br />
              {canPublishOfficial ? "Skill 内容" : "社区 Skill"}
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              {canPublishOfficial
                ? "管理员可以在这里直接发布精选 Skill，也可以按原流程投稿社区 Skill。上传 zip 后，系统会先自动读取 SKILL.md 并预填元数据。"
                : "上传 zip 后系统会自动读取 SKILL.md，帮你预填元数据。确认后提交，管理员审核通过后会自动上线到社区 Skill 列表，并开启评论区。"}
            </p>
          </div>

          <div className="space-y-4">
            {[
              ["upload_file", "上传 zip", "先提交 Skill 压缩包和说明信息。"],
              [
                "rule",
                canPublishOfficial ? "发布方式" : "自动识别 + 审核",
                canPublishOfficial
                  ? "管理员可直接发布精选 Skill；系统也会先从 SKILL.md 自动读取主要字段。"
                  : "先自动识别 SKILL.md，再由你确认并提交。通过后公开展示；不通过会留下审核备注。",
              ],
              ["forum", "自动接评论", "上线后的 Skill 会复用现有评论系统。"],
            ].map(([icon, title, desc]) => (
              <div
                key={title}
                className="rounded-2xl bg-surface-container-low p-5 flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Icon name={icon} className="text-2xl" filled />
                </div>
                <div>
                  <h2 className="font-bold mb-1">{title}</h2>
                  <p className="text-sm text-on-surface-variant">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-8 md:p-10 shadow-ambient border border-outline-variant/20">
          <UploadSkillForm
            schools={schools}
            categories={categories}
            canPublishOfficial={canPublishOfficial}
          />
        </div>
      </div>
    </section>
  );
}
