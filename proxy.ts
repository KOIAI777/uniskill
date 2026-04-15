import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import {
  buildLocalizedPath,
  defaultLocale,
  detectPreferredLocale,
  getLocaleFromPathname,
  isLocale,
  localeCookieName,
  normalizeLocale,
} from "@/i18n/config";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameLocale = getLocaleFromPathname(pathname);

  if (!pathnameLocale) {
    const cookieLocale = request.cookies.get(localeCookieName)?.value;
    const locale = isLocale(cookieLocale)
      ? cookieLocale
      : detectPreferredLocale(request.headers.get("accept-language")) ||
        defaultLocale;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = buildLocalizedPath(locale, pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const response = await updateSession(request);
  response.cookies.set(localeCookieName, normalizeLocale(pathnameLocale), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt|zip)$).*)",
  ],
};
