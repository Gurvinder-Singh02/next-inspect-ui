import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/primitives/base-badge.tsx",
  componentName: "BaseBadge",
  description:
    "A base badge component re-exported through 3 barrel files with different names at each level (BaseBadge → CommonBadge → UIBadge)",
  lazyDescription: "the base badge",
};

export default testCase;
