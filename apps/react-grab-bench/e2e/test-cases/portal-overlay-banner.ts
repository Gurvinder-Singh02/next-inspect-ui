import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/portals/overlay-stack.tsx",
  componentName: "InternalOverlayBanner",
  description:
    "A banner rendered via createPortal to document.body, exported under a different name than its internal definition",
  lazyDescription: "the top banner",
};

export default testCase;
