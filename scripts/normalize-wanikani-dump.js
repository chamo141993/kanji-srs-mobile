#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "data",
  "wanikani-massive-dump.json"
);
const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "data",
  "wanikani-subjects-normalized.json"
);
const OUTPUT_LEVELS_1_TO_5_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "data",
  "wanikani-subjects-normalized-levels-1-5.json"
);

const SUPPORTED_OBJECT_TYPES = new Set([
  "radical",
  "kanji",
  "vocabulary",
  "kana_vocabulary",
]);

function normalizeType(objectType) {
  switch (objectType) {
    case "radical":
      return "RADICAL";
    case "kanji":
      return "KANJI";
    case "vocabulary":
    case "kana_vocabulary":
      return "VOCABULARY";
    default:
      return null;
  }
}

function normalizeString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function dedupeStrings(values) {
  return [...new Set(values)];
}

function normalizeMeaningArray(meanings, auxiliaryMeanings) {
  const acceptedPrimary = Array.isArray(meanings)
    ? meanings
        .filter((item) => item && typeof item === "object")
        .filter((item) => item.accepted_answer !== false)
        .map((item) => normalizeString(item.meaning))
        .filter(Boolean)
    : [];

  const whitelistAuxiliary = Array.isArray(auxiliaryMeanings)
    ? auxiliaryMeanings
        .filter((item) => item && typeof item === "object")
        .filter((item) => item.type === "whitelist")
        .map((item) => normalizeString(item.meaning))
        .filter(Boolean)
    : [];

  return dedupeStrings([...acceptedPrimary, ...whitelistAuxiliary]);
}

function normalizeReadingArray(readings) {
  if (!Array.isArray(readings)) {
    return [];
  }

  return dedupeStrings(
    readings
      .filter((item) => item && typeof item === "object")
      .filter((item) => item.accepted_answer !== false)
      .map((item) => normalizeString(item.reading))
      .filter(Boolean)
  );
}

function slugify(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return "subject";
  }

  return normalized
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "subject";
}

function normalizeSubject(item) {
  if (!item || typeof item !== "object" || !item.data || typeof item.data !== "object") {
    return null;
  }

  const objectType = normalizeString(item.object)?.toLowerCase();
  if (!objectType || !SUPPORTED_OBJECT_TYPES.has(objectType)) {
    return null;
  }

  const type = normalizeType(objectType);
  const source = item.data;
  const level = Number.isFinite(source.level) ? Math.trunc(source.level) : null;

  if (!type || !level || level < 1) {
    return null;
  }

  if (source.hidden_at) {
    return null;
  }

  const meanings = normalizeMeaningArray(
    source.meanings,
    source.auxiliary_meanings
  );
  if (meanings.length === 0) {
    return null;
  }

  const sourceId = Number.isFinite(item.id) ? Math.trunc(item.id) : normalizeString(item.id);
  const baseSlug = slugify(source.slug || source.characters || meanings[0]);
  const id = `wk-${objectType}-${sourceId}`;

  return {
    id,
    type,
    level,
    slug: `${id}-${baseSlug}`,
    characters: normalizeString(source.characters),
    meanings,
    readings: normalizeReadingArray(source.readings),
    meaningMnemonic: normalizeString(source.meaning_mnemonic),
    readingMnemonic: normalizeString(source.reading_mnemonic),
  };
}

function main() {
  const raw = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  if (!Array.isArray(raw)) {
    throw new Error("Expected wanikani-massive-dump.json to contain a top-level array.");
  }

  const normalized = raw
    .map(normalizeSubject)
    .filter(Boolean)
    .sort((a, b) => a.level - b.level || a.type.localeCompare(b.type) || a.id.localeCompare(b.id));

  const levelsOneToFive = normalized.filter((subject) => subject.level >= 1 && subject.level <= 5);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(normalized, null, 2) + "\n");
  fs.writeFileSync(
    OUTPUT_LEVELS_1_TO_5_PATH,
    JSON.stringify(levelsOneToFive, null, 2) + "\n"
  );

  console.log(
    JSON.stringify(
      {
        inputCount: raw.length,
        normalizedCount: normalized.length,
        levelsOneToFiveCount: levelsOneToFive.length,
        outputPath: OUTPUT_PATH,
        levelsOneToFivePath: OUTPUT_LEVELS_1_TO_5_PATH,
      },
      null,
      2
    )
  );
}

main();
