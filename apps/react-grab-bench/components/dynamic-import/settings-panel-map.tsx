"use client";
import React, { lazy, Suspense } from "react";

const SETTINGS_PANEL_MAP: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<{ "data-testid"?: string }>>
> = {
  general: lazy(() => import("./panels/general-panel")),
  security: lazy(() => import("./panels/security-panel")),
  billing: lazy(() => import("./panels/billing-panel")),
  notifications: lazy(() => import("./panels/notifications-panel")),
  integrations: lazy(() => import("./panels/integrations-panel")),
};

export const SettingsPanelRouter = ({
  panel,
  "data-testid": testId,
}: {
  panel: string;
  "data-testid"?: string;
}) => {
  const Panel = SETTINGS_PANEL_MAP[panel];
  if (!Panel) return null;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Panel data-testid={testId} />
    </Suspense>
  );
};
