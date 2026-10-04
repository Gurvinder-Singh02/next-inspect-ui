"use client";

interface AsyncSpinnerProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const AsyncSpinner = ({
  children,
  "data-testid": testId,
}: AsyncSpinnerProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "AsyncSpinner"}
  </div>
);
