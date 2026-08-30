import { SiteNav } from "@/components/landing/site-nav"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-6xl bg-background text-foreground py-12 sm:py-24">
      <SiteNav />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 ">
        {children}
      </main>
    </div>
  )
}
