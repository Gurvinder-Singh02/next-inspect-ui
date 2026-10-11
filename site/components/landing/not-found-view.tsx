"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpLeftFromCircleIcon } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const NotFoundTooltip = ({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) => (
  <Tooltip>
    <TooltipTrigger type="button" className={className}>
      {children}
      <span className="sr-only">{title}</span>
    </TooltipTrigger>
    <TooltipContent side="bottom" sideOffset={15}>
      {title}
    </TooltipContent>
  </Tooltip>
)

export const NotFoundView = () => {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-6 text-center">
        <h3 className="font-mono text-xs font-medium tracking-tight text-foreground/50 uppercase lg:text-sm">
          404 page not found
        </h3>
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-base font-medium tracking-tight text-foreground leading-loose lg:text-xl">
            Bruh you&apos;re looking for something that doesn&apos;t exist
          </p>
          <div className="flex items-center justify-center gap-4">
            <div
              onClick={handleBack}
              className="relative flex cursor-pointer items-center justify-center gap-2 active:scale-95"
            >
              <NotFoundTooltip
                title="Go back"
                className="flex size-8 items-center justify-center rounded-full bg-muted4"
              >
                <span className="flex size-full cursor-pointer items-center justify-center">
                  <ArrowUpLeftFromCircleIcon className="size-4" />
                </span>
              </NotFoundTooltip>
              Go back
            </div>
            <Link
              href="/"
              className="relative flex cursor-pointer items-center justify-center gap-2 active:scale-95"
            >
              <NotFoundTooltip
                title="Home"
                className="flex size-8 items-center justify-center rounded-full bg-muted4"
              >
                <div className="size-6 rounded-full bg-accent" />
              </NotFoundTooltip>
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
