"use client";
import React from "react";

export const AnalyticsChart = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      padding: 12,
      border: "1px solid var(--border)",
      borderRadius: 8,
      minHeight: 80,
    }}
  >
    <div style={{ fontWeight: 600, marginBottom: 4 }}>Analytics Chart</div>
    <div style={{ color: "var(--muted-foreground)" }}>
      Loading chart data...
    </div>
  </div>
);
