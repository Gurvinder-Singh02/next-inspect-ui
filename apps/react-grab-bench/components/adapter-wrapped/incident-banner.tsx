"use client";
import React from "react";
import { RenderAdapter } from "@/lib/render-adapter";

interface IncidentBannerProps {
  "data-testid"?: string;
}

export const IncidentBanner = ({
  "data-testid": testId,
}: IncidentBannerProps) => (
  <RenderAdapter testId={testId} variant="outlined">
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 16 }}>🔥</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>
          Degraded API performance
        </div>
        <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>
          Investigating — started 12 min ago
        </div>
      </div>
    </div>
  </RenderAdapter>
);
