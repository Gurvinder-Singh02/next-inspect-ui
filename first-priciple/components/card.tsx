import { type ReactNode } from "react"

export const Card = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) => {
  return (
    <div
      data-src="components/card.tsx:5:3"
      data-name="Card"
      className="rounded-lg border bg-card p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {children}
    </div>
  )
}
