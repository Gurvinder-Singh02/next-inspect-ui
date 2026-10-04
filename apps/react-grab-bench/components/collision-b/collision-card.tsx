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
      border: "2px solid #3b82f6",
      borderRadius: 8,
      background: "#eff6ff",
    }}
  >
    {children ?? "Blue Card"}
  </div>
);
