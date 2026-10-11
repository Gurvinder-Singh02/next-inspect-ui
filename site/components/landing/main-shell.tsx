import { SiteFooter } from "@/components/landing/site-footer"
import { SiteNav } from "@/components/landing/site-nav"

export const MainShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col py-0 lg:flex-row lg:py-12">
        <SiteNav />
        <div className="mx-auto w-full max-w-3xl">
          <main
            id="content"
            tabIndex={-1}
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
