import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/aliased/internal-search-core.tsx",
  componentName: "SearchCore",
  description:
    "Alias re-export: SearchCore → AliasedSearchBar (inspired by Novu Inbox component chain https://github.com/novuhq/novu/blob/main/packages/react/src/components/Inbox.tsx)",
  lazyDescription: "the aliased search bar component",
};

export default testCase;
