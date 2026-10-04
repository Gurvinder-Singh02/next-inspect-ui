import { readdirSync } from "node:fs";
import { join, basename } from "node:path";
import type { TestCaseDefinition, TestEntry } from "./types";

const IGNORED_FILES = new Set(["index.ts", "types.ts"]);

const loadTestManifest = (): TestEntry[] => {
  const fileNames = readdirSync(__dirname)
    .filter(
      (fileName) => fileName.endsWith(".ts") && !IGNORED_FILES.has(fileName),
    )
    .sort();

  return fileNames.map((fileName, fileIndex) => {
    const testId = basename(fileName, ".ts");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: definition }: { default: TestCaseDefinition } = require(
      join(__dirname, fileName),
    );
    return {
      id: fileIndex + 1,
      testId,
      ...definition,
    };
  });
};

const TEST_MANIFEST = loadTestManifest();

export { TEST_MANIFEST };
export type { TestEntry, TestCaseDefinition };
