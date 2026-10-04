import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/server/client-island.tsx",
  componentName: "ClientIsland",
  description:
    "Client component button rendered inside a server component wrapper (server → client boundary crossing)",
  lazyDescription: "the counter button inside the server wrapper",
};

export default testCase;
