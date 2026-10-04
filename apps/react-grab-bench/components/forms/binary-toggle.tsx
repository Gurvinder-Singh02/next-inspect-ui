"use client";

interface BinaryToggleProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const BinaryToggle = ({
  children,
  "data-testid": testId,
}: BinaryToggleProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "BinaryToggle"}
  </div>
);
