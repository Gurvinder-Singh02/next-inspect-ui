"use client";
import React from "react";
import { RenderAdapter } from "@/lib/render-adapter";

interface DeploymentStatusProps {
  "data-testid"?: string;
}

export const DeploymentStatus = ({
  "data-testid": testId,
}: DeploymentStatusProps) => (
  <RenderAdapter testId={testId} variant="filled">
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#22c55e",
        }}
      />
      <span style={{ fontWeight: 600 }}>Production</span>
      <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
        v3.2.1 — deployed 4h ago
      </span>
    </div>
  </RenderAdapter>
);
