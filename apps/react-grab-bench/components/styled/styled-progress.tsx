"use client";
import styled from "styled-components";

const ProgressTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--muted);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number; $color?: string }>`
  height: 100%;
  width: ${({ $percent }) => Math.min(100, Math.max(0, $percent))}%;
  background: ${({ $color }) => $color || "var(--primary)"};
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const ProgressWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--muted-foreground);
`;

export const StyledProgress = ({
  percent,
  label,
  color,
  "data-testid": testId,
}: {
  percent: number;
  label?: string;
  color?: string;
  "data-testid"?: string;
}) => {
  return (
    <ProgressWrapper data-testid={testId}>
      {label && (
        <ProgressLabel>
          <span>{label}</span>
          <span>{percent}%</span>
        </ProgressLabel>
      )}
      <ProgressTrack>
        <ProgressFill $percent={percent} $color={color} />
      </ProgressTrack>
    </ProgressWrapper>
  );
};
