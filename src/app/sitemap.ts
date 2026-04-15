import type { MetadataRoute } from "next";
import { getAllSkills, getAllCategories } from "@/lib/skills";
import { getManagedSchools } from "@/lib/managed-schools";
import { locales } from "@/i18n/config";

const BASE_URL = "https://uniskill.online";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const schools = await getManagedSchools();
  const localized = (path: string) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${path === "/" ? "" : path}`,
      lastModified: now,
    }));

  const staticPages: MetadataRoute.Sitemap = [
    ...localized("/").map((entry) => ({
      ...entry,
      changeFrequency: "daily" as const,
      priority: 1.0,
    })),
    ...localized("/schools").map((entry) => ({
      ...entry,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...localized("/about").map((entry) => ({
      ...entry,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...localized("/contribute").map((entry) => ({
      ...entry,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...localized("/community").map((entry) => ({
      ...entry,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  const schoolPages: MetadataRoute.Sitemap = schools.flatMap((school) =>
    localized(`/schools/${school.slug}`).map((entry) => ({
      ...entry,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  );

  const skillPages: MetadataRoute.Sitemap = getAllSkills().flatMap((skill) =>
    localized(`/skills/${skill.slug}`).map((entry) => ({
      ...entry,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }))
  );

  const categoryPages: MetadataRoute.Sitemap = getAllCategories().flatMap((cat) =>
    localized(`/category/${cat.slug}`).map((entry) => ({
      ...entry,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  return [...staticPages, ...schoolPages, ...skillPages, ...categoryPages];
}
