"use client";

export const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, value));
export const formatPercent = (value: number) =>
  clampPercent(value).toFixed(1) + "%";

export const ProgressRing = ({
  percent,
  "data-testid": testId,
}: {
  percent: number;
  "data-testid"?: string;
}) => {
  const clamped = clampPercent(percent);
  return (
    <div
      data-testid={testId}
      style={{ width: 48, height: 48, position: "relative" }}
    >
      <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke="var(--border)"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="3"
          strokeDasharray={`${clamped} ${100 - clamped}`}
        />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
        }}
      >
        {Math.round(clamped)}%
      </span>
    </div>
  );
};
