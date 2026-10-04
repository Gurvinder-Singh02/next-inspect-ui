"use client";
import React from "react";

interface RenderAdapterProps {
  testId?: string;
  variant?: "outlined" | "filled" | "ghost";
  children: React.ReactNode;
}

export const RenderAdapter = ({
  testId,
  variant = "outlined",
  children,
}: RenderAdapterProps) => {
  const borderStyle =
    variant === "ghost"
      ? "none"
      : variant === "filled"
        ? "1px solid transparent"
        : "1px solid var(--border)";
  const background =
    variant === "filled" ? "var(--muted)" : "var(--background)";

  return (
    <div
      data-testid={testId}
      style={{
        padding: 12,
        borderRadius: 8,
        border: borderStyle,
        background,
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
};
