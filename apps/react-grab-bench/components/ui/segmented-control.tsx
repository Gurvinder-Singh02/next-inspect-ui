"use client";

interface SegmentButtonProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const SegmentButton = ({
  children,
  "data-testid": testId,
}: SegmentButtonProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "SegmentButton"}
  </div>
);
