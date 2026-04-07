import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { getAllSchools, getSkillsBySchool } from "@/lib/skills";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "所有学校",
  description: "浏览各大学的可用 AI 学术 Skills，找到适合你学校的工具。",
};

export default function SchoolsPage() {
  const schools = getAllSchools();

  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Icon name="chevron_right" className="text-sm" />
            <span className="text-on-surface font-medium">Schools</span>
          </nav>

          <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-4">
            All Schools
          </h1>
          <p className="text-xl text-on-surface-variant">
            浏览各学校的可用 Skills
          </p>
        </div>
      </section>

      {/* Schools Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {schools.map((school) => {
              const skills = getSkillsBySchool(school.slug);
              return (
                <Link
                  key={school.slug}
                  href={`/schools/${school.slug}`}
                  className="group bg-surface-container-lowest p-8 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0px_10px_40px_rgba(25,28,30,0.06)]"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 flex items-center justify-center bg-primary text-on-primary rounded-xl text-xl font-black">
                      {school.name.slice(0, 2)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">{school.name}</h2>
                      {school.nameZh !== school.name && (
                        <p className="text-sm text-on-surface-variant">
                          {school.nameZh}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className="px-3 py-1 bg-primary-fixed-dim text-on-primary-fixed text-xs font-bold rounded-full">
                      {skills.length} Skills
                    </span>
                    <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs font-bold rounded-full">
                      {school.country}
                    </span>
                  </div>

                  <div className="flex items-center justify-end">
                    <span className="w-10 h-10 flex items-center justify-center bg-surface-container-high rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon name="arrow_forward" className="text-xl" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
