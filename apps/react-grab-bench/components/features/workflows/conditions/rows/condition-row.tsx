"use client";

interface ConditionRowProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ConditionRow = ({
  children,
  "data-testid": testId,
}: ConditionRowProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "ConditionRow"}
  </div>
);
