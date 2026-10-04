"use client";
import React from "react";

export const DataGrid = ({
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
    <div style={{ fontWeight: 600, marginBottom: 4 }}>Data Grid</div>
    <div style={{ color: "var(--muted-foreground)" }}>0 rows loaded</div>
  </div>
);
