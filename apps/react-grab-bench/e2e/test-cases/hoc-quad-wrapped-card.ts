import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/stacked/quad-wrapped-card.tsx",
  componentName: "QuadWrappedCard",
  description:
    "Card wrapped with 4 HOCs (withLicense + withAnalytics + withFeatureFlag + withTracking) for maximum stacking depth",
  lazyDescription: "that card with four HOC wrappers stacked on it",
};

export default testCase;
