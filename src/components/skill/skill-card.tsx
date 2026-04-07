import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Skill } from "@/types";

const categoryEmoji: Record<string, string> = {
  formatting: "📝",
  reference: "📑",
  email: "📧",
  exam: "📊",
  presentation: "🎤",
  research: "🔍",
};

export function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link href={`/skills/${skill.slug}`}>
      <div className="group bg-surface-container-lowest p-6 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0px_10px_40px_rgba(25,28,30,0.06)] flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 flex items-center justify-center text-3xl bg-surface-container rounded-lg group-hover:scale-110 transition-transform">
            {categoryEmoji[Array.isArray(skill.category) ? skill.category[0] : skill.category] || "📦"}
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

        <h3 className="text-xl font-bold mb-2">
          {skill.nameZh} ({skill.name})
        </h3>
        <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
          {skill.descriptionZh}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {skill.tags.slice(0, 3).map((tag, i) => (
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
          <button className="p-2 bg-surface-container-high rounded-full hover:bg-primary hover:text-white transition-colors">
            <Icon name="arrow_forward" className="text-xl" />
          </button>
        </div>
      </div>
    </Link>
  );
}
