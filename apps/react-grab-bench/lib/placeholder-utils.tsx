"use client";

export const generatePlaceholder = (width: number, height: number) =>
  `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect fill="%23ddd" width="100%" height="100%"/></svg>`;

export const EmptyState = ({
  message,
  "data-testid": testId,
}: {
  message: string;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      padding: 32,
      textAlign: "center",
      color: "var(--muted-foreground)",
      border: "2px dashed var(--border)",
      borderRadius: 12,
    }}
  >
    <div style={{ fontSize: 32, marginBottom: 8 }}>∅</div>
    <div style={{ fontSize: 13 }}>{message}</div>
  </div>
);
