"use client";

interface SegmentPillProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const SegmentPill = ({
  children,
  "data-testid": testId,
}: SegmentPillProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "SegmentPill"}
  </div>
);
