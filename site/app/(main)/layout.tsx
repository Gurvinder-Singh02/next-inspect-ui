import { MainShell } from "@/components/landing/main-shell"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainShell>{children}</MainShell>
}

