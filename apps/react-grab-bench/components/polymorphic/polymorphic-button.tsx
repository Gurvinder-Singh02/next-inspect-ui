"use client";
import React from "react";

interface PolymorphicButtonInnerProps {
  "data-testid"?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

const PolymorphicButtonInner = React.forwardRef<
  HTMLButtonElement,
  PolymorphicButtonInnerProps
>(({ "data-testid": testId, children, variant = "primary" }, ref) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: "var(--primary, #2563eb)", color: "white" },
    secondary: { backgroundColor: "var(--secondary, #e5e7eb)", color: "#111" },
    ghost: { backgroundColor: "transparent", color: "#111" },
  };
  return (
    <button
      ref={ref}
      data-testid={testId}
      style={{
        padding: "10px 20px",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 14,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        ...variantStyles[variant],
      }}
    >
      {children ?? "Polymorphic Button"}
    </button>
  );
});
PolymorphicButtonInner.displayName = "PolymorphicButtonInner";

export const PolymorphicButton = React.memo(PolymorphicButtonInner);
