"use client"

import { ErrorView } from "@/components/landing/error-view"

export default function Error(_props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorView />
}
