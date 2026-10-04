import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/tunnel/tunnel-sidebar.tsx",
  componentName: "TunnelSidebarBody",
  description:
    "Sidebar body rendered via tunnel context pattern inspired by Excalidraw DefaultSidebar tunnels (https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/DefaultSidebar.tsx). Content originates at TunnelIn and appears at a distant TunnelOut location.",
  lazyDescription: "the sidebar body content",
};

export default testCase;
