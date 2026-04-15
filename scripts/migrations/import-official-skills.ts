import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const skillsPath = path.resolve(__dirname, "../../src/data/skills.json");
const publicSkillsDir = path.resolve(__dirname, "../../public/skills");
const envPaths = [
  path.resolve(__dirname, "../../.env.local"),
  path.resolve(__dirname, "../../.env"),
];

type SeedSkill = {
  slug: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  category: string | string[];
  schools: string[];
  tags: string[];
  installCommand: string;
  downloadPath: string;
  githubUrl: string;
  version: string;
  downloads: number;
  featured: boolean;
  createdAt: string;
};

function loadEnvFiles() {
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;

    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

async function main() {
  loadEnvFiles();

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  let officialAuthorId = process.env.OFFICIAL_SKILLS_AUTHOR_ID ?? "";

  if (!officialAuthorId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    const profile = (data as { id: string } | null) ?? null;

    if (error) {
      throw error;
    }

    if (!profile?.id) {
      throw new Error(
        "No admin profile found. Set OFFICIAL_SKILLS_AUTHOR_ID or make sure at least one admin exists in profiles."
      );
    }

    officialAuthorId = profile.id;
  }

  const skills = JSON.parse(fs.readFileSync(skillsPath, "utf8")) as SeedSkill[];

  for (const skill of skills) {
    const zipFilename = path.basename(skill.downloadPath);
    const zipAbsolutePath = path.join(publicSkillsDir, zipFilename);
    const fileSize = fs.existsSync(zipAbsolutePath)
      ? fs.statSync(zipAbsolutePath).size
      : 0;

    const { error } = await supabase.from("community_skills").upsert(
      {
        slug: skill.slug,
        source_type: "official",
        author_id: officialAuthorId,
        author_name: "UniSkill",
        author_email: "system@uniskill.local",
        name: skill.name,
        name_zh: skill.nameZh,
        description: skill.description,
        description_zh: skill.descriptionZh,
        category: Array.isArray(skill.category) ? skill.category[0] : skill.category,
        school_slug: skill.schools[0] || null,
        custom_school_name: null,
        tags: skill.tags,
        github_url: skill.githubUrl,
        version: skill.version,
        file_path: `official/${zipFilename}`,
        original_file_name: zipFilename,
        file_size: fileSize || 1,
        status: "approved",
        featured: skill.featured,
        downloads: skill.downloads,
        install_command: skill.installCommand,
        is_verified: true,
        published_at: `${skill.createdAt}T00:00:00.000Z`,
      },
      { onConflict: "slug" }
    );

    if (error) {
      throw error;
    }

    console.log(`Imported official skill: ${skill.slug}`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
