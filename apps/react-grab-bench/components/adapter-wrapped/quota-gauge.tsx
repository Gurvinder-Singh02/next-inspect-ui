"use client";
import React from "react";
import { RenderAdapter } from "@/lib/render-adapter";

interface QuotaGaugeProps {
  "data-testid"?: string;
}

export const QuotaGauge = ({ "data-testid": testId }: QuotaGaugeProps) => (
  <RenderAdapter testId={testId} variant="outlined">
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
        }}
      >
        <span>API Calls</span>
        <span style={{ fontWeight: 600 }}>8,421 / 10,000</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--muted)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "84%",
            height: "100%",
            borderRadius: 3,
            background: "#f59e0b",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
        84% used — resets in 6 days
      </span>
    </div>
  </RenderAdapter>
);
