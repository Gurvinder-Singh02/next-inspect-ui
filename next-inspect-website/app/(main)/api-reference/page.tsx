import { ApiReference } from "@/components/landing/api-reference"

export default function ApiReferencePage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="font-inter text-2xl leading-tight font-semibold tracking-tight">
          API Reference
        </h1>
        <p className="font-inter text-[14px] leading-relaxed text-muted-foreground">
          Props for InspectUI, tooltip, and spotlight configuration.
        </p>
      </header>

      <ApiReference />
    </>
  )
}
