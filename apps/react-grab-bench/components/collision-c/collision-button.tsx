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
      background: "#22c55e",
      color: "white",
      border: "none",
      borderRadius: 4,
      cursor: "pointer",
      fontSize: 14,
    }}
  >
    {children ?? "Green Button"}
  </button>
);
