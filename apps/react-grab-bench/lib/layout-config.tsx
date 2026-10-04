"use client";

export const layoutConfig = { gap: 8, padding: 16, maxWidth: 1200 };

export const ConfigList = ({
  children,
  "data-testid": testId,
}: {
  children?: React.ReactNode;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}
  >
    {children ?? "ConfigList"}
  </div>
);
