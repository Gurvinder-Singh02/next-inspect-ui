"use client";

interface TagInputProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const TagInput = ({
  children,
  "data-testid": testId,
}: TagInputProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "TagInput"}
  </div>
);
