import { strFromU8, unzipSync } from "fflate";
import {
  buildSkillUploadPrefill,
  parseSkillManifest,
  type ParsedSkillManifest,
  type SkillUploadPrefill,
} from "@/lib/skill-manifest";

function normalizeZipEntries(entries: Record<string, Uint8Array>) {
  return Object.keys(entries)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function unzipArchive(fileBuffer: Uint8Array) {
  try {
    return unzipSync(fileBuffer);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `The uploaded zip could not be opened: ${error.message}`
        : "The uploaded zip could not be opened."
    );
  }
}

export function findSkillManifestEntry(entries: string[]) {
  return (
    entries.find((entry) =>
      entry.split("/").some((segment) => segment === "SKILL.md")
    ) ?? null
  );
}

export interface InspectedSkillArchive {
  manifest: ParsedSkillManifest;
  manifestPath: string;
  warnings: string[];
}

export async function inspectSkillArchive(
  file: File
): Promise<InspectedSkillArchive> {
  const fileBuffer = new Uint8Array(await file.arrayBuffer());
  const archiveEntries = unzipArchive(fileBuffer);
  const entries = normalizeZipEntries(archiveEntries);
  const manifestPath = findSkillManifestEntry(entries);

  if (!manifestPath) {
    throw new Error(
      "The uploaded zip does not contain a SKILL.md file. Please package your skill folder so that SKILL.md is included inside the archive."
    );
  }

  const manifestBuffer = archiveEntries[manifestPath];

  if (!manifestBuffer) {
    throw new Error("The uploaded zip contains an unreadable SKILL.md file.");
  }

  const skillMarkdown = strFromU8(manifestBuffer);
  const { manifest, warnings } = parseSkillManifest(skillMarkdown);

  return {
    manifest,
    manifestPath,
    warnings,
  };
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
