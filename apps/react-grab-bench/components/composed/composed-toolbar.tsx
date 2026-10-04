"use client";
import React from "react";
import { withLicense } from "@/components/hoc/with-license";
import { withAnalytics } from "@/components/hoc/with-analytics";
import { withTracking } from "@/components/hoc/with-tracking";
import styled from "styled-components";

const ToolbarWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--background);
`;

const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    background: var(--muted);
  }
`;

interface ComposedToolbarProps {
  "data-testid"?: string;
}

const InnerToolbar = ({ "data-testid": testId }: ComposedToolbarProps) => (
  <ToolbarWrapper data-testid={testId}>
    <ToolbarButton>✏️</ToolbarButton>
    <ToolbarButton>📋</ToolbarButton>
    <ToolbarButton>🗑️</ToolbarButton>
    <ToolbarButton>⚙️</ToolbarButton>
  </ToolbarWrapper>
);

export const ComposedToolbar = withLicense(
  withAnalytics(withTracking(InnerToolbar, "editor-toolbar")),
);
