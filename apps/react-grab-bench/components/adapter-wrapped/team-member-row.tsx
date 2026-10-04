"use client";
import React from "react";
import { RenderAdapter } from "@/lib/render-adapter";

interface TeamMemberRowProps {
  "data-testid"?: string;
}

export const TeamMemberRow = ({
  "data-testid": testId,
}: TeamMemberRowProps) => (
  <RenderAdapter testId={testId} variant="ghost">
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#6366f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          JD
        </div>
        <span>Jane Doe</span>
      </div>
      <span
        style={{
          fontSize: 11,
          padding: "2px 6px",
          borderRadius: 4,
          background: "var(--muted)",
        }}
      >
        Admin
      </span>
    </div>
  </RenderAdapter>
);
