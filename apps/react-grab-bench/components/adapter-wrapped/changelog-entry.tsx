"use client";
import React from "react";
import { RenderAdapter } from "@/lib/render-adapter";

interface ChangelogEntryProps {
  "data-testid"?: string;
}

export const ChangelogEntry = ({
  "data-testid": testId,
}: ChangelogEntryProps) => (
  <RenderAdapter testId={testId} variant="outlined">
    <div style={{ display: "flex", gap: 12 }}>
      <span
        style={{
          fontSize: 11,
          color: "var(--muted-foreground)",
          whiteSpace: "nowrap",
          paddingTop: 2,
        }}
      >
        Mar 14
      </span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>
          Added batch annotation support
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
          You can now annotate up to 200 elements at once across multiple pages.
        </div>
      </div>
    </div>
  </RenderAdapter>
);
