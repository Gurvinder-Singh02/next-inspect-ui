import type { Metadata } from "next"
import Script from "next/script"
import { cookies } from "next/headers"
import { InspectorSwitch } from "@/components/inspector-switch"
import { inspectorId } from "@/lib/inspectors"
import "./globals.css"

export const metadata: Metadata = { title: "Competitor · Inspector lab", description: "Compare four React inspectors on the same page." }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const dev = process.env.NODE_ENV === "development"
  const selected = dev ? inspectorId((await cookies()).get("competitor-inspector")?.value) : "off"
  return (
    <html lang="en">
      <head>{selected === "react-grab" && <Script src="/react-grab.js" strategy="beforeInteractive" />}</head>
      <body>
        {dev && <InspectorSwitch selected={selected} projectRoot={process.cwd()} />}
        {children}
      </body>
    </html>
  )
}
