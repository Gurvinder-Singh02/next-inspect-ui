"use client";

interface KpiCellProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const KpiCell = ({ children, "data-testid": testId }: KpiCellProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "KpiCell"}
  </div>
);
