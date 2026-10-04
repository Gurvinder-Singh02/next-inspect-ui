"use client";

interface WebhookCardProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const WebhookCard = ({
  children,
  "data-testid": testId,
}: WebhookCardProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "WebhookCard"}
  </div>
);
