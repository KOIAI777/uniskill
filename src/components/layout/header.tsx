"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AuthNav } from "@/components/auth/auth-nav";
import {
  buildLocalizedPath,
  defaultLocale,
  getLocaleFromPathname,
  stripLocaleFromPathname,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const locale = getLocaleFromPathname(pathname) ?? defaultLocale;
  const dict = getDictionary(locale);
  const navLinks = [
    { href: "/", label: dict.header.home },
    { href: "/schools", label: dict.header.schools },
    { href: "/community", label: dict.header.community },
    { href: "/contribute", label: dict.header.submit },
    { href: "/about", label: dict.header.about },
  ];

  const isActive = (href: string) => {
    const normalizedPath = stripLocaleFromPathname(pathname || "/");
    if (href === "/") return normalizedPath === "/";
    return normalizedPath.startsWith(href);
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/20 bg-surface/90 backdrop-blur-xl shadow-[0_8px_24px_rgba(25,28,30,0.06)]">
      <div className="w-full px-4 md:px-10 min-h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-8 min-w-0">
          <Link
            href={buildLocalizedPath(locale, "/")}
            className="text-lg md:text-xl font-black tracking-tighter whitespace-nowrap"
          >
            UniSkill
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={buildLocalizedPath(locale, link.href)}
                className={`text-sm transition-colors ${
                  isActive(link.href)
                    ? "text-primary font-semibold border-b-2 border-primary pb-0.5"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSwitcher />
          <div className="hidden md:flex">
            <AuthNav locale={locale} />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-outline-variant/30 bg-surface-container-low text-on-surface-variant"
          >
            <Icon
              name={menuOpen ? "close" : "menu"}
              className="text-[20px]"
            />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-outline-variant/20 bg-surface-container-lowest px-4 pb-4 pt-3 shadow-[0_20px_40px_rgba(25,28,30,0.08)]">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={buildLocalizedPath(locale, link.href)}
                onClick={() => setMenuOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive(link.href)
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={buildLocalizedPath(locale, "/account")}
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold bg-surface-container-low text-on-surface-variant"
            >
              {dict.header.accountFallback}
            </Link>
          </div>

          <div className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface p-3">
            <AuthNav locale={locale} />
          </div>
        </div>
      )}
    </nav>
  );
}
