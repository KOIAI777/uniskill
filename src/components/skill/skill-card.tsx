import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { buildLocalizedPath, defaultLocale, type AppLocale } from "@/i18n/config";
import type { Skill } from "@/types";

const categoryEmoji: Record<string, string> = {
  formatting: "📝",
  reference: "📑",
  email: "📧",
  exam: "📊",
  presentation: "🎤",
  research: "🔍",
};

export function SkillCard({
  skill,
  locale = defaultLocale,
}: {
  skill: Skill;
  locale?: AppLocale;
}) {
  return <SkillCardInner skill={skill} compact={false} locale={locale} />;
}

export function CompactSkillCard({
  skill,
  locale = defaultLocale,
}: {
  skill: Skill;
  locale?: AppLocale;
}) {
  return <SkillCardInner skill={skill} compact locale={locale} />;
}

function SkillCardInner({
  skill,
  compact,
  locale,
}: {
  skill: Skill;
  compact: boolean;
  locale: AppLocale;
}) {
  const primaryCategory = Array.isArray(skill.category)
    ? skill.category[0]
    : skill.category;
  const visibleTags = compact ? 2 : 3;
  const name = locale === "en" ? skill.name : skill.nameZh;
  const secondaryName = locale === "en" ? skill.nameZh : skill.name;
  const description = locale === "en" ? skill.description : skill.descriptionZh;

  return (
    <Link href={buildLocalizedPath(locale, `/skills/${skill.slug}`)}>
      <div
        className={`group bg-surface-container-lowest rounded-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0px_10px_40px_rgba(25,28,30,0.06)] flex flex-col h-full ${
          compact ? "p-4" : "p-6"
        }`}
      >
        <div className={`flex justify-between items-start ${compact ? "mb-4" : "mb-6"}`}>
          <div
            className={`flex items-center justify-center bg-surface-container rounded-lg group-hover:scale-110 transition-transform ${
              compact ? "w-10 h-10 text-2xl" : "w-12 h-12 text-3xl"
            }`}
          >
            {categoryEmoji[primaryCategory] || "📦"}
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-outline uppercase tracking-wider">
              v{skill.version}
            </div>
            <div className="text-[10px] text-outline-variant">
              {skill.createdAt}
            </div>
          </div>
        </div>

        <h3 className={`${compact ? "text-base leading-snug" : "text-xl"} font-bold mb-2`}>
          {name}
          {secondaryName ? ` (${secondaryName})` : ""}
        </h3>
        <p
          className={`text-on-surface-variant leading-relaxed ${
            compact ? "text-xs mb-4" : "text-sm mb-6"
          }`}
        >
          {description}
        </p>

        <div className={`flex flex-wrap gap-2 ${compact ? "mb-4" : "mb-6"}`}>
          {skill.tags.slice(0, visibleTags).map((tag, i) => (
            <span
              key={tag}
              className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
                i === 0
                  ? "bg-primary-fixed-dim text-on-primary-fixed"
                  : "bg-secondary-fixed-dim text-on-secondary-container"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-end mt-auto">
          <button
            className={`bg-surface-container-high rounded-full hover:bg-primary hover:text-white transition-colors ${
              compact ? "p-1.5" : "p-2"
            }`}
          >
            <Icon
              name="arrow_forward"
              className={compact ? "text-lg" : "text-xl"}
            />
          </button>
        </div>
      </div>
    </Link>
  );
}
