"use client";
import React from "react";
import { withLicense } from "@/components/hoc/with-license";
import { withAnalytics } from "@/components/hoc/with-analytics";
import { withFeatureFlag } from "@/components/hoc/with-feature-flag";
import { withTracking } from "@/components/hoc/with-tracking";

interface QuadWrappedCardProps {
  "data-testid"?: string;
}

const BaseCard = ({ "data-testid": testId }: QuadWrappedCardProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 16,
      border: "1px solid var(--border, #e5e7eb)",
      borderRadius: 8,
      backgroundColor: "var(--card, #fff)",
      minWidth: 200,
    }}
  >
    <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>
      Premium Card
    </h3>
    <p style={{ margin: 0, fontSize: 14, color: "var(--muted, #6b7280)" }}>
      Quad-wrapped with license, analytics, feature flag, and tracking.
    </p>
  </div>
);

export const QuadWrappedCard = withLicense(
  withAnalytics(withFeatureFlag(withTracking(BaseCard, "quad-card"))),
);
