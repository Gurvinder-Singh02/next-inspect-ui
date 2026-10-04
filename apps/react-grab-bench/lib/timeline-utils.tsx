"use client";

export const formatRelativeTime = (date: Date) => {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  return Math.floor(diff / 3600000) + "h ago";
};

export const TimelineDot = ({
  label,
  active,
  "data-testid": testId,
}: {
  label: string;
  active?: boolean;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ display: "flex", alignItems: "center", gap: 8 }}
  >
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: active ? "var(--foreground)" : "var(--border)",
      }}
    />
    <span style={{ fontSize: 12 }}>{label}</span>
  </div>
);
