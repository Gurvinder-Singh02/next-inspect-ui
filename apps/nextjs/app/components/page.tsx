import { ActivateAgentDialog } from "@/components/create-preview/preview/cards/activate-agent-dialog"
import { BarChartCard } from "@/components/create-preview/preview/cards/bar-chart-card"
import { CodespacesCard } from "@/components/create-preview/preview/cards/codespaces-card"
import { Contributors } from "@/components/create-preview/preview/cards/contributors"
import { FileUpload } from "@/components/create-preview/preview/cards/file-upload"
import { Invoice } from "@/components/create-preview/preview/cards/invoice"
import { LiveWaveformCard } from "@/components/create-preview/preview/cards/live-waveform"
import { SleepReport } from "@/components/create-preview/preview/cards/sleep-report"
import { StyleOverview } from "@/components/create-preview/preview/cards/style-overview"
import { TypographySpecimen } from "@/components/create-preview/preview/cards/typography-specimen"
import { UsageCard } from "@/components/create-preview/preview/cards/usage-card"
import { YearlyActivity } from "@/components/create-preview/preview/cards/yearly-activity"

export default function ComponentsPage() {
  return (
    <main className="flex min-h-svh flex-col bg-background">
      <header className="pt-52 pb-24">
        <div className="flex h-full w-full flex-col items-center justify-center">
          <div className="-mt-10 mb-20 grid content-start justify-items-center gap-6 text-center">
            <span className="relative max-w-[22ch] text-xs leading-tight uppercase opacity-40 after:absolute after:top-full after:left-1/2 after:h-16 after:w-px after:bg-linear-to-b after:from-transparent after:to-foreground after:content-['']">
              Inspect Components Press ⌥ + x to open the inspector
            </span>
          </div>
        </div>
      </header>
      <section className="p-4 md:p-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-4 md:grid-cols-3 md:gap-6">
          <div className="flex flex-col gap-4 md:gap-6">
            <StyleOverview />
            <TypographySpecimen />
            <CodespacesCard />
            <Invoice />
          </div>
          <div className="flex flex-col gap-4 md:gap-6">
            <BarChartCard />
            <ActivateAgentDialog />
            <Contributors />
            <SleepReport />
          </div>
          <div className="flex flex-col gap-4 md:gap-6">
            <YearlyActivity />
            <LiveWaveformCard />
            <FileUpload />
            <UsageCard />
          </div>
        </div>
      </section>
    </main>
  )
}
