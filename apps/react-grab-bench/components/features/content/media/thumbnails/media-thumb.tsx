"use client";

interface MediaThumbProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const MediaThumb = ({
  children,
  "data-testid": testId,
}: MediaThumbProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "MediaThumb"}
  </div>
);
