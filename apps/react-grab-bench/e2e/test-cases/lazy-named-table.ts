import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/lazy-named/lazy-table-source.tsx",
  componentName: "DataGrid",
  description:
    "Named export DataGrid loaded via lazy() with .then() to extract non-default export, inspired by Twenty useCreateAppRouter (https://github.com/twentyhq/twenty/blob/main/packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx)",
  lazyDescription: "the data grid table",
};

export default testCase;
