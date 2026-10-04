"use client";

interface DiffHeaderProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const DiffHeader = ({
  children,
  "data-testid": testId,
}: DiffHeaderProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "DiffHeader"}
  </div>
);
