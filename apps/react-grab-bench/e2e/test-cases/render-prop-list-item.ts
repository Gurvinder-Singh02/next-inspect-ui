import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/render-props/render-prop-list.tsx",
  componentName: "RenderPropList",
  description:
    "A list component that delegates item rendering via a renderItem render prop (inspired by Cal.com FormAction https://github.com/calcom/cal.com/blob/main/apps/web/components/apps/routing-forms/FormActions.tsx)",
  lazyDescription: "the render prop list",
};

export default testCase;
