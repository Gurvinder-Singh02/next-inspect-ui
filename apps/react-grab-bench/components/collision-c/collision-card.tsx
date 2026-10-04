"use client";

interface CollisionCardProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const CollisionCard = ({
  children,
  "data-testid": testId,
}: CollisionCardProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 16,
      border: "2px solid #22c55e",
      borderRadius: 8,
      background: "#f0fdf4",
    }}
  >
    {children ?? "Green Card"}
  </div>
);
