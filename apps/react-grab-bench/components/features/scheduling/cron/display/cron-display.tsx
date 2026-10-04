"use client";

interface CronDisplayProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const CronDisplay = ({
  children,
  "data-testid": testId,
}: CronDisplayProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "CronDisplay"}
  </div>
);
