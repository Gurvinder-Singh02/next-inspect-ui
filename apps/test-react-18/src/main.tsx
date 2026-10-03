import { StrictMode, type ComponentType } from "react"
import { createRoot } from "react-dom/client"
import { InspectUI as React19InspectUI, type InspectUIProps } from "next-inspect-ui"
import { App } from "./App"
import "./style.css"

// Bridge React 19 declaration types for this experimental React 18 runtime test.
const InspectUI = React19InspectUI as unknown as ComponentType<InspectUIProps>

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    {import.meta.env.DEV && <InspectUI projectRoot={__PROJECT_ROOT__} />}
  </StrictMode>,
)
