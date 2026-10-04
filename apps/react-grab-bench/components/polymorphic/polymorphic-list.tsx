"use client";
import React from "react";

interface PolymorphicListInnerProps {
  "data-testid"?: string;
  items?: string[];
  variant?: "plain" | "striped" | "bordered";
}

const DEFAULT_ITEMS = ["Alpha", "Beta", "Gamma", "Delta"];

const PolymorphicListInner = React.forwardRef<
  HTMLUListElement,
  PolymorphicListInnerProps
>(
  (
    { "data-testid": testId, items = DEFAULT_ITEMS, variant = "bordered" },
    ref,
  ) => (
    <ul
      ref={ref}
      data-testid={testId}
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        border:
          variant !== "plain" ? "1px solid var(--border, #e5e7eb)" : "none",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {items.map((item, itemIndex) => (
        <li
          key={item}
          style={{
            padding: "10px 14px",
            fontSize: 14,
            borderBottom: "1px solid var(--border, #e5e7eb)",
            backgroundColor:
              variant === "striped" && itemIndex % 2 === 1
                ? "var(--muted, #f9fafb)"
                : "transparent",
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  ),
);
PolymorphicListInner.displayName = "PolymorphicListInner";

export const PolymorphicList = React.memo(PolymorphicListInner);
