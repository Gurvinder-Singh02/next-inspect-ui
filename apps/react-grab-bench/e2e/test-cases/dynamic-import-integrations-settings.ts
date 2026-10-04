import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/dynamic-import/panels/integrations-panel.tsx",
  componentName: "IntegrationsPanel",
  description:
    "Integrations panel loaded via dynamic import map pattern inspired by LobeChat componentMap (https://github.com/lobehub/lobe-chat/blob/main/src/routes/(main)/settings/features/componentMap.ts)",
  lazyDescription: "the integrations panel",
};

export default testCase;
