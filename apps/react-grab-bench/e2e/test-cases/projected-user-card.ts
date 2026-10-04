import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/projected/projected-user-card.tsx",
  componentName: "ProjectedUserCard",
  description:
    "User card whose testid div is rendered by ProjectionOutlet in lib/content-projection.tsx while content is teleported via context",
  lazyDescription: "the user card with Aiden Bai avatar",
};

export default testCase;
