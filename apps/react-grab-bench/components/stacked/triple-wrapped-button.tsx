"use client";
import React from "react";
import { withLicense } from "@/components/hoc/with-license";
import { withAnalytics } from "@/components/hoc/with-analytics";
import { withTracking } from "@/components/hoc/with-tracking";

interface TripleWrappedButtonProps {
  "data-testid"?: string;
}

const BaseButton = ({ "data-testid": testId }: TripleWrappedButtonProps) => (
  <button
    data-testid={testId}
    style={{
      padding: "8px 16px",
      backgroundColor: "var(--primary, #2563eb)",
      color: "white",
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    Premium Action
  </button>
);

export const TripleWrappedButton = withLicense(
  withAnalytics(withTracking(BaseButton, "triple-button")),
);
