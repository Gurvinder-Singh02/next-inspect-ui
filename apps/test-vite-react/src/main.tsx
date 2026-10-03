import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { InspectUI } from "next-inspect-ui"
import { App } from "./App"
import "./style.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    {import.meta.env.DEV && <InspectUI projectRoot={__PROJECT_ROOT__} />}
  </StrictMode>,
)
