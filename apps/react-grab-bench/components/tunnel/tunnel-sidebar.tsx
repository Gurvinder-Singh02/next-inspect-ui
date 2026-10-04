"use client";
import React from "react";
import { TunnelProvider, TunnelIn, TunnelOut } from "./tunnel-provider";

export const TunnelSidebarHeader = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <TunnelProvider>
    <TunnelIn>
      <div style={{ fontWeight: 700, fontSize: 16, padding: "12px 16px" }}>
        Sidebar Header
      </div>
    </TunnelIn>
    <TunnelOut data-testid={testId} />
  </TunnelProvider>
);

export const TunnelSidebarBody = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <TunnelProvider>
    <TunnelIn>
      <div style={{ padding: "8px 16px", lineHeight: 1.6 }}>
        <p>Sidebar body content tunneled from a remote source.</p>
        <p>This text originates at the TunnelIn location.</p>
      </div>
    </TunnelIn>
    <TunnelOut data-testid={testId} />
  </TunnelProvider>
);

export const TunnelSidebarActions = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <TunnelProvider>
    <TunnelIn>
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "8px 16px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button style={{ padding: "4px 12px" }}>Save</button>
        <button style={{ padding: "4px 12px" }}>Cancel</button>
      </div>
    </TunnelIn>
    <TunnelOut data-testid={testId} />
  </TunnelProvider>
);

export const TunnelSidebarStatus = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <TunnelProvider>
    <TunnelIn>
      <div
        style={{
          padding: "6px 16px",
          fontSize: 12,
          color: "var(--muted-foreground)",
          borderTop: "1px solid var(--border)",
        }}
      >
        Last synced: just now
      </div>
    </TunnelIn>
    <TunnelOut data-testid={testId} />
  </TunnelProvider>
);
