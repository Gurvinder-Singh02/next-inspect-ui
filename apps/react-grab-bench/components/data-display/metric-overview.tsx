"use client";

interface MetricCardProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const MetricCard = ({
  children,
  "data-testid": testId,
}: MetricCardProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "MetricCard"}
  </div>
);
