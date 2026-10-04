"use client";
import React from "react";

const NotificationsPanel = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div data-testid={testId} style={{ padding: 16 }}>
    <div style={{ fontWeight: 600, marginBottom: 8 }}>
      Notification Settings
    </div>
    <div style={{ color: "var(--muted-foreground)" }}>
      Choose which notifications you receive and how.
    </div>
  </div>
);

export default NotificationsPanel;
