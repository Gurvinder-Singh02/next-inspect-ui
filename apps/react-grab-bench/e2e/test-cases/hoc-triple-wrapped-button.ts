import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/stacked/triple-wrapped-button.tsx",
  componentName: "TripleWrappedButton",
  description:
    "Button wrapped with 3 HOCs (withLicense + withAnalytics + withTracking), inspired by Cal.com withLicenseRequired pattern",
  lazyDescription: "that triple-HOC-wrapped premium button",
};

export default testCase;
