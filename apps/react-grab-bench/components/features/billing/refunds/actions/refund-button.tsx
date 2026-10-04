"use client";

interface RefundButtonProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const RefundButton = ({
  children,
  "data-testid": testId,
}: RefundButtonProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "RefundButton"}
  </div>
);
