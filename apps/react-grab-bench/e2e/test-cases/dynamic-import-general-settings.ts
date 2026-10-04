import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/dynamic-import/panels/general-panel.tsx",
  componentName: "GeneralPanel",
  description:
    "General settings panel loaded via dynamic import map pattern inspired by LobeChat componentMap (https://github.com/lobehub/lobe-chat/blob/main/src/routes/(main)/settings/features/componentMap.ts)",
  lazyDescription: "the general settings panel",
};

export default testCase;
