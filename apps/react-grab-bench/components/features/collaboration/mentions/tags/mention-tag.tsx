"use client";

interface MentionTagProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const MentionTag = ({
  children,
  "data-testid": testId,
}: MentionTagProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "MentionTag"}
  </div>
);
