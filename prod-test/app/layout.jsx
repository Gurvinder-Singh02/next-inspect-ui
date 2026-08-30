import { InspectUI } from "next-inspect-ui"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === "development" && (
          <InspectUI projectRoot={process.cwd()} />
        )}
      </body>
    </html>
  )
}
