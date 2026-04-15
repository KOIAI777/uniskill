import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { AuthForm } from "@/components/auth/auth-form";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "登录",
  description: "登录后即可评论 Skill、管理你的账号，并为后续上传功能做准备。",
};

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();

    if (claimsData?.claims) {
      redirect("/account");
    }
  }

  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">
            Community Access
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-[1.05]">
            登录后参与
            <br />
            <span className="text-gradient">评论与投稿</span>
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl mb-8">
            登录后可以发表评论、提交社区 Skill、查看审核状态，并管理自己的内容记录。
          </p>

          <div className="space-y-4">
            {[
              {
                icon: "forum",
                title: "发表评论",
                desc: "登录后对精选 Skill 和社区 Skill 留言。",
              },
              {
                icon: "upload_file",
                title: "上传 Skill",
                desc: "登录后即可提交社区 Skill，进入管理员审核。",
              },
              {
                icon: "shield_lock",
                title: "安全验证",
                desc: "登录和注册都需要完成人机验证，以减少滥用和垃圾账号。",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-5 rounded-2xl bg-surface-container-low">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name={item.icon} className="text-2xl text-primary" filled />
                </div>
                <div>
                  <h2 className="font-bold mb-1">{item.title}</h2>
                  <p className="text-sm text-on-surface-variant">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isSupabaseConfigured() ? <AuthForm /> : <SupabaseSetupNotice />}
      </div>
    </section>
  );
}
