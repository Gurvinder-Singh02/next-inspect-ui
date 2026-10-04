import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "schemas/validation-feedback-display.tsx",
  componentName: "ValidationFeedbackDisplay",
  description:
    "A React component living in a schemas/ directory, an unexpected location for UI components (inspired by Midday opengraph https://github.com/midday-ai/midday/blob/main/apps/website/src/app/api/og/compare/route.tsx)",
  lazyDescription: "the validation feedback display in schemas",
};

export default testCase;
