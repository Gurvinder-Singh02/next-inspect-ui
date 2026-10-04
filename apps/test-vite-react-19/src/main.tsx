import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { loadCaseSources } from "./load-case-sources";
import { ThemeProvider } from "@/components/theme-provider";
import "./style.css";

const InspectUI = import.meta.env.DEV ? (await import("next-inspect-ui")).InspectUI : null;

const sourcesByCase = await loadCaseSources();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App sourcesByCase={sourcesByCase} />
    </ThemeProvider>
    {InspectUI && <InspectUI projectRoot={__PROJECT_ROOT__} />}
  </StrictMode>,
);
