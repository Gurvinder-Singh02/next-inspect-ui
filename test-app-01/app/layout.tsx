import { Geist, Geist_Mono, Inter } from "next/font/google"
import { InspectUI } from "next-inspect-ui"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          {children}
          {process.env.NODE_ENV === "development" && (
            <InspectUI projectRoot={process.cwd()} />
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
