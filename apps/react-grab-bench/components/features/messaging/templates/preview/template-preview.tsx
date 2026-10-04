"use client";

interface TemplatePreviewProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const TemplatePreview = ({
  children,
  "data-testid": testId,
}: TemplatePreviewProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "TemplatePreview"}
  </div>
);
