"use client";
import React from "react";
import { withLicense } from "@/components/hoc/with-license";

interface LicensedPremiumBadgeProps {
  "data-testid"?: string;
}

const BaseBadge = React.forwardRef<HTMLSpanElement, LicensedPremiumBadgeProps>(
  ({ "data-testid": testId }, ref) => (
    <span
      ref={ref}
      data-testid={testId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 9999,
        backgroundColor: "var(--accent, #f59e0b)",
        color: "white",
      }}
    >
      ★ Premium
    </span>
  ),
);
BaseBadge.displayName = "BaseBadge";

const MemoizedBadge = React.memo(BaseBadge);
MemoizedBadge.displayName = "MemoizedBadge";

export const LicensedPremiumBadge = withLicense(MemoizedBadge);
