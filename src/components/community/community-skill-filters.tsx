"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { defaultLocale, type AppLocale } from "@/i18n/config";
import { formatMessage, getDictionary } from "@/i18n/dictionaries";
import type { CategoryInfo, School } from "@/types";

export function CommunitySkillFilters({
  categories,
  schools,
  counts,
  locale = defaultLocale,
}: {
  categories: CategoryInfo[];
  schools: School[];
  counts: {
    displayed: number;
    matched: number;
    total: number;
  };
  locale?: AppLocale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dict = getDictionary(locale);

  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const school = searchParams.get("school") ?? "";
  const [draftQuery, setDraftQuery] = useState(query);

  const schoolOptions = useMemo(
    () => [
      { value: "general", label: dict.filters.generalSchool },
      ...schools.map((item) => ({
        value: item.slug,
        label: locale === "en" ? item.name : item.nameZh,
      })),
      { value: "custom", label: dict.filters.customSchool },
    ],
    [dict.filters.customSchool, dict.filters.generalSchool, locale, schools]
  );

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    router.push(`${pathname}?${next.toString()}`);
  };

  const handleSearch = () => {
    updateParam("q", draftQuery.trim());
  };

  return (
    <div className="rounded-3xl bg-surface-container-low p-6 border border-outline-variant/20 mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <label className="block lg:col-span-2">
          <span className="block text-sm font-semibold mb-2">{dict.filters.search}</span>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder={dict.filters.searchPlaceholder}
                className="w-full h-12 rounded-xl border border-outline-variant/30 bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-gradient-primary text-on-primary font-bold whitespace-nowrap shadow-lg shadow-primary/15"
            >
              <Icon name="search" className="text-base" />
              {dict.filters.searchButton}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="block text-sm font-semibold mb-2">{dict.filters.category}</span>
          <div className="relative">
            <select
              value={category}
              onChange={(event) => updateParam("category", event.target.value)}
              className="w-full h-12 appearance-none rounded-xl border border-outline-variant/30 bg-surface px-4 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="">{dict.filters.allCategories}</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {locale === "en" ? item.name : item.nameZh}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-outline">
              <Icon name="expand_more" className="text-lg" />
            </span>
          </div>
        </label>

        <label className="block">
          <span className="block text-sm font-semibold mb-2">{dict.filters.school}</span>
          <div className="relative">
            <select
              value={school}
              onChange={(event) => updateParam("school", event.target.value)}
              className="w-full h-12 appearance-none rounded-xl border border-outline-variant/30 bg-surface px-4 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="">{dict.filters.allSchools}</option>
              {schoolOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-outline">
              <Icon name="expand_more" className="text-lg" />
            </span>
          </div>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
        <p className="text-sm text-on-surface-variant">
          {formatMessage(dict.filters.summary, {
            displayed: counts.displayed,
            matched: counts.matched,
            total: counts.total,
          })}
        </p>
        {(query || category || school) && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
          >
            <Icon name="restart_alt" className="text-base" />
            {dict.filters.clear}
          </button>
        )}
      </div>
    </div>
  );
}
