"use client";

interface LabelGroupProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const LabelGroup = ({
  children,
  "data-testid": testId,
}: LabelGroupProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "LabelGroup"}
  </div>
);
