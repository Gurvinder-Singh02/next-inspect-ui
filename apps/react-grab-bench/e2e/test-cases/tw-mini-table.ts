import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/tailwind/tw-dashboard.tsx",
  componentName: "TwDashboard",
  description:
    "Tailwind MiniTable nested inside TwDashboard - inner component has no direct export, only accessible via parent",
  lazyDescription: "the little table in the dashboard",
};

export default testCase;
