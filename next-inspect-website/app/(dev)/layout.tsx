import { notFound } from "next/navigation"

// The (dev) group is the inspector's fixture matrix — the regression net the
// library is tested against. Route groups are cosmetic, so without this gate
// every fixture page would build and deploy with the public site.
export default function DevLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (process.env.NODE_ENV === "production") notFound()
  return children
}
