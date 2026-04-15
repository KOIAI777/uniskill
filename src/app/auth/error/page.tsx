import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "认证出错",
  description: "处理 Supabase 邮件确认或登录流程时发生错误。",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-2xl mx-auto bg-surface-container-lowest rounded-3xl p-10 border border-outline-variant/20 shadow-ambient text-center">
        <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto mb-6">
          <Icon name="error" className="text-3xl" filled />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4">认证链接无效</h1>
        <p className="text-on-surface-variant leading-relaxed mb-8">
          {message || "这个登录/确认链接可能已经失效，或者当前环境的 Supabase 回调地址还没有配置好。"}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-on-primary font-bold"
          >
            <Icon name="login" className="text-lg" />
            返回登录页
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant/40 text-on-surface-variant font-bold hover:border-primary hover:text-primary transition-colors"
          >
            <Icon name="help" className="text-lg" />
            查看项目说明
          </Link>
        </div>
      </div>
    </section>
  );
}
