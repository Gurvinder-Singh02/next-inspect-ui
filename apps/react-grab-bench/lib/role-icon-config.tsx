"use client";
import React from "react";

interface RoleIconEntry {
  icon: React.ReactNode;
  label: string;
  color: string;
}

const ROLE_ICON_MAP: Record<string, RoleIconEntry> = {
  admin: {
    icon: (
      <svg width="16" height="16">
        <circle cx="8" cy="8" r="6" fill="#ef4444" />
      </svg>
    ),
    label: "Admin",
    color: "#ef4444",
  },
  editor: {
    icon: (
      <svg width="16" height="16">
        <rect x="2" y="2" width="12" height="12" rx="2" fill="#f59e0b" />
      </svg>
    ),
    label: "Editor",
    color: "#f59e0b",
  },
  viewer: {
    icon: (
      <svg width="16" height="16">
        <polygon points="8,2 14,14 2,14" fill="#3b82f6" />
      </svg>
    ),
    label: "Viewer",
    color: "#3b82f6",
  },
};

export const RoleIconDisplay = ({
  role,
  "data-testid": testId,
}: {
  role: string;
  "data-testid"?: string;
}) => {
  const entry = ROLE_ICON_MAP[role] ?? ROLE_ICON_MAP.viewer;
  return (
    <div
      data-testid={testId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        border: `1px solid ${entry.color}`,
        borderRadius: 4,
      }}
    >
      {entry.icon}
      <span style={{ fontSize: 12, color: entry.color }}>{entry.label}</span>
    </div>
  );
};
