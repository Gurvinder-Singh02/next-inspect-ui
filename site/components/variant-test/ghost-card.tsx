import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export const GhostCard = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex flex-col gap-3", className)} {...props} />
)

export const GhostCardHeader = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div className={cn("flex flex-col gap-3", className)} {...props} />
)

export const GhostCardTitle = ({
  className,
  ...props
}: ComponentProps<"h3">) => (
  <h3
    className={cn("font-heading text-base font-medium", className)}
    {...props}
  />
)

export const GhostCardDescription = ({
  className,
  ...props
}: ComponentProps<"p">) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)

export const GhostCardContent = ({
  className,
  ...props
}: ComponentProps<"div">) => <div className={className} {...props} />

export const GhostCardFooter = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div className={cn("w-fit", className)} {...props} />
)
