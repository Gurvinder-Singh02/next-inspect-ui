"use client"

import type { ReactNode } from "react"

/** Named client component so fiber.type.name is "TestCard". */
export function TestCard({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="mt-8 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      {children}
    </div>
  )
}
