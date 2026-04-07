import fs from "fs";
import path from "path";
import matter from "gray-matter";
import archiver from "archiver";

const SKILLS_SOURCE = path.resolve(__dirname, "../skills-source");
const SKILLS_JSON = path.resolve(__dirname, "../src/data/skills.json");
const SCHOOLS_JSON = path.resolve(__dirname, "../src/data/schools.json");
const PUBLIC_SKILLS = path.resolve(__dirname, "../public/skills");

interface SkillMeta {
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
  preview: {
    screenshots: string[];
    exampleInput: string;
    exampleOutput: string;
  };
}

async function zipFolder(sourceDir: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Recursively find all directories containing a SKILL.md file.
 * Supports structures like:
 *   skills-source/my-skill/SKILL.md
 *   skills-source/bnbu-essay-formatter/bnbu-eap3-checker/SKILL.md
 *   skills-source/category-folder/sub-folder/actual-skill/SKILL.md
 */
function findSkillDirs(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // If this directory has a SKILL.md, it's a skill
  if (entries.some((e) => e.isFile() && e.name === "SKILL.md")) {
    results.push(dir);
  }

  // Always recurse into subdirectories to find nested skills
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      results.push(...findSkillDirs(path.join(dir, entry.name)));
    }
  }

  return results;
}

async function main() {
  // Ensure output dirs exist
  fs.mkdirSync(PUBLIC_SKILLS, { recursive: true });

  const skillDirs = findSkillDirs(SKILLS_SOURCE);

  const skills: SkillMeta[] = [];
  const schoolCounts: Record<string, number> = {};

  for (const skillDir of skillDirs) {
    const folder = path.relative(SKILLS_SOURCE, skillDir);
    const skillMdPath = path.join(skillDir, "SKILL.md");

    const raw = fs.readFileSync(skillMdPath, "utf-8");
    const { data } = matter(raw);

    // Skip if missing required fields
    if (!data.name || !data.category) {
      console.warn(`⚠ Skipping ${folder}: missing name or category`);
      continue;
    }

    // Check if SKILL.md still has TODO placeholder (skip template-only files)
    const body = raw.split("---").slice(2).join("---").trim();
    const isTodo = body.includes("<!-- TODO") && body.length < 100;
    if (isTodo) {
      console.log(`⏭ Skipping ${folder}: still a template (has TODO)`);
      continue;
    }

    const slug = data.name as string;
    const zipPath = path.join(PUBLIC_SKILLS, `${slug}.zip`);

    // Pack .zip
    await zipFolder(skillDir, zipPath);
    console.log(`✓ Packed ${slug}.zip`);

    // Count schools
    const schools = (data.schools as string[]) || [];
    for (const s of schools) {
      schoolCounts[s] = (schoolCounts[s] || 0) + 1;
    }

    skills.push({
      slug,
      name: data.name,
      nameZh: data.nameZh || data.name,
      description: data.description || "",
      descriptionZh: data.descriptionZh || "",
      category: data.category,
      schools,
      tags: (data.tags as string[]) || [],
      installCommand: `claude skill install https://uniskill.online/skills/${slug}.zip`,
      downloadPath: `/skills/${slug}.zip`,
      githubUrl: "https://github.com/uniskill/skills",
      version: (data.version as string) || "1.0.0",
      downloads: 0,
      featured: data.featured === true,
      createdAt: fs.statSync(skillMdPath).mtime.toISOString().split("T")[0],
      preview: {
        screenshots: [],
        exampleInput: "",
        exampleOutput: "",
      },
    });
  }

  // Write skills.json
  fs.writeFileSync(SKILLS_JSON, JSON.stringify(skills, null, 2) + "\n");
  console.log(`\n✓ Written ${skills.length} skills to skills.json`);

  // Update schools.json — auto-create new schools from skill data
  let schoolsData: Array<{ slug: string; name: string; nameZh: string; country: string; skillCount: number }> = [];
  if (fs.existsSync(SCHOOLS_JSON)) {
    schoolsData = JSON.parse(fs.readFileSync(SCHOOLS_JSON, "utf-8"));
  }

  const existingSlugs = new Set(schoolsData.map((s) => s.slug));

  // Auto-create entries for new schools found in skills
  for (const slug of Object.keys(schoolCounts)) {
    if (!existingSlugs.has(slug)) {
      schoolsData.push({
        slug,
        name: slug.toUpperCase(),
        nameZh: slug.toUpperCase(),
        country: "CN",
        skillCount: 0,
      });
      console.log(`✓ Auto-created school: ${slug.toUpperCase()}`);
    }
  }

  // Update counts
  for (const school of schoolsData) {
    school.skillCount = schoolCounts[school.slug] || 0;
  }

  fs.writeFileSync(SCHOOLS_JSON, JSON.stringify(schoolsData, null, 2) + "\n");
  console.log(`✓ Updated schools.json skill counts`);

  console.log("\nDone! 🎉");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
