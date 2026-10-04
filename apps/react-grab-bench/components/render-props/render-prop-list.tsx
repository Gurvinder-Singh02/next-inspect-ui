"use client";
import React from "react";

interface RenderPropListProps {
  items?: string[];
  renderItem: (
    item: string,
    props: { "data-testid"?: string },
  ) => React.ReactNode;
  "data-testid"?: string;
}

export const RenderPropList = ({
  items = ["Item 1", "Item 2", "Item 3"],
  renderItem,
  "data-testid": testId,
}: RenderPropListProps) => (
  <ul data-testid={testId} style={{ listStyle: "none", padding: 0, margin: 0 }}>
    {items.map((item, itemIndex) => (
      <li key={itemIndex}>
        {renderItem(item, {
          "data-testid": testId ? `${testId}-item-${itemIndex}` : undefined,
        })}
      </li>
    ))}
  </ul>
);
