"use client"

import { ActivateAgentDialog } from "@/components/create-preview/preview/cards/activate-agent-dialog"
import { AnalyticsCard } from "@/components/create-preview/preview/cards/analytics-card"
import { AnomalyAlert } from "@/components/create-preview/preview/cards/anomaly-alert"
import { BarChartCard } from "@/components/create-preview/preview/cards/bar-chart-card"
import { BookAppointment } from "@/components/create-preview/preview/cards/book-appointment"
import { CodespacesCard } from "@/components/create-preview/preview/cards/codespaces-card"
import { ContributionsActivity } from "@/components/create-preview/preview/cards/contributions-activity"
import { Contributors } from "@/components/create-preview/preview/cards/contributors"
import { EnvironmentVariables } from "@/components/create-preview/preview/cards/environment-variables"
import { FeedbackForm } from "@/components/create-preview/preview/cards/feedback-form"
import { FileUpload } from "@/components/create-preview/preview/cards/file-upload"
import { GithubProfile } from "@/components/create-preview/preview/cards/github-profile"
import { IconPreviewGrid } from "@/components/create-preview/preview/cards/icon-preview-grid"
import { InviteTeam } from "@/components/create-preview/preview/cards/invite-team"
import { Invoice } from "@/components/create-preview/preview/cards/invoice"
import { LiveWaveformCard } from "@/components/create-preview/preview/cards/live-waveform"
import { NoTeamMembers } from "@/components/create-preview/preview/cards/no-team-members"
import { NotFound } from "@/components/create-preview/preview/cards/not-found"
import { ObservabilityCard } from "@/components/create-preview/preview/cards/observability-card"
import { PieChartCard } from "@/components/create-preview/preview/cards/pie-chart-card"
import { ReportBug } from "@/components/create-preview/preview/cards/report-bug"
import { ShippingAddress } from "@/components/create-preview/preview/cards/shipping-address"
import { Shortcuts } from "@/components/create-preview/preview/cards/shortcuts"
import { SkeletonLoading } from "@/components/create-preview/preview/cards/skeleton-loading"
import { SleepReport } from "@/components/create-preview/preview/cards/sleep-report"
import { StyleOverview } from "@/components/create-preview/preview/cards/style-overview"
import { TypographySpecimen } from "@/components/create-preview/preview/cards/typography-specimen"
import { UIElements } from "@/components/create-preview/preview/cards/ui-elements"
import { UsageCard } from "@/components/create-preview/preview/cards/usage-card"
import { Visitors } from "@/components/create-preview/preview/cards/visitors"
import { YearlyActivity } from "@/components/create-preview/preview/cards/yearly-activity"

export default function PreviewExample() {
  return (
    <div className="overflow-x-auto overflow-y-hidden bg-muted contain-[paint] [--gap:--spacing(4)] 3xl:[--gap:--spacing(12)] md:[--gap:--spacing(10)] dark:bg-background style-lyra:md:[--gap:--spacing(6)] style-mira:md:[--gap:--spacing(6)]">
      <div className="flex w-full min-w-max justify-center">
        <div
          className="grid w-[2400px] grid-cols-7 items-start gap-(--gap) bg-muted p-(--gap) md:w-[3000px] dark:bg-background style-lyra:md:w-[2600px] style-mira:md:w-[2600px] *:[div]:gap-(--gap)"
          data-slot="capture-target"
        >
          <div className="flex flex-col p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <StyleOverview />
            <TypographySpecimen />
            <div className="md:hidden">
              <UIElements />
            </div>
            <CodespacesCard />
            <Invoice />
          </div>
          <div className="flex flex-col p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <IconPreviewGrid />
            <div className="hidden w-full md:flex">
              <UIElements />
            </div>
            <ObservabilityCard />
            <ShippingAddress />
          </div>
          <div className="flex flex-col p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <EnvironmentVariables />
            <BarChartCard />
            <InviteTeam />
            <ActivateAgentDialog />
          </div>
          <div className="flex flex-col p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <SkeletonLoading />
            <PieChartCard />
            <NoTeamMembers />
            <ReportBug />
            <Contributors />
          </div>
          <div className="flex flex-col p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <FeedbackForm />
            <BookAppointment />
            <SleepReport />
            <GithubProfile />
          </div>
          <div className="flex flex-col p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <YearlyActivity />
            <FileUpload />
            <AnalyticsCard />
            <UsageCard />
            <Shortcuts />
          </div>
          <div className="flex flex-col p-px [contain-intrinsic-size:380px_1200px] [content-visibility:auto]">
            <AnomalyAlert />
            <LiveWaveformCard />
            <Visitors />
            <ContributionsActivity />
            <NotFound />
          </div>
        </div>
      </div>
    </div>
  )
}
