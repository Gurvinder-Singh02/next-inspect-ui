import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "middleware/auth-banner.tsx",
  componentName: "AuthBannerWidget",
  description:
    "A React component living in a middleware/ directory, an unexpected location for UI components (inspired by Dub variables.tsx https://github.com/dubinc/dub/blob/main/packages/ui/src/rich-text-area/variables.tsx)",
  lazyDescription: "the auth banner in middleware",
};

export default testCase;
