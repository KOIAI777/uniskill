import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { AppLocale } from "@/i18n/config";

export function SupabaseSetupNotice({
  locale = "zh",
}: {
  locale?: AppLocale;
}) {
  const isEn = locale === "en";

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-8 shadow-ambient">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name="construction" className="text-2xl text-primary" filled />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            {isEn
              ? "Authentication is not configured yet"
              : "登录系统尚未完成配置"}
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-4">
            {isEn
              ? "This environment has not finished setting up the account system yet. Once configured, login, comments, and submissions will become available here."
              : "当前环境还没完成账号系统配置。完成配置后，这里会开放登录、评论和投稿流程。"}
          </p>
          <p className="text-sm text-on-surface-variant mb-4">
            {isEn
              ? "For local development, add these variables first:"
              : "开发环境需要先补齐这些变量："}
            <code className="mx-1 px-2 py-1 rounded bg-surface-container font-mono text-xs">
              NEXT_PUBLIC_SUPABASE_URL
            </code>
            {isEn ? "and" : "和"}
            <code className="mx-1 px-2 py-1 rounded bg-surface-container font-mono text-xs">
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            </code>
          </p>
          <Link
            href="https://supabase.com/docs/guides/auth/server-side/nextjs"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {isEn ? "View setup guide" : "查看开发配置文档"}
            <Icon name="open_in_new" className="text-sm" />
          </Link>
        </div>
      </div>
    </div>
  );
}
