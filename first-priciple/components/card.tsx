"use client"

import { type ReactNode } from "react"

/** Named client function so fiber.type.name is "Card" on the client. */
export function Card({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {children}
    </div>
  )
}
