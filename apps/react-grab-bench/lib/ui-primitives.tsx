"use client";

export const primitiveCardConfig = { gap: 8, padding: 16 };

export const PrimitiveCard = ({
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
    {children ?? "PrimitiveCard"}
  </div>
);
