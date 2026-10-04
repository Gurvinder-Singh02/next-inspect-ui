import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/lazy-named/lazy-chart-source.tsx",
  componentName: "AnalyticsChart",
  description:
    "Named export AnalyticsChart loaded via lazy() with .then() to extract non-default export, inspired by Twenty useCreateAppRouter (https://github.com/twentyhq/twenty/blob/main/packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx)",
  lazyDescription: "the analytics chart",
};

export default testCase;
