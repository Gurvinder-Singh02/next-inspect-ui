"use client"

import Link from "next/link"

import { contentLinkClassName } from "@/lib/content-link"

export const ErrorView = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-6 text-center">
        <h3 className="font-mono text-xs font-medium tracking-tight text-foreground/50 uppercase lg:text-sm">
          Something went wrong
        </h3>
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="max-w-lg text-base font-medium tracking-tight text-balance text-foreground has-[a:hover]:text-foreground/10 lg:text-xl">
            Bruh something broke on this page{" "}
            <Link href="/" className={contentLinkClassName}>
              Go Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
