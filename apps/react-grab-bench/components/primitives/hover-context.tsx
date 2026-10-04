"use client";

interface HoverTipProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const HoverTip = ({
  children,
  "data-testid": testId,
}: HoverTipProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "HoverTip"}
  </div>
);
