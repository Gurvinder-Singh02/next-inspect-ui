"use client";

import React from "react";

interface SearchCoreProps {
  placeholder?: string;
  "data-testid"?: string;
}

export const SearchCore = ({
  placeholder = "Search...",
  "data-testid": testId,
}: SearchCoreProps) => (
  <div
    data-testid={testId}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 12px",
      border: "1px solid var(--border)",
      borderRadius: 6,
      backgroundColor: "#f9fafb",
    }}
  >
    <span style={{ color: "#9ca3af", fontSize: 14 }}>&#x1F50D;</span>
    <input
      type="text"
      placeholder={placeholder}
      style={{
        border: "none",
        outline: "none",
        backgroundColor: "transparent",
        fontSize: 14,
        flex: 1,
      }}
    />
  </div>
);
