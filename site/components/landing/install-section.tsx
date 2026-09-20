import { CodeBlock } from "@/components/landing/code-block"
import { CopyableText } from "@/components/landing/copyable-text"
import {
  InstallCommand,
  type InstallCommandTab,
  type PackageManager,
} from "@/components/landing/install-command"
import { highlightCode } from "@/lib/highlight-code"

const INSTALL_COMMANDS: Record<PackageManager, string> = {
  npm: "npm i next-inspect-ui",
  pnpm: "pnpm add next-inspect-ui",
  yarn: "yarn add next-inspect-ui",
  bun: "bun add next-inspect-ui",
}

const AGENT_PROMPT = `Install next-inspect-ui (npm i next-inspect-ui). Add <InspectUI projectRoot={process.cwd()} /> as a sibling alongside {children} in the root layout (not wrapping it), only in development.`

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
          <InspectUI projectRoot={process.cwd()} />
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
        <h2 className="font-inter text-[15px] font-medium tracking-tight">
          Usage
        </h2>
        <p className="font-inter text-[14px] leading-relaxed text-muted-foreground">
          Add <InlineCode>{`<InspectUI />`}</InlineCode> to your layout:
        </p>
        <CodeBlock code={LAYOUT_CODE} html={layoutHtml} />
      </div>
    </div>
  )
}
