import { UsageVideo } from "@/components/landing/usage-video"

export default function UsagePage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="font-inter text-2xl leading-tight font-semibold tracking-tight">
          Usage
        </h1>
        <p className="font-inter text-[14px] leading-relaxed text-muted-foreground">
          See next-inspect-ui in action.
        </p>
      </header>

      <UsageVideo className="w-full" />
    </>
  )
}
