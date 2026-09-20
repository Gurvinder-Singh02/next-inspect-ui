import type { ReactNode } from "react"

import { CodeBlock } from "@/components/landing/code-block"

export const WorksWithPattern = ({
  title,
  description,
  preview,
  code,
  html,
}: {
  title: string
  description: string
  preview: ReactNode
  code: string
  html: string
}) => (
  <section className="flex flex-col gap-3">
    <h2 className="capitalize">
      {title}
    </h2>
    <p>
      {description}
    </p>
    <div className="flex min-h-28 flex-wrap items-center justify-center gap-3 rounded-xl bg-card px-6 py-8">
      {preview}
    </div>
    <CodeBlock code={code} html={html} />
  </section>
)
