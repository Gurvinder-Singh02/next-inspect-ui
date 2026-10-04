"use client";
import React from "react";

const colorMap: Record<string, { background: string; color: string }> = {
  blue: { background: "#dbeafe", color: "#1e40af" },
  green: { background: "#dcfce7", color: "#166534" },
  red: { background: "#fee2e2", color: "#991b1b" },
  yellow: { background: "#fef9c3", color: "#854d0e" },
  purple: { background: "#f3e8ff", color: "#6b21a8" },
  gray: { background: "#f3f4f6", color: "#374151" },
};

export const InlineTag = ({
  children,
  color = "gray",
  removable = false,
  onRemove,
  "data-testid": testId,
}: {
  children: React.ReactNode;
  color?: string;
  removable?: boolean;
  onRemove?: () => void;
  "data-testid"?: string;
}) => {
  const palette = colorMap[color] || colorMap.gray;

  return (
    <span
      data-testid={testId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 500,
        background: palette.background,
        color: palette.color,
      }}
    >
      {children}
      {removable && (
        <button
          onClick={onRemove}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 0,
            fontSize: 14,
            lineHeight: 1,
            color: "inherit",
            opacity: 0.6,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
};
