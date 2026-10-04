"use client";
export const BaseInput = ({
  label,
  "data-testid": testId,
}: {
  label: string;
  "data-testid"?: string;
}) => (
  <label
    data-testid={testId}
    style={{ display: "flex", flexDirection: "column", gap: 4 }}
  >
    <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
    <input
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid var(--border)",
      }}
    />
  </label>
);
