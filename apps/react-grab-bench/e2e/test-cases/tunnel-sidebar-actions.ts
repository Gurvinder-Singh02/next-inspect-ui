import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/tunnel/tunnel-sidebar.tsx",
  componentName: "TunnelSidebarActions",
  description:
    "Sidebar action buttons rendered via tunnel context pattern inspired by Excalidraw DefaultSidebar tunnels (https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/DefaultSidebar.tsx). Actions are defined at TunnelIn and projected to the TunnelOut slot.",
  lazyDescription: "the sidebar action buttons",
};

export default testCase;
