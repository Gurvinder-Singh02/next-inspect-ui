"use client";

interface ValidatedInputProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ValidatedInput = ({
  children,
  "data-testid": testId,
}: ValidatedInputProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "ValidatedInput"}
  </div>
);
