"use client";
import React from "react";

const IntegrationsPanel = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div data-testid={testId} style={{ padding: 16 }}>
    <div style={{ fontWeight: 600, marginBottom: 8 }}>Integrations</div>
    <div style={{ color: "var(--muted-foreground)" }}>
      Connect third-party services and manage API access.
    </div>
  </div>
);

export default IntegrationsPanel;
