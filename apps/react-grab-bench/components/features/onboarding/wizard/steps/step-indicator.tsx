"use client";

interface StepIndicatorProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const StepIndicator = ({
  children,
  "data-testid": testId,
}: StepIndicatorProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "StepIndicator"}
  </div>
);
