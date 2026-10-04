"use client";

interface SourcePreviewProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const SourcePreview = ({
  children,
  "data-testid": testId,
}: SourcePreviewProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "SourcePreview"}
  </div>
);
