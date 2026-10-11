import {
  InstallCommand,
  type InstallCommandTab,
  type PackageManager,
} from "@/components/landing/install-command"
import { UsageTabs, type UsageTab } from "@/components/landing/usage-tabs"
import { highlightCode } from "@/lib/highlight-code"

const INSTALL_COMMANDS: Record<PackageManager, string> = {
  npm: "npm i -D next-inspect-ui",
  pnpm: "pnpm add -D next-inspect-ui",
  yarn: "yarn add -D next-inspect-ui",
  bun: "bun add -D next-inspect-ui",
}

const LAYOUT_CODE = `export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const InspectUI = process.env.NODE_ENV === "development"
    ? (await import("next-inspect-ui")).InspectUI
    : null

  return (
    <html lang="en">
      <body>
        {children}
        {InspectUI && (
          <InspectUI />
        )}
      </body>
    </html>
  )
}`

const VITE_CODE = `import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

async function main() {
  const InspectUI = import.meta.env.DEV
    ? (await import("next-inspect-ui")).InspectUI
    : null

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
      {InspectUI && <InspectUI />}
    </StrictMode>
  )
}

void main()`

const CRA_CODE = `import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

async function main() {
  const InspectUI = process.env.NODE_ENV === "development"
    ? (await import("next-inspect-ui")).InspectUI
    : null

  const root = ReactDOM.createRoot(document.getElementById("root"))
  root.render(
    <React.StrictMode>
      <App />
      {InspectUI && <InspectUI />}
    </React.StrictMode>
  )
}

void main()`

export const InstallSection = async () => {
  const usage = [
    {
      id: "nextjs",
      label: "Next.js",
      code: LAYOUT_CODE,
      description:
        "Add this to app/layout.tsx. Keep your existing fonts, providers, and body styles.",
      prompt:
        "Install next-inspect-ui as a dev dependency. In the async Next.js root layout, dynamically import InspectUI inside a NODE_ENV development check. Mount it once alongside children inside body, preserving existing fonts, providers, and styles.",
    },
    {
      id: "vite",
      label: "React (Vite)",
      code: VITE_CODE,
      description:
        "Add this to src/main.tsx. Vite replaces import.meta.env.DEV at build time.",
      prompt:
        "Install next-inspect-ui as a dev dependency in this React + Vite app. In src/main.tsx, dynamically import InspectUI only when import.meta.env.DEV is true. Mount it once alongside App, preserving StrictMode, providers, and styles. Keep it out of the production bundle.",
    },
    {
      id: "react",
      label: "React",
      code: CRA_CODE,
      description:
        "For Create React App, update src/index.js. Keep any existing performance reporting after the render.",
      prompt:
        "Install next-inspect-ui as a dev dependency in this React app. In the root entry, dynamically import InspectUI inside a NODE_ENV development check. Mount it once alongside App, preserving StrictMode, providers, styles, and performance reporting. Keep it out of the production bundle.",
    },
    {
      id: "react18",
      label: "React 18",
      code: VITE_CODE,
      description:
        "React 18 + Vite is experimental. The package declares React 19+ peer support; React 18 source locations may be incomplete.",
      prompt:
        "Set up next-inspect-ui for this experimental React 18 + Vite app. Check the React 19+ peer dependency requirement first and explain any compatibility changes needed. Dynamically import InspectUI only when import.meta.env.DEV is true and mount it once alongside App. Preserve existing providers and styles; do not upgrade React without asking.",
    },
  ]
  const [installTabs, usageTabs] = await Promise.all([
    Promise.all(
      (Object.entries(INSTALL_COMMANDS) as [PackageManager, string][]).map(
        async ([manager, code]): Promise<InstallCommandTab> => ({
          manager,
          code,
          html: await highlightCode(code, "bash"),
        })
      )
    ),
    Promise.all(
      usage.map(async (tab): Promise<UsageTab> => ({
        ...tab,
        html: await highlightCode(tab.code, tab.id === "react" ? "jsx" : "tsx"),
      }))
    ),
  ])
  return (
    <div className="flex flex-col gap-12">
      <InstallCommand tabs={installTabs} />
      <section className="flex flex-col gap-3" aria-labelledby="overview-usage">
        <h2 id="overview-usage">Usage</h2>
        <UsageTabs tabs={usageTabs} />
      </section>
    </div>
  )
}
