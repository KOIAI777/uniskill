"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import {
  buildLocalizedPath,
  defaultLocale,
  getLocaleFromPathname,
  type AppLocale,
} from "@/i18n/config";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = getLocaleFromPathname(pathname) ?? defaultLocale;
  const dict = getDictionary(locale);

  const changeLanguage = (nextLocale: AppLocale) => {
    const nextPath = buildLocalizedPath(nextLocale, pathname || "/");
    const query = searchParams.toString();
    router.push(query ? `${nextPath}?${query}` : nextPath);
    router.refresh();
  };

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-surface-container-low px-1 py-1 shadow-sm"
      aria-label={dict.language.label}
    >
      {(["zh", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => changeLanguage(option)}
          className={`rounded-full px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs font-bold transition-colors ${
            locale === option
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface hover:text-on-surface"
          }`}
        >
          {dict.language[option]}
        </button>
      ))}
    </div>
  );
}
