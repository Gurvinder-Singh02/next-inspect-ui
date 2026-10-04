"use client";

interface ToolTriggerProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ToolTrigger = ({
  children,
  "data-testid": testId,
}: ToolTriggerProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "ToolTrigger"}
  </div>
);
