import type { Metadata } from "next";
import "./globals.css";
import { StyledComponentsRegistry } from "@/components/providers/styled-registry";
import { ProviderStack } from "@/components/providers/provider-stack";

export const metadata: Metadata = {
  title: "React Grab Bench - Benchmark Harness",
  description: "330-case test harness for benchmarking coding agent element retrieval",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const BenchHarness =
    process.env.NODE_ENV === "development"
      ? (await import("@/components/bench-harness")).default
      : null;
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <ProviderStack>{children}</ProviderStack>
        </StyledComponentsRegistry>
        {BenchHarness ? <BenchHarness /> : null}
        <div id="portal-root" />
      </body>
    </html>
  );
}
