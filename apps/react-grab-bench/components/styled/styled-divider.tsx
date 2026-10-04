"use client";
import styled from "styled-components";

const DividerLine = styled.hr<{ $spacing?: number }>`
  border: none;
  height: 1px;
  background: var(--border);
  margin: ${({ $spacing }) => $spacing || 16}px 0;
`;

const DividerLabel = styled.span`
  font-size: 12px;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 12px;
  background: var(--background);
`;

const LabeledWrapper = styled.div`
  display: flex;
  align-items: center;
  margin: 16px 0;
  
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--border);
  }
`;

export const StyledDivider = ({
  label,
  spacing,
  "data-testid": testId,
}: {
  label?: string;
  spacing?: number;
  "data-testid"?: string;
}) => {
  if (label) {
    return (
      <LabeledWrapper data-testid={testId}>
        <DividerLabel>{label}</DividerLabel>
      </LabeledWrapper>
    );
  }
  return <DividerLine $spacing={spacing} data-testid={testId} />;
};
