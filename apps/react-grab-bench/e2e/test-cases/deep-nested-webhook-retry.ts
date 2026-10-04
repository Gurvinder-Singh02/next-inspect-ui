import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath:
    "components/features/integrations/webhooks/retries/status/displays/webhook-retry-status.tsx",
  componentName: "WebhookRetryStatus",
  description:
    "WebhookRetryStatus nested 8 levels deep in a monorepo-style directory chain (inspired by Twenty record-table https://github.com/twentyhq/twenty/blob/main/packages/twenty-front/src/modules/object-record/record-table/record-table-row/components/RecordTableTr.tsx)",
  lazyDescription: "the deeply nested webhook retry status",
};

export default testCase;
