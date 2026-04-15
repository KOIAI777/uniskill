import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localeToHtmlLang, locales } from "@/i18n/config";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) {
    return {};
  }

  const dict = getDictionary(lang);

  return {
    title: {
      default: dict.metadata.defaultTitle,
      template: dict.metadata.titleTemplate,
    },
    description: dict.metadata.description,
    openGraph: {
      locale: dict.metadata.openGraphLocale,
      title: dict.metadata.defaultTitle,
      description: dict.metadata.description,
    },
    twitter: {
      card: "summary_large_image",
      title: dict.metadata.defaultTitle,
      description: dict.metadata.description,
    },
    alternates: {
      languages: {
        en: "/en",
        zh: "/zh",
      },
    },
    other: {
      "content-language": localeToHtmlLang(lang),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  return children;
}
