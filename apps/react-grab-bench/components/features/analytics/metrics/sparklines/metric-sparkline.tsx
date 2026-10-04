"use client";

interface MetricSparklineProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const MetricSparkline = ({
  children,
  "data-testid": testId,
}: MetricSparklineProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "MetricSparkline"}
  </div>
);
