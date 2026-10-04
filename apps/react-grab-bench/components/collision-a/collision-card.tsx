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
      border: "2px solid #ef4444",
      borderRadius: 8,
      background: "#fef2f2",
    }}
  >
    {children ?? "Red Card"}
  </div>
);
