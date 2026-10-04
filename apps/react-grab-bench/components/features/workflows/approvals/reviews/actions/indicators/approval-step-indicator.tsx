"use client";

interface ApprovalStepIndicatorProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ApprovalStepIndicator = ({
  children,
  "data-testid": testId,
}: ApprovalStepIndicatorProps) => (
  <div
    data-testid={testId}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      background: "#ecfdf5",
      border: "1px solid #a7f3d0",
      borderRadius: 12,
      fontSize: 12,
      color: "#065f46",
    }}
  >
    {children ?? "Step approved"}
  </div>
);
