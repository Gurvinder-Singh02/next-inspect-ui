import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "constants/status-icon-map.tsx",
  componentName: "StatusIconDisplay",
  description:
    "A React component living in a constants/ directory, rendering status icons from a map (inspired by Dub variables.tsx https://github.com/dubinc/dub/blob/main/packages/ui/src/rich-text-area/variables.tsx)",
  lazyDescription: "the status icon display in constants",
};

export default testCase;
