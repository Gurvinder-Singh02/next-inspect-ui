"use client";

interface InterruptDialogProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const InterruptDialog = ({
  children,
  "data-testid": testId,
}: InterruptDialogProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "InterruptDialog"}
  </div>
);
