import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { InspectUI as React19InspectUI, type InspectUIProps } from "next-inspect-ui";
import App from "./App";
import { loadCaseSources } from "./load-case-sources";
import { ThemeProvider } from "@/components/theme-provider";
import "./style.css";

// Bridge React 19 declaration types for this experimental React 18 runtime test.
const InspectUI = React19InspectUI as unknown as ComponentType<InspectUIProps>;

const sourcesByCase = await loadCaseSources();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App sourcesByCase={sourcesByCase} />
    </ThemeProvider>
    {import.meta.env.DEV && <InspectUI projectRoot={__PROJECT_ROOT__} />}
  </StrictMode>,
);
