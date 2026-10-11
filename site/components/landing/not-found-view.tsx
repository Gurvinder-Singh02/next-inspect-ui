"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

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
          <p className="max-w-lg text-base font-medium tracking-tight text-balance text-foreground lg:text-xl has-[a:hover]:text-foreground/10">
            Bruh you&apos;re looking for something that doesn&apos;t exist{" "}
            <Link href="/" className="hover:text-foreground">Go Home</Link>
          </p>
     
        </div>
      </div>
    </div>
  )
}
