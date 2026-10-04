import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/render-props/render-prop-table.tsx",
  componentName: "RenderPropTable",
  description:
    "A table component that delegates cell rendering via a renderCell render prop (inspired by Excalidraw App https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/App.tsx)",
  lazyDescription: "the render prop table",
};

export default testCase;
