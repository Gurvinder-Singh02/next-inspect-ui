"use client";

interface NotificationBoxProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const NotificationBox = ({
  children,
  "data-testid": testId,
}: NotificationBoxProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "NotificationBox"}
  </div>
);
