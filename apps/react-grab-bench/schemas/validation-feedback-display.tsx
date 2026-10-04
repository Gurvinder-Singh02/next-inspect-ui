"use client";

interface ValidationFeedbackDisplayProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ValidationFeedbackDisplay = ({
  children,
  "data-testid": testId,
}: ValidationFeedbackDisplayProps) => (
  <div
    data-testid={testId}
    style={{
      padding: "6px 12px",
      background: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: 4,
      fontSize: 12,
      color: "#991b1b",
    }}
  >
    {children ?? "Validation error"}
  </div>
);
