"use client";
import React from "react";

const variantStyles = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  error: "bg-red-50 border-red-200 text-red-800",
};

const icons: Record<string, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

export const TwAlert = ({
  children,
  variant = "info",
  "data-testid": testId,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variantStyles;
  "data-testid"?: string;
}) => {
  return (
    <div
      data-testid={testId}
      role="alert"
      className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${variantStyles[variant]}`}
    >
      <span className="text-base leading-none">{icons[variant]}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
};
