"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { buildLocalizedPath, type AppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function AuthNav({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const dict = getDictionary(locale);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setLoading(false);
      router.refresh();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured, router]);

  if (!configured) {
    return (
      <Link
        href={buildLocalizedPath(locale, "/login")}
        className="text-sm text-on-surface-variant hover:text-primary transition-colors"
      >
        {dict.header.authSetup}
      </Link>
    );
  }

  if (loading) {
    return (
      <span className="text-sm text-on-surface-variant animate-pulse">
        {dict.header.loading}
      </span>
    );
  }

  if (!email) {
    return (
      <Link
        href={buildLocalizedPath(locale, "/login")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all"
      >
        <Icon name="login" className="text-base" />
        {dict.header.login}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={buildLocalizedPath(locale, "/account")}
        className="hidden md:flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
      >
        <Icon name="account_circle" className="text-lg" />
        <span className="max-w-40 truncate">{email || dict.header.accountFallback}</span>
      </Link>
      <SignOutButton
        locale={locale}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/40 text-sm font-medium text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
      />
    </div>
  );
}
