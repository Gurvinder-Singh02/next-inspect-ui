import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "scripts/analytics-embed.tsx",
  componentName: "AnalyticsEmbedWidget",
  description:
    "A React component living in a scripts/ directory, an unexpected location for UI components (inspired by Inbox-zero scripts https://github.com/elie222/inbox-zero/blob/main/apps/web/utils/scripts/lemon.tsx)",
  lazyDescription: "the analytics embed widget in scripts",
};

export default testCase;
