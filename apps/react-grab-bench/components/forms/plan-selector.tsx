"use client";

interface PlanSelectorProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const PlanSelector = ({
  children,
  "data-testid": testId,
}: PlanSelectorProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "PlanSelector"}
  </div>
);
