"use client";
import React from "react";

const SecurityPanel = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div data-testid={testId} style={{ padding: 16 }}>
    <div style={{ fontWeight: 600, marginBottom: 8 }}>Security Settings</div>
    <div style={{ color: "var(--muted-foreground)" }}>
      Manage passwords, 2FA, and session controls.
    </div>
  </div>
);

export default SecurityPanel;
