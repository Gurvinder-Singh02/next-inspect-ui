import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/adapter-wrapped/deployment-status.tsx",
  componentName: "DeploymentStatus",
  description:
    "Deployment status component whose testid div is rendered by a shared RenderAdapter wrapper in lib/render-adapter.tsx",
  lazyDescription: "the production deployment status with green dot",
};

export default testCase;
