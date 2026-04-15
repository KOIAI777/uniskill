"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function TurnstileWidget({
  resetKey,
  onTokenChange,
  onError,
}: {
  resetKey: number;
  onTokenChange: (token: string | null) => void;
  onError: (message: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && !!window.turnstile
  );

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !scriptReady || !containerRef.current) {
      return;
    }

    if (widgetIdRef.current) {
      window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    onTokenChange(null);
    onError(null);

    widgetIdRef.current = window.turnstile?.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => {
        onTokenChange(token);
        onError(null);
      },
      "expired-callback": () => {
        onTokenChange(null);
        onError("验证已过期，请重新完成 Turnstile 验证。");
      },
      "error-callback": () => {
        onTokenChange(null);
        onError("Turnstile 验证失败，请刷新后重试。");
      },
    }) ?? null;

    return () => {
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onError, onTokenChange, resetKey, scriptReady]);

  if (!TURNSTILE_SITE_KEY) {
    return (
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
        人机验证还未配置完成。请先设置
        <code className="mx-1 font-mono text-xs">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>
        并在后台启用 CAPTCHA。
      </div>
    );
  }

  return (
    <>
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div
        ref={containerRef}
        className="min-h-[65px] flex items-center"
        aria-live="polite"
      />
    </>
  );
}
