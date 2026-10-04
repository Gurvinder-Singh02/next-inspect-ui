"use client";
import React from "react";

interface PolymorphicCardBaseProps {
  "data-testid"?: string;
  title?: string;
  children?: React.ReactNode;
  elevation?: "flat" | "raised" | "floating";
}

const PolymorphicCardBase = React.forwardRef<
  HTMLDivElement,
  PolymorphicCardBaseProps
>(({ "data-testid": testId, title, children, elevation = "raised" }, ref) => {
  const elevationStyles: Record<string, React.CSSProperties> = {
    flat: { boxShadow: "none" },
    raised: { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
    floating: { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  };
  return (
    <div
      ref={ref}
      data-testid={testId}
      style={{
        padding: 20,
        border: "1px solid var(--border, #e5e7eb)",
        borderRadius: 10,
        backgroundColor: "var(--card, #fff)",
        minWidth: 220,
        ...elevationStyles[elevation],
      }}
    >
      {title && (
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>
          {title}
        </h3>
      )}
      {children ?? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted, #6b7280)" }}>
          Polymorphic card content
        </p>
      )}
    </div>
  );
});
PolymorphicCardBase.displayName = "PolymorphicCardBase";

export const PolymorphicCard = React.memo(PolymorphicCardBase);
