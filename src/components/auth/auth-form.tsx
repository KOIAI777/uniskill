"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirectPath } from "@/lib/supabase/redirect";
import { buildLocalizedPath, type AppLocale } from "@/i18n/config";

type Mode = "sign-in" | "sign-up";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function AuthForm({
  locale = "zh",
}: {
  locale?: AppLocale;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEn = locale === "en";
  const [mode, setMode] = useState<Mode>("sign-in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const nextPath = useMemo(
    () => buildLocalizedPath(locale, sanitizeRedirectPath(searchParams.get("next"))),
    [locale, searchParams]
  );

  const handleCaptchaTokenChange = useCallback((token: string | null) => {
    setCaptchaToken(token);
    if (token) {
      setError(null);
    }
  }, []);

  const handleCaptchaError = useCallback((message: string | null) => {
    if (message) {
      setError(message);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();

      if (!TURNSTILE_SITE_KEY) {
        setError(
          isEn
            ? "Turnstile is not configured yet. Please try again later."
            : "当前的人机验证还未配置完成，请稍后再试。"
        );
        return;
      }

      if (!captchaToken) {
        setError(
          isEn
            ? "Please complete the Turnstile challenge first."
            : "请先完成 Turnstile 人机验证。"
        );
        return;
      }

      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken,
          },
        });

        if (signInError) {
          setError(signInError.message);
          setCaptchaToken(null);
          setCaptchaResetKey((current) => current + 1);
          return;
        }

        router.push(nextPath);
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken,
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`,
          data: {
            display_name: displayName.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setCaptchaToken(null);
        setCaptchaResetKey((current) => current + 1);
        return;
      }

      if (data.session) {
        router.push(nextPath);
        router.refresh();
        return;
      }

      setNotice(
        isEn
          ? "Sign-up succeeded. Please confirm your email to finish signing in."
          : "注册成功，请去邮箱点击确认链接完成登录。"
      );
      setCaptchaToken(null);
      setCaptchaResetKey((current) => current + 1);
      setMode("sign-in");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-ambient overflow-hidden">
      <div className="grid grid-cols-2 bg-surface-container-low border-b border-outline-variant/20">
        <button
          type="button"
          onClick={() => {
            setMode("sign-in");
            setError(null);
            setNotice(null);
            setCaptchaToken(null);
          }}
          className={`px-6 py-4 text-sm font-bold transition-colors ${
            mode === "sign-in"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {isEn ? "Sign in" : "登录"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("sign-up");
            setError(null);
            setNotice(null);
            setCaptchaToken(null);
            setCaptchaResetKey((current) => current + 1);
          }}
          className={`px-6 py-4 text-sm font-bold transition-colors ${
            mode === "sign-up"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {isEn ? "Sign up" : "注册"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
            {mode === "sign-in" ? "Welcome back" : "Create account"}
          </p>
          <h2 className="text-3xl font-black tracking-tight">
            {mode === "sign-in"
              ? isEn
                ? "Sign in to comment and upload Skills"
                : "登录后可评论和上传 Skill"
              : isEn
                ? "Create an account to unlock community features"
                : "先注册，再开放社区功能"}
          </h2>
        </div>

        {mode === "sign-up" && (
          <label className="block">
            <span className="block text-sm font-semibold mb-2">
              {isEn ? "Display name" : "显示名称"}
            </span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={isEn ? "For example: Koi" : "例如：Koi"}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:border-primary"
            />
          </label>
        )}

        <label className="block">
          <span className="block text-sm font-semibold mb-2">
            {isEn ? "Email" : "邮箱"}
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-semibold mb-2">
            {isEn ? "Password" : "密码"}
          </span>
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isEn ? "At least 6 characters" : "至少 6 位"}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:border-primary"
          />
        </label>

        <div className="space-y-2">
          <span className="block text-sm font-semibold">
            {isEn ? "Verification" : "人机验证"}
          </span>
          <TurnstileWidget
            resetKey={captchaResetKey}
            onTokenChange={handleCaptchaTokenChange}
            onError={handleCaptchaError}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm text-secondary">
            {notice}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-primary text-on-primary font-bold shadow-lg shadow-primary/20 disabled:opacity-70"
        >
          <Icon
            name={pending ? "hourglass_top" : mode === "sign-in" ? "login" : "person_add"}
            className="text-lg"
          />
          {pending
            ? isEn
              ? "Processing..."
              : "处理中..."
            : mode === "sign-in"
              ? isEn
                ? "Sign in"
                : "登录"
              : isEn
                ? "Sign up and send confirmation email"
                : "注册并发送确认邮件"}
        </button>
        {mode === "sign-up" && (
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {isEn
              ? "After signing up, confirm your account from the email we send you."
              : "注册后请到邮箱完成确认。"}
          </p>
        )}
      </form>
    </div>
  );
}
