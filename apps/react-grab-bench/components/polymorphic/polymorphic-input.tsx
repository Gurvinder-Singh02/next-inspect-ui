"use client";
import React from "react";

interface PolymorphicInputBaseProps {
  "data-testid"?: string;
  label?: string;
  variant?: "outlined" | "filled" | "underlined";
}

const PolymorphicInputBase = React.forwardRef<
  HTMLInputElement,
  PolymorphicInputBaseProps
>(({ "data-testid": testId, label, variant = "outlined" }, ref) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    outlined: {
      border: "1px solid var(--border, #d1d5db)",
      background: "transparent",
    },
    filled: { border: "none", background: "var(--muted, #f3f4f6)" },
    underlined: {
      border: "none",
      borderBottom: "2px solid var(--border, #d1d5db)",
      borderRadius: 0,
      background: "transparent",
    },
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && (
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--foreground, #111)",
          }}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        data-testid={testId}
        placeholder="Type here..."
        readOnly
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 14,
          outline: "none",
          ...variantStyles[variant],
        }}
      />
    </div>
  );
});
PolymorphicInputBase.displayName = "PolymorphicInputBase";

export const PolymorphicInput = React.memo(PolymorphicInputBase);
