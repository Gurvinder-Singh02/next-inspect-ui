"use client";

interface ApprovalButtonProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ApprovalButton = ({
  children,
  "data-testid": testId,
}: ApprovalButtonProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "ApprovalButton"}
  </div>
);
