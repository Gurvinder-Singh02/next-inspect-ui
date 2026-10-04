"use client";

interface RemovableTokenProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const RemovableToken = ({
  children,
  "data-testid": testId,
}: RemovableTokenProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "RemovableToken"}
  </div>
);
