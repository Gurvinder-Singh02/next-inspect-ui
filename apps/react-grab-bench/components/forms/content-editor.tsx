"use client";

interface ContentEditorProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ContentEditor = ({
  children,
  "data-testid": testId,
}: ContentEditorProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "ContentEditor"}
  </div>
);
