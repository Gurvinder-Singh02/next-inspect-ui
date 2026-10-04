"use client";
export const PipelineStage = ({
  children,
  "data-testid": testId,
}: {
  children?: React.ReactNode;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 4,
    }}
  >
    {children ?? "PipelineStage"}
  </div>
);
