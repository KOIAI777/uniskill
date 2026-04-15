"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  buildLocalizedPath,
  defaultLocale,
  getLocaleFromPathname,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function Footer() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? defaultLocale;
  const dict = getDictionary(locale);
  const footerLinks = [
    { href: "/about", label: dict.footer.about },
    { href: "/contribute", label: dict.footer.submit },
    { href: "mailto:1146850129@qq.com", label: dict.footer.contact },
  ];

  return (
    <footer className="w-full py-12 mt-auto bg-surface-container-low">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-8 gap-4">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-bold text-lg">UniSkill</span>
          <p className="text-on-surface-variant text-sm mt-1">
            &copy; {new Date().getFullYear()} UniSkill. {dict.footer.copyright}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-sm leading-relaxed">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={
                link.href.startsWith("mailto:")
                  ? link.href
                  : buildLocalizedPath(locale, link.href)
              }
              className="text-on-surface-variant hover:text-primary hover:underline transition-all opacity-80 hover:opacity-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
