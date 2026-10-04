"use client";
export const BaseButton = ({
  children,
  "data-testid": testId,
}: {
  children: React.ReactNode;
  "data-testid"?: string;
}) => (
  <button
    data-testid={testId}
    style={{
      padding: "6px 14px",
      borderRadius: 6,
      border: "1px solid var(--border)",
      background: "var(--background)",
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);
