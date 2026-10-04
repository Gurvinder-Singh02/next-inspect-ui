import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/primitives/base-button.tsx",
  componentName: "BaseButton",
  description:
    "A base button component re-exported through 3 barrel index.ts files (primitives → common → ui) with name changes at each level",
  lazyDescription: "the base button",
};

export default testCase;
