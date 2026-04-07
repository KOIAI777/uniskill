import skillsData from "@/data/skills.json";
import schoolsData from "@/data/schools.json";
import categoriesData from "@/data/categories.json";
import type { Skill, School, CategoryInfo, Category } from "@/types";

export function getAllSkills(): Skill[] {
  return skillsData as Skill[];
}

export function getSkillBySlug(slug: string): Skill | undefined {
  return getAllSkills().find((s) => s.slug === slug);
}

export function getFeaturedSkills(): Skill[] {
  const featured = getAllSkills().filter((s) => s.featured);
  // If no featured skills, show all skills on homepage
  return featured.length > 0 ? featured : getAllSkills();
}

function hasCategory(skill: Skill, category: Category): boolean {
  return Array.isArray(skill.category)
    ? skill.category.includes(category)
    : skill.category === category;
}

function shareCategory(a: Skill, b: Skill): boolean {
  const aCats = Array.isArray(a.category) ? a.category : [a.category];
  const bCats = Array.isArray(b.category) ? b.category : [b.category];
  return aCats.some((c) => bCats.includes(c));
}

export function getSkillsByCategory(category: Category): Skill[] {
  return getAllSkills().filter((s) => hasCategory(s, category));
}

export function getSkillsBySchool(school: string): Skill[] {
  return getAllSkills().filter((s) => s.schools.includes(school));
}

export function getRelatedSkills(skill: Skill, limit = 3): Skill[] {
  return getAllSkills()
    .filter(
      (s) =>
        s.slug !== skill.slug &&
        (shareCategory(s, skill) ||
          s.schools.some((sch) => skill.schools.includes(sch)))
    )
    .slice(0, limit);
}

export function searchSkills(query: string): Skill[] {
  const q = query.toLowerCase();
  return getAllSkills().filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.nameZh.includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some((t) => t.includes(q))
  );
}

export function getAllSchools(): School[] {
  return schoolsData as School[];
}

export function getSchoolBySlug(slug: string): School | undefined {
  return getAllSchools().find((s) => s.slug === slug);
}

export function getAllCategories(): CategoryInfo[] {
  return categoriesData as CategoryInfo[];
}

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return getAllCategories().find((c) => c.slug === slug);
}
