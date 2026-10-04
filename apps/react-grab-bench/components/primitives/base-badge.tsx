"use client";
export const BaseBadge = ({
  children,
  "data-testid": testId,
}: {
  children: React.ReactNode;
  "data-testid"?: string;
}) => (
  <span
    data-testid={testId}
    style={{
      padding: "2px 8px",
      borderRadius: 99,
      fontSize: 11,
      border: "1px solid var(--border)",
    }}
  >
    {children}
  </span>
);
