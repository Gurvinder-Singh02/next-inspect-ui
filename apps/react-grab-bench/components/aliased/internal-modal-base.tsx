"use client";

import React from "react";

interface ModalBaseProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ModalBase = ({
  children,
  "data-testid": testId,
}: ModalBaseProps) => (
  <div
    data-testid={testId}
    role="dialog"
    style={{
      padding: 24,
      border: "1px solid var(--border)",
      borderRadius: 12,
      backgroundColor: "#fff",
      boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      minWidth: 280,
    }}
  >
    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
      Confirm Action
    </div>
    <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
      {children || "Are you sure you want to proceed?"}
    </div>
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <button
        style={{
          padding: "6px 14px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          backgroundColor: "#fff",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Cancel
      </button>
      <button
        style={{
          padding: "6px 14px",
          borderRadius: 6,
          border: "none",
          backgroundColor: "#4f46e5",
          color: "#fff",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Confirm
      </button>
    </div>
  </div>
);
