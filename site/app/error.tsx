"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpLeftFromCircleIcon } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ErrorTooltip = ({
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

export default function Error(_props: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="space-y-6 text-center">
        <h3 className="font-mono text-xs font-medium tracking-tight text-foreground/50 uppercase lg:text-sm">
          Something went wrong
        </h3>
        <div className="mt-4 flex flex-col items-center gap-2 text-base leading-loose font-medium tracking-tight text-foreground lg:text-xl">
          <div className="flex items-center justify-center gap-4">
            <div
              onClick={handleBack}
              className="relative flex cursor-pointer items-center justify-center gap-2 active:scale-95"
            >
              <ErrorTooltip
                title="Go back"
                className="flex size-8 items-center justify-center rounded-full bg-muted4"
              >
                <span className="flex size-full cursor-pointer items-center justify-center">
                  <ArrowUpLeftFromCircleIcon className="size-4" />
                </span>
              </ErrorTooltip>
              Go back
            </div>
            <Link
              href="/"
              className="relative flex cursor-pointer items-center justify-center gap-2 active:scale-95"
            >
              <ErrorTooltip
                title="Home"
                className="flex size-8 items-center justify-center rounded-full bg-muted4"
              >
                <div className="size-6 rounded-full bg-accent" />
              </ErrorTooltip>
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
