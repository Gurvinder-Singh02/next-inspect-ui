import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/mixed/style-clash.tsx",
  componentName: "StyleClash",
  description:
    "Button with styled-components + Tailwind + CSS Modules + inline styles on same elements",
  lazyDescription: "the button that uses like 4 different styling approaches",
};

export default testCase;
