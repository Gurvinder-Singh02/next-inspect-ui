"use client";

interface ChecklistItemProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ChecklistItem = ({
  children,
  "data-testid": testId,
}: ChecklistItemProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "ChecklistItem"}
  </div>
);
