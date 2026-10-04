"use client";

interface BuildStatusProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const BuildStatus = ({
  children,
  "data-testid": testId,
}: BuildStatusProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "BuildStatus"}
  </div>
);
