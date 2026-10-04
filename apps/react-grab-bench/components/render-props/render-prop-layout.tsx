"use client";
import React from "react";

interface RenderPropLayoutProps {
  renderHeader: (props: { "data-testid"?: string }) => React.ReactNode;
  renderSidebar: (props: { "data-testid"?: string }) => React.ReactNode;
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const RenderPropLayout = ({
  renderHeader,
  renderSidebar,
  children,
  "data-testid": testId,
}: RenderPropLayoutProps) => (
  <div
    data-testid={testId}
    style={{ display: "flex", flexDirection: "column", minHeight: 200 }}
  >
    <header style={{ borderBottom: "1px solid var(--border)", padding: 12 }}>
      {renderHeader({
        "data-testid": testId ? `${testId}-header` : undefined,
      })}
    </header>
    <div style={{ display: "flex", flex: 1 }}>
      <aside
        style={{
          width: 200,
          borderRight: "1px solid var(--border)",
          padding: 12,
        }}
      >
        {renderSidebar({
          "data-testid": testId ? `${testId}-sidebar` : undefined,
        })}
      </aside>
      <main style={{ flex: 1, padding: 12 }}>{children ?? "Main content"}</main>
    </div>
  </div>
);
