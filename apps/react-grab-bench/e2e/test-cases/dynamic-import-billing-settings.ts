import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/dynamic-import/panels/billing-panel.tsx",
  componentName: "BillingPanel",
  description:
    "Billing settings panel loaded via dynamic import map pattern inspired by LobeChat componentMap (https://github.com/lobehub/lobe-chat/blob/main/src/routes/(main)/settings/features/componentMap.ts)",
  lazyDescription: "the billing settings panel",
};

export default testCase;
