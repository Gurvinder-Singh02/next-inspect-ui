"use client";
import React from "react";
import { withAnalytics } from "@/components/hoc/with-analytics";
import { withTracking } from "@/components/hoc/with-tracking";

interface AnalyticsTrackedFormProps {
  "data-testid"?: string;
}

const BaseForm = React.forwardRef<HTMLFormElement, AnalyticsTrackedFormProps>(
  ({ "data-testid": testId }, ref) => (
    <form
      ref={ref}
      data-testid={testId}
      style={{
        padding: 16,
        border: "1px solid var(--border, #e5e7eb)",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <label style={{ fontSize: 14, fontWeight: 500 }}>
        Email
        <input
          type="email"
          placeholder="user@example.com"
          readOnly
          style={{
            display: "block",
            marginTop: 4,
            padding: "6px 10px",
            border: "1px solid var(--border, #d1d5db)",
            borderRadius: 4,
            width: "100%",
          }}
        />
      </label>
      <button
        type="button"
        style={{
          padding: "8px 16px",
          backgroundColor: "var(--primary, #2563eb)",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Submit
      </button>
    </form>
  ),
);
BaseForm.displayName = "BaseForm";

export const AnalyticsTrackedForm = withAnalytics(
  withTracking(BaseForm, "analytics-form"),
);
