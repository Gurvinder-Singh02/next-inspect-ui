"use client";

interface SubmitButtonProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const SubmitButton = ({
  children,
  "data-testid": testId,
}: SubmitButtonProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "SubmitButton"}
  </div>
);
