"use client";
import React from "react";
import { withFeatureFlag } from "@/components/hoc/with-feature-flag";
import { withPermissions } from "@/components/hoc/with-permissions";

interface FeatureGatedPanelProps {
  "data-testid"?: string;
}

const BasePanel = ({ "data-testid": testId }: FeatureGatedPanelProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 20,
      border: "1px solid var(--border, #e5e7eb)",
      borderRadius: 8,
      backgroundColor: "var(--panel, #fafafa)",
    }}
  >
    <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>
      Gated Panel
    </h4>
    <p style={{ margin: 0, fontSize: 13, color: "var(--muted, #6b7280)" }}>
      This panel is gated behind a feature flag and permissions check.
    </p>
  </div>
);

const MemoizedPanel = React.memo(BasePanel);
MemoizedPanel.displayName = "MemoizedPanel";

export const FeatureGatedPanel = withFeatureFlag(
  withPermissions(MemoizedPanel, "admin"),
);
