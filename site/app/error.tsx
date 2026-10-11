"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleArrowOutUpLeft } from "lucide-react"

import { cn } from "@/lib/utils"

const actionClassName = cn(
  "relative flex cursor-pointer items-center gap-2 text-[15px] text-foreground active:scale-95"
)

const iconButtonClassName = cn(
  "flex size-8 items-center justify-center rounded-full bg-muted4 text-foreground"
)

export default function Error(_props: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const router = useRouter()

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="space-y-6 text-center">
        <h3 className="font-inter text-sm font-medium tracking-tight text-foreground">
          Something went wrong
        </h3>
        <div className="mt-4 flex flex-col items-center gap-2 font-inter text-[15px] leading-relaxed text-muted-foreground">
          <div className="flex items-center gap-4">
            <button type="button" onClick={goBack} className={actionClassName}>
              <span className={iconButtonClassName} aria-hidden>
                <CircleArrowOutUpLeft className="size-4" />
              </span>
              Go back
            </button>
            <Link href="/" className={actionClassName}>
              <span className={iconButtonClassName} aria-hidden>
                <img src="/logos/logo.svg" alt="" className="size-6" />
              </span>
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
