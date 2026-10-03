
import "./globals.css"
import { CuelumeBind } from "@/components/cuelume-bind"
import { InspectUI } from "next-inspect-ui"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="antialiased"
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <CuelumeBind />
            {children}
            <Toaster />
            {process.env.NODE_ENV === "development" && (
              <InspectUI projectRoot={process.cwd()} />
            )}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
