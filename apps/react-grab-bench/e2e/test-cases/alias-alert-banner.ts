import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/aliased/internal-alert-impl.tsx",
  componentName: "AlertImpl",
  description:
    "Alias re-export: AlertImpl → AliasedAlertBanner (inspired by Novu internal component aliasing https://github.com/novuhq/novu/blob/main/packages/react/src/components/Inbox.tsx)",
  lazyDescription: "the aliased alert banner component",
};

export default testCase;
