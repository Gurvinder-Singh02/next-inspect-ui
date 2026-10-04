"use client";

interface SortButtonProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const SortButton = ({
  children,
  "data-testid": testId,
}: SortButtonProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "SortButton"}
  </div>
);
