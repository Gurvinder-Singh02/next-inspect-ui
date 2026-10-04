"use client";
export const KeyValue = ({
  label,
  value,
  "data-testid": testId,
}: {
  label: string;
  value: string;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      padding: "4px 0",
    }}
  >
    <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
    <span style={{ fontWeight: 500 }}>{value}</span>
  </div>
);
