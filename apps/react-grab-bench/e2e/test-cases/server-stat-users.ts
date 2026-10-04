import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/server/server-stat-card.tsx",
  componentName: "ServerStatCard",
  description:
    "Server stat card at 3 levels deep in server component tree (ServerHero → ServerStats → ServerStatCard)",
  lazyDescription: "the users stat card",
};

export default testCase;
