"use client";

export const ColorSwatch = ({
  color,
  "data-testid": testId,
}: {
  color: string;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      width: 32,
      height: 32,
      borderRadius: 6,
      background: color,
      border: "1px solid var(--border)",
    }}
  />
);
