import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/aliased/internal-modal-base.tsx",
  componentName: "ModalBase",
  description:
    "Alias re-export: ModalBase → AliasedConfirmModal (inspired by Excalidraw re-export aliasing https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/index.tsx)",
  lazyDescription: "the aliased confirm modal component",
};

export default testCase;
