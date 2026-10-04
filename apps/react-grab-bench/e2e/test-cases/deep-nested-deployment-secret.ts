import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath:
    "components/features/deployments/config/environments/secrets/entries/deployment-env-secret.tsx",
  componentName: "DeploymentEnvSecret",
  description:
    "DeploymentEnvSecret nested 8 levels deep in a deployments directory chain (inspired by Cal.com platform https://github.com/calcom/cal.com/blob/main/packages/platform/types/bookings/2024-08-13/outputs/get-booking.output.ts)",
  lazyDescription: "the deeply nested deployment env secret",
};

export default testCase;
