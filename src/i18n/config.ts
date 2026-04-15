export const locales = ["zh", "en"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "zh";
export const localeCookieName = "uniskill-locale";

export function isLocale(value: string | null | undefined): value is AppLocale {
  return value === "zh" || value === "en";
}

function matchSupportedLocale(
  value: string | null | undefined
): AppLocale | null {
  if (!value) {
    return null;
  }

  const lower = value.toLowerCase();

  if (lower.startsWith("en")) {
    return "en";
  }

  if (lower.startsWith("zh")) {
    return "zh";
  }

  return null;
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  return matchSupportedLocale(value) ?? defaultLocale;
}

export function localeToHtmlLang(locale: AppLocale) {
  return locale === "en" ? "en" : "zh-CN";
}

export function getLocaleFromPathname(pathname: string) {
  const [, maybeLocale] = pathname.split("/");
  return isLocale(maybeLocale) ? maybeLocale : null;
}

export function stripLocaleFromPathname(pathname: string) {
  const locale = getLocaleFromPathname(pathname);

  if (!locale) {
    return pathname || "/";
  }

  const nextPath = pathname.slice(locale.length + 1);
  return nextPath.startsWith("/") ? nextPath : nextPath ? `/${nextPath}` : "/";
}

export function isExternalHref(href: string) {
  return /^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith("mailto:");
}

export function buildLocalizedPath(locale: AppLocale, href: string) {
  if (!href || isExternalHref(href) || href.startsWith("#")) {
    return href;
  }

  const [pathWithQuery, hash = ""] = href.split("#");
  const [pathname = "/", search = ""] = pathWithQuery.split("?");
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const strippedPath = stripLocaleFromPathname(normalizedPath);
  const localizedPath = strippedPath === "/" ? `/${locale}` : `/${locale}${strippedPath}`;
  const querySuffix = search ? `?${search}` : "";
  const hashSuffix = hash ? `#${hash}` : "";

  return `${localizedPath}${querySuffix}${hashSuffix}`;
}

export function detectPreferredLocale(acceptLanguage: string | null) {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const parts = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0])
    .filter(Boolean);

  for (const part of parts) {
    const locale = matchSupportedLocale(part);
    if (locale) {
      return locale;
    }
  }

  return defaultLocale;
}
