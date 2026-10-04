import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "lib/ui-primitives.tsx",
  componentName: "PrimitiveCard",
  description:
    "A card component defined in lib/ui-primitives.tsx - a utility file, not the components directory",
  lazyDescription: "the card from the utils",
};

export default testCase;
