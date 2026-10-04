"use client";
export const StatusDot = ({
  status,
  "data-testid": testId,
}: {
  status: "online" | "offline" | "busy";
  "data-testid"?: string;
}) => (
  <span
    data-testid={testId}
    style={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background:
        status === "online"
          ? "#22c55e"
          : status === "busy"
            ? "#f59e0b"
            : "#94a3b8",
    }}
  />
);
