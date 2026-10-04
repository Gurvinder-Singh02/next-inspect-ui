import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/mixed/style-clash.tsx",
  componentName: "StyleClash",
  description:
    "Style Clash badge: styled-components span with Tailwind + inline styles + CSS Module parent - 4 styling systems on one element",
  lazyDescription: "the badge with all the different styles",
};

export default testCase;
