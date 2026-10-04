import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/tunnel/tunnel-sidebar.tsx",
  componentName: "TunnelSidebarStatus",
  description:
    "Sidebar status bar rendered via tunnel context pattern inspired by Excalidraw DefaultSidebar tunnels (https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/DefaultSidebar.tsx). Status content is tunneled from TunnelIn to a separate TunnelOut render location.",
  lazyDescription: "the sidebar status bar",
};

export default testCase;
