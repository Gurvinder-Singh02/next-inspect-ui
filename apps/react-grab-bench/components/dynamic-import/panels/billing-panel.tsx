"use client";
import React from "react";

const BillingPanel = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div data-testid={testId} style={{ padding: 16 }}>
    <div style={{ fontWeight: 600, marginBottom: 8 }}>Billing Settings</div>
    <div style={{ color: "var(--muted-foreground)" }}>
      View invoices, update payment methods, and manage your subscription.
    </div>
  </div>
);

export default BillingPanel;
