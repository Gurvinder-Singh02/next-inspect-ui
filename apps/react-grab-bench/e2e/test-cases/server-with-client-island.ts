import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/server/server-with-client-island.tsx",
  componentName: "ServerWithClientIsland",
  description:
    "Server component that wraps a client island component across the server/client boundary",
  lazyDescription: "the server wrapper with a client island",
};

export default testCase;
