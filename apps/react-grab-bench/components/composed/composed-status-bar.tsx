"use client";
import React from "react";
import { withTracking } from "@/components/hoc/with-tracking";
import { withTooltip } from "@/components/hoc/with-tooltip";
import styled from "styled-components";

const StatusBarBase = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--background);
  font-size: 13px;
`;

const StatusDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

interface ComposedStatusBarProps {
  "data-testid"?: string;
}

const InnerStatusBar = ({ "data-testid": testId }: ComposedStatusBarProps) => (
  <StatusBarBase data-testid={testId}>
    <StatusDot $color="#22c55e" />
    <span>All services operational</span>
    <span style={{ marginLeft: "auto", opacity: 0.5 }}>Updated 2m ago</span>
  </StatusBarBase>
);

export const ComposedStatusBar = withTooltip(
  withTracking(InnerStatusBar, "status-bar"),
  "System Status",
);
