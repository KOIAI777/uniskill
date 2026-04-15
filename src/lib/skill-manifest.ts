import matter from "gray-matter";
import type { Category } from "@/types";

export const SKILL_UPLOAD_SUPPORTED_CATEGORIES: Category[] = [
  "formatting",
  "reference",
  "email",
  "exam",
  "presentation",
  "research",
];

export interface ParsedSkillManifest {
  name: string | null;
  nameZh: string | null;
  description: string | null;
  descriptionZh: string | null;
  categories: Category[];
  schools: string[];
  tags: string[];
  version: string | null;
  githubUrl: string | null;
  featured: boolean;
}

export interface SkillUploadPrefill {
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  category: Category | "";
  schoolMode: "general" | "official" | "custom";
  schoolSlug: string;
  customSchoolName: string;
  tags: string;
  version: string;
  githubUrl: string;
}

export interface SkillUploadPrefillResult {
  fields: SkillUploadPrefill;
  warnings: string[];
}

export interface ParsedSkillManifestResult {
  manifest: ParsedSkillManifest;
  warnings: string[];
}

export const SKILL_MD_TEMPLATE_PROMPT = `请帮我生成一个可被 UniSkill 上传系统稳定解析的标准 SKILL.md。请严格遵守下面要求：

1. 直接输出完整的 SKILL.md 内容，不要额外解释。
2. 文件必须以 YAML frontmatter 开头和结尾，也就是最上方和字段结束位置都使用 --- 包裹。
3. frontmatter 中请按下面字段提供内容：
name:
nameZh:
description:
descriptionZh:
category:
schools:
tags:
version:
githubUrl:
4. category 只能填写以下六个值中的一个：formatting、reference、email、exam、presentation、research。
5. schools 请写成 YAML 数组。通用 Skill 请写空数组 []；如果只适用于一个学校，请只写一个学校 slug，例如 [bnbu]。
6. tags 请写成 3 到 8 个简短标签的 YAML 数组，尽量使用英文小写短词。
7. version 请使用类似 1.0.0 的语义化版本号。
8. githubUrl 没有的话也要保留字段，并填写空字符串。
9. frontmatter 结束后，再写正文说明，包括：Skill 的用途、首次使用时应该收集什么信息、输出规则、边界限制、建议流程。
10. 不要省略字段，不要改字段名，不要输出 JSON，不要把 frontmatter 改成自然语言描述。

参考模板：
---
name: your-skill-slug
nameZh: 你的 Skill 中文名
description: One-sentence English description of what this skill does
descriptionZh: 一句话中文说明这个 Skill 的用途
category: formatting
schools: [bnbu]
tags: [writing, apa7, formatting]
version: 1.0.0
githubUrl: ""
---

# Skill Title

这里继续写标准 SKILL.md 正文。`;

function normalizeString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeStringList(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => normalizeString(item))
          .filter((item): item is string => Boolean(item))
      )
    );
  }

  const normalized = normalizeString(value);
  if (!normalized) {
    return [] as string[];
  }

  return Array.from(
    new Set(
      normalized
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function normalizeCategoryList(value: unknown) {
  const rawCategories = Array.isArray(value) ? value : value ? [value] : [];

  return Array.from(
    new Set(
      rawCategories
        .map((item) => normalizeString(item)?.toLowerCase() ?? null)
        .filter(
          (item): item is Category =>
            Boolean(item) &&
            SKILL_UPLOAD_SUPPORTED_CATEGORIES.includes(item as Category)
        )
    )
  );
}

function readGithubUrl(data: Record<string, unknown>) {
  return (
    normalizeString(data.githubUrl) ||
    normalizeString(data.github_url) ||
    normalizeString(data.repository) ||
    normalizeString(data.repositoryUrl) ||
    normalizeString(data.sourceUrl) ||
    normalizeString(data.source_url) ||
    normalizeString(data.homepage)
  );
}

export function parseSkillManifest(markdown: string): ParsedSkillManifestResult {
  const { data } = matter(markdown);
  const frontmatter = data as Record<string, unknown>;
  const categories = normalizeCategoryList(frontmatter.category);
  const schools = normalizeStringList(frontmatter.schools);
  const warnings: string[] = [];

  if (!normalizeString(frontmatter.name)) {
    warnings.push("SKILL.md 缺少 `name`，请补充英文 slug 或唯一英文名。");
  }

  if (!normalizeString(frontmatter.description)) {
    warnings.push("SKILL.md 缺少 `description`，上传前建议补充英文简介。");
  }

  if (categories.length === 0) {
    warnings.push(
      "SKILL.md 的 `category` 未命中支持的分类，请改为 formatting / reference / email / exam / presentation / research 之一。"
    );
  }

  if (Array.isArray(frontmatter.category) && categories.length > 1) {
    warnings.push("当前投稿系统只支持一个主分类，已准备优先使用第一个可识别分类。");
  }

  if (schools.length > 1) {
    warnings.push("当前投稿系统暂时只支持一个学校或通用场景，多学校请在表单里手动确认。");
  }

  return {
    manifest: {
      name: normalizeString(frontmatter.name),
      nameZh: normalizeString(frontmatter.nameZh),
      description: normalizeString(frontmatter.description),
      descriptionZh: normalizeString(frontmatter.descriptionZh),
      categories,
      schools,
      tags: normalizeStringList(frontmatter.tags).map((item) =>
        item.toLowerCase()
      ),
      version: normalizeString(frontmatter.version),
      githubUrl: readGithubUrl(frontmatter),
      featured: frontmatter.featured === true,
    },
    warnings,
  };
}

export function buildSkillUploadPrefill(
  manifest: ParsedSkillManifest,
  managedSchoolSlugs: string[]
): SkillUploadPrefillResult {
  const warnings: string[] = [];
  const managedSchoolSet = new Set(
    managedSchoolSlugs.map((slug) => slug.trim().toLowerCase())
  );

  const fields: SkillUploadPrefill = {
    name: manifest.name ?? "",
    nameZh: manifest.nameZh ?? "",
    description: manifest.description ?? "",
    descriptionZh: manifest.descriptionZh ?? "",
    category: manifest.categories[0] ?? "",
    schoolMode: "general",
    schoolSlug: "",
    customSchoolName: "",
    tags: manifest.tags.join(", "),
    version: manifest.version ?? "1.0.0",
    githubUrl: manifest.githubUrl ?? "",
  };

  if (manifest.categories.length > 1) {
    warnings.push(
      `检测到多个分类：${manifest.categories.join(" / ")}。上传表单已预填第一个分类，请手动确认。`
    );
  }

  if (manifest.schools.length === 1) {
    const onlySchool = manifest.schools[0];
    const normalizedSchool = onlySchool.toLowerCase();

    if (managedSchoolSet.has(normalizedSchool)) {
      fields.schoolMode = "official";
      fields.schoolSlug = normalizedSchool;
    } else {
      fields.schoolMode = "custom";
      fields.customSchoolName = onlySchool;
      warnings.push(
        `\`schools\` 中的 \`${onlySchool}\` 不在官方学校列表里，已先按自定义学校名填入。`
      );
    }
  } else if (manifest.schools.length > 1) {
    warnings.push(
      `检测到多个 schools：${manifest.schools.join(" / ")}。当前投稿只支持一个学校或通用，请手动确认。`
    );
  }

  return { fields, warnings };
}
