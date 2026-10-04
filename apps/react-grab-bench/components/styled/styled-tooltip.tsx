"use client";
import React, { useState } from "react";
import styled from "styled-components";

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipBubble = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--foreground);
  color: var(--background);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.15s;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: var(--foreground);
  }
`;

export const StyledTooltip = ({
  children,
  content,
  "data-testid": testId,
}: {
  children: React.ReactNode;
  content: string;
  "data-testid"?: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TooltipWrapper
      data-testid={testId}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <TooltipBubble $visible={isVisible}>{content}</TooltipBubble>
    </TooltipWrapper>
  );
};
