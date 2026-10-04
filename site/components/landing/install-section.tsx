import { CodeBlock } from "@/components/landing/code-block"
import { CopyableText } from "@/components/landing/copyable-text"
import {
  InstallCommand,
  type InstallCommandTab,
  type PackageManager,
} from "@/components/landing/install-command"
import { highlightCode } from "@/lib/highlight-code"

const INSTALL_COMMANDS: Record<PackageManager, string> = {
  npm: "npm i -D next-inspect-ui",
  pnpm: "pnpm add -D next-inspect-ui",
  yarn: "yarn add -D next-inspect-ui",
  bun: "bun add -D next-inspect-ui",
}

const AGENT_PROMPT = `Install next-inspect-ui (npm i -D next-inspect-ui). Add <InspectUI /> as a sibling alongside {children} in the root layout (not wrapping it), only in development.`

const LAYOUT_CODE = `import { InspectUI } from "next-inspect-ui"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === "development" && (
          <InspectUI />
        )}
      </body>
    </html>
  )
}`

const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded-md bg-muted px-1.5 py-0.5 font-azeret-mono text-[12px] text-foreground">
    {children}
  </code>
)

export const InstallSection = async () => {
  const [installTabs, layoutHtml] = await Promise.all([
    Promise.all(
      (Object.entries(INSTALL_COMMANDS) as [PackageManager, string][]).map(
        async ([manager, code]): Promise<InstallCommandTab> => ({
          manager,
          code,
          html: await highlightCode(code, "bash"),
        })
      )
    ),
    highlightCode(LAYOUT_CODE, "tsx"),
  ])

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <InstallCommand tabs={installTabs} />
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-inter text-[14px] leading-relaxed text-muted-foreground">
          Or just tell your agent to set it up:
        </p>
        <CopyableText text={AGENT_PROMPT} />
      </div>

      <div className="flex flex-col gap-3">
        <h2>Usage</h2>
        <p>
          Add <InlineCode>{`<InspectUI />`}</InlineCode> to your layout:
        </p>
        <CodeBlock code={LAYOUT_CODE} html={layoutHtml} />
      </div>
    </div>
  )
}
