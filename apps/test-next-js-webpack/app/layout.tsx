import "./globals.css";
import { CuelumeBind } from "@/components/cuelume-bind";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const InspectUI = process.env.NODE_ENV === "development"
    ? (await import("next-inspect-ui")).InspectUI
    : null
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <CuelumeBind />
            {children}
            <Toaster />
            {InspectUI && <InspectUI projectRoot={process.cwd()} />}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
