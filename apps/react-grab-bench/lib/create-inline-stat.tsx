"use client";
import React from "react";
import styled from "styled-components";

const StatWrapper = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--background);
  font-size: 14px;
`;

const StatValue = styled.span`
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

const StatLabel = styled.span`
  font-size: 11px;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

interface InlineStatConfig {
  label: string;
  unit?: string;
  testId: string;
}

export const createInlineStat = (config: InlineStatConfig) => {
  const InlineStat = ({ value }: { value: string | number }) => (
    <StatWrapper data-testid={config.testId}>
      <StatValue>{value}</StatValue>
      <StatLabel>
        {config.unit ?? ""} {config.label}
      </StatLabel>
    </StatWrapper>
  );
  InlineStat.displayName = `InlineStat(${config.label})`;
  return InlineStat;
};
