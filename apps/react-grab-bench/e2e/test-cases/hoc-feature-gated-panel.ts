import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/stacked/feature-gated-panel.tsx",
  componentName: "FeatureGatedPanel",
  description:
    "Panel gated by withFeatureFlag + withPermissions HOCs and wrapped in React.memo",
  lazyDescription: "that feature-gated panel with permissions",
};

export default testCase;
