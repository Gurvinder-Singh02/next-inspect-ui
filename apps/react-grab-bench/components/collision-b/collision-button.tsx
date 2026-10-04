"use client";

interface CollisionButtonProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const CollisionButton = ({
  children,
  "data-testid": testId,
}: CollisionButtonProps) => (
  <button
    data-testid={testId}
    style={{
      padding: "8px 16px",
      background: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: 4,
      cursor: "pointer",
      fontSize: 14,
    }}
  >
    {children ?? "Blue Button"}
  </button>
);
