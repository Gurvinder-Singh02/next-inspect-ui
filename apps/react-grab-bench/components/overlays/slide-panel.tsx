"use client";

interface SlidePanelProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const SlidePanel = ({
  children,
  "data-testid": testId,
}: SlidePanelProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "SlidePanel"}
  </div>
);
