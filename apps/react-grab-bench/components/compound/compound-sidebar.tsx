"use client";

import React, { forwardRef } from "react";

interface CompoundSidebarProps {
  children: React.ReactNode;
  "data-testid"?: string;
}

interface SubComponentProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

const SidebarHeader = ({
  children,
  "data-testid": testId,
}: SubComponentProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 12,
      borderBottom: "1px solid var(--border)",
      fontWeight: 600,
    }}
  >
    {children || "Sidebar Header"}
  </div>
);
SidebarHeader.displayName = "Sidebar.Header";

const SidebarContent = ({
  children,
  "data-testid": testId,
}: SubComponentProps) => (
  <div data-testid={testId} style={{ padding: 12, flex: 1 }}>
    {children || "Sidebar Content"}
  </div>
);
SidebarContent.displayName = "Sidebar.Content";

const SidebarFooter = ({
  children,
  "data-testid": testId,
}: SubComponentProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 12,
      borderTop: "1px solid var(--border)",
      fontSize: 12,
    }}
  >
    {children || "Sidebar Footer"}
  </div>
);
SidebarFooter.displayName = "Sidebar.Footer";

const SidebarBase = forwardRef<HTMLDivElement, CompoundSidebarProps>(
  ({ children, "data-testid": testId }, ref) => (
    <div
      ref={ref}
      data-testid={testId}
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--border)",
        borderRadius: 8,
        minHeight: 120,
      }}
    >
      {children}
    </div>
  ),
);
SidebarBase.displayName = "Sidebar";

export const CompoundSidebar = Object.assign(SidebarBase, {
  Header: SidebarHeader,
  Content: SidebarContent,
  Footer: SidebarFooter,
});
