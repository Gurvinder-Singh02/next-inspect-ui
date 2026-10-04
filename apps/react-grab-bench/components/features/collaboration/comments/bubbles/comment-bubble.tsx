"use client";

interface CommentBubbleProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const CommentBubble = ({
  children,
  "data-testid": testId,
}: CommentBubbleProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "CommentBubble"}
  </div>
);
