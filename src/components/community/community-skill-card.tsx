import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { getCommunitySkillSchoolLabel } from "@/lib/community-skills";
import { buildLocalizedPath, defaultLocale, type AppLocale } from "@/i18n/config";
import type { CommunitySkill, CommunitySkillStatus } from "@/types";

const STATUS_STYLES: Record<
  CommunitySkillStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "审核中",
    className: "bg-secondary/10 text-secondary",
  },
  approved: {
    label: "已上线",
    className: "bg-primary/10 text-primary",
  },
  rejected: {
    label: "已拒绝",
    className: "bg-error/10 text-error",
  },
};

export function CommunitySkillCard({
  skill,
  showStatus = false,
  locale = defaultLocale,
}: {
  skill: CommunitySkill;
  showStatus?: boolean;
  locale?: AppLocale;
}) {
  const status = STATUS_STYLES[skill.status];
  const name = locale === "en" ? skill.name : skill.nameZh;
  const secondaryName = locale === "en" ? skill.nameZh : skill.name;
  const description = locale === "en" ? skill.description : skill.descriptionZh;

  return (
    <Link href={buildLocalizedPath(locale, `/community/${skill.slug}`)}>
      <article className="group bg-surface-container-lowest p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0px_10px_40px_rgba(25,28,30,0.06)] border border-outline-variant/20 h-full flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon name="upload_file" className="text-2xl" filled />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {showStatus && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${status.className}`}>
                {status.label}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant uppercase">
              v{skill.version}
            </span>
          </div>
        </div>

        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-sm font-medium text-on-surface-variant mb-3">
          {secondaryName}
        </p>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
          {description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
            {skill.category}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase">
            {getCommunitySkillSchoolLabel(skill)}
          </span>
          {skill.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between text-sm text-on-surface-variant">
          <span>by {skill.authorName}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            {locale === "en" ? "View details" : "查看详情"}
            <Icon name="arrow_forward" className="text-base" />
          </span>
        </div>
      </article>
    </Link>
  );
}
