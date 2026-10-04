"use client";

interface ItemTileProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ItemTile = ({
  children,
  "data-testid": testId,
}: ItemTileProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "ItemTile"}
  </div>
);
