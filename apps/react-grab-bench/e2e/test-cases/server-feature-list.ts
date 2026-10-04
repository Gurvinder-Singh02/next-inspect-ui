import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/server/server-feature-list.tsx",
  componentName: "ServerFeatureList",
  description:
    "Server component list rendered inside ServerHero, iterating over data with nested ServerFeatureItem children",
  lazyDescription: "the feature list",
};

export default testCase;
