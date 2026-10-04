"use client";
import React from "react";

interface StatusIconEntry {
  icon: React.ReactNode;
  label: string;
}

const STATUS_ICON_MAP: Record<string, StatusIconEntry> = {
  success: {
    icon: (
      <svg width="14" height="14">
        <circle cx="7" cy="7" r="5" fill="#22c55e" />
      </svg>
    ),
    label: "Success",
  },
  warning: {
    icon: (
      <svg width="14" height="14">
        <polygon points="7,2 13,12 1,12" fill="#f59e0b" />
      </svg>
    ),
    label: "Warning",
  },
  error: {
    icon: (
      <svg width="14" height="14">
        <rect x="2" y="2" width="10" height="10" rx="1" fill="#ef4444" />
      </svg>
    ),
    label: "Error",
  },
};

export const StatusIconDisplay = ({
  status = "success",
  "data-testid": testId,
}: {
  status?: string;
  "data-testid"?: string;
}) => {
  const entry = STATUS_ICON_MAP[status] ?? STATUS_ICON_MAP.success;
  return (
    <span
      data-testid={testId}
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
    >
      {entry.icon}
      <span style={{ fontSize: 12 }}>{entry.label}</span>
    </span>
  );
};
