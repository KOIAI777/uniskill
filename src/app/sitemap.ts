import type { MetadataRoute } from "next";
import { getAllSkills, getAllSchools, getAllCategories } from "@/lib/skills";

const BASE_URL = "https://uniskill.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/schools`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contribute`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // School pages
  const schoolPages: MetadataRoute.Sitemap = getAllSchools().map((school) => ({
    url: `${BASE_URL}/schools/${school.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Skill pages
  const skillPages: MetadataRoute.Sitemap = getAllSkills().map((skill) => ({
    url: `${BASE_URL}/skills/${skill.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = getAllCategories().map((cat) => ({
    url: `${BASE_URL}/category/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...schoolPages, ...skillPages, ...categoryPages];
}
