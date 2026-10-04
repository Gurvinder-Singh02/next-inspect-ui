"use client";

interface ProcessTagProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ProcessTag = ({
  children,
  "data-testid": testId,
}: ProcessTagProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "ProcessTag"}
  </div>
);
