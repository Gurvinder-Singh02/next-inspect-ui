"use client";

export const ThemePreview = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      borderRadius: 6,
      border: "1px solid var(--border)",
      fontSize: 11,
    }}
  >
    Theme: light
  </div>
);
