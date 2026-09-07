import { CodeBlock } from "@/components/landing/code-block"
import { highlightCode } from "@/lib/highlight-code"

const COMING_SOON = `// Coming soon`

export default async function SourcePage() {
  const html = await highlightCode(COMING_SOON, "tsx")

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="font-inter text-2xl leading-tight font-semibold tracking-tight">
          Source Code
        </h1>
        <p className="font-inter text-[14px] leading-relaxed text-muted-foreground">
          Full package source will live here soon.
        </p>
      </header>

      <CodeBlock code={COMING_SOON} html={html} />
    </>
  )
}
