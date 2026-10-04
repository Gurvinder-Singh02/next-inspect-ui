"use client";

interface AuditRowProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const AuditRow = ({
  children,
  "data-testid": testId,
}: AuditRowProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "AuditRow"}
  </div>
);
