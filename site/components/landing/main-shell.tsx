import { SiteFooter } from "@/components/landing/site-footer"
import { SiteNav } from "@/components/landing/site-nav"

export const MainShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col py-0 lg:flex-row lg:py-12">
        <SiteNav />
        <div className="mx-auto w-full max-w-3xl">
          <main
            id="content"
            className="mx-auto flex min-h-[90vh] w-full max-w-3xl flex-1 flex-col gap-10 px-6 pt-8 pb-12 lg:py-0"
          >
            {children}
          </main>
          <div className="mx-auto w-full max-w-3xl space-y-3 px-6">
            <div className="mt-15 border-t border-border"></div>
            <SiteFooter />
          </div>
        </div>
      </div>
    </div>
  )
}
