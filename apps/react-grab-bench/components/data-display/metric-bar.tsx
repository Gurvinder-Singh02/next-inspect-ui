"use client";

interface MetricBarProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const MetricBar = ({
  children,
  "data-testid": testId,
}: MetricBarProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "MetricBar"}
  </div>
);
