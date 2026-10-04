"use client";

interface WebhookRetryStatusProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const WebhookRetryStatus = ({
  children,
  "data-testid": testId,
}: WebhookRetryStatusProps) => (
  <div
    data-testid={testId}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      background: "#fefce8",
      border: "1px solid #fde68a",
      borderRadius: 4,
      fontSize: 12,
      color: "#854d0e",
    }}
  >
    {children ?? "Retry pending"}
  </div>
);
