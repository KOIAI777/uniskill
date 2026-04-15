import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildSkillUploadPrefill,
  parseSkillManifest,
  type ParsedSkillManifest,
  type SkillUploadPrefill,
} from "@/lib/skill-manifest";

function execZipCommand(args: string[]) {
  return new Promise<string>((resolve, reject) => {
    execFile("unzip", args, { encoding: "utf8" }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(stdout);
    });
  });
}

export async function withTemporaryZipFile<T>(
  file: File,
  callback: (zipPath: string) => Promise<T>
) {
  const tempZipPath = join(tmpdir(), `community-skill-${randomUUID()}.zip`);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempZipPath, buffer);
    return await callback(tempZipPath);
  } finally {
    await rm(tempZipPath, { force: true });
  }
}

export async function listZipEntries(zipPath: string) {
  const stdout = await execZipCommand(["-Z1", zipPath]);

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function findSkillManifestEntry(entries: string[]) {
  return (
    entries.find((entry) =>
      entry.split("/").some((segment) => segment === "SKILL.md")
    ) ?? null
  );
}

export async function readZipEntry(zipPath: string, entryPath: string) {
  return execZipCommand(["-p", zipPath, entryPath]);
}

export interface InspectedSkillArchive {
  manifest: ParsedSkillManifest;
  manifestPath: string;
  warnings: string[];
}

export async function inspectSkillArchive(file: File): Promise<InspectedSkillArchive> {
  return withTemporaryZipFile(file, async (zipPath) => {
    const entries = await listZipEntries(zipPath);
    const manifestPath = findSkillManifestEntry(entries);

    if (!manifestPath) {
      throw new Error(
        "The uploaded zip does not contain a SKILL.md file. Please package your skill folder so that SKILL.md is included inside the archive."
      );
    }

    const skillMarkdown = await readZipEntry(zipPath, manifestPath);
    const { manifest, warnings } = parseSkillManifest(skillMarkdown);

    return {
      manifest,
      manifestPath,
      warnings,
    };
  });
}

export async function inspectSkillArchiveForPrefill(
  file: File,
  managedSchoolSlugs: string[]
): Promise<{
  manifest: ParsedSkillManifest;
  manifestPath: string;
  warnings: string[];
  prefill: SkillUploadPrefill;
}> {
  const inspection = await inspectSkillArchive(file);
  const prefillResult = buildSkillUploadPrefill(
    inspection.manifest,
    managedSchoolSlugs
  );

  return {
    manifest: inspection.manifest,
    manifestPath: inspection.manifestPath,
    warnings: [...inspection.warnings, ...prefillResult.warnings],
    prefill: prefillResult.fields,
  };
}
