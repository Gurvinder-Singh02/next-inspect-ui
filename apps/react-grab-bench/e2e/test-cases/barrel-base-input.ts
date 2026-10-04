import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/primitives/base-input.tsx",
  componentName: "BaseInput",
  description:
    "A base input component re-exported through 3 barrel index.ts files with name aliases at each re-export level",
  lazyDescription: "the base input",
};

export default testCase;
