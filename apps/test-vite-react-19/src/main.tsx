import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { InspectUI } from "next-inspect-ui";
import App from "./App";
import { loadCaseSources } from "./load-case-sources";
import { ThemeProvider } from "@/components/theme-provider";
import "./style.css";

const sourcesByCase = await loadCaseSources();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App sourcesByCase={sourcesByCase} />
    </ThemeProvider>
    {import.meta.env.DEV && <InspectUI projectRoot={__PROJECT_ROOT__} />}
  </StrictMode>,
);
