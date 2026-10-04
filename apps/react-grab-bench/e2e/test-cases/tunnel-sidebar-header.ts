import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/tunnel/tunnel-sidebar.tsx",
  componentName: "TunnelSidebarHeader",
  description:
    "Sidebar header rendered via tunnel context pattern inspired by Excalidraw DefaultSidebar tunnels (https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/DefaultSidebar.tsx). Content defined at TunnelIn is rendered at TunnelOut through React context.",
  lazyDescription: "the sidebar header",
};

export default testCase;
