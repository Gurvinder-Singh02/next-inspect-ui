"use client";
import React, { memo, forwardRef } from "react";
import styled from "styled-components";

const RowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  
  &:last-child {
    border-bottom: none;
  }
`;

const MetricLabel = styled.span`
  color: var(--muted-foreground);
`;

const MetricValue = styled.span`
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

const TrendBadge = styled.span<{ $positive: boolean }>`
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  background: ${({ $positive }) => ($positive ? "#dcfce7" : "#fee2e2")};
  color: ${({ $positive }) => ($positive ? "#166534" : "#991b1b")};
`;

interface ComposedMetricRowProps {
  label: string;
  value: string;
  trend?: number;
  "data-testid"?: string;
}

const MetricRowInner = forwardRef<HTMLDivElement, ComposedMetricRowProps>(
  ({ label, value, trend, "data-testid": testId }, ref) => (
    <RowContainer ref={ref} data-testid={testId}>
      <MetricLabel>{label}</MetricLabel>
      <div>
        <MetricValue>{value}</MetricValue>
        {trend !== undefined && (
          <TrendBadge $positive={trend >= 0}>
            {trend >= 0 ? "+" : ""}
            {trend}%
          </TrendBadge>
        )}
      </div>
    </RowContainer>
  ),
);
MetricRowInner.displayName = "ComposedMetricRow";

export const ComposedMetricRow = memo(MetricRowInner);
