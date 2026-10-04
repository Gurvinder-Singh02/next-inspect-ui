"use client";

interface PathSegmentProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const PathSegment = ({
  children,
  "data-testid": testId,
}: PathSegmentProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "PathSegment"}
  </div>
);
