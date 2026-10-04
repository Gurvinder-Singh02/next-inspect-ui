"use client";

interface DropTargetProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const DropTarget = ({
  children,
  "data-testid": testId,
}: DropTargetProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "DropTarget"}
  </div>
);
