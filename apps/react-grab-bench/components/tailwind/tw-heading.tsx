"use client";
import React from "react";

const sizes = {
  sm: "text-lg font-semibold",
  md: "text-2xl font-bold",
  lg: "text-3xl font-extrabold",
};

export const TwHeading = ({
  children,
  size = "md",
  "data-testid": testId,
}: {
  children: React.ReactNode;
  size?: keyof typeof sizes;
  "data-testid"?: string;
}) => {
  return (
    <h2
      data-testid={testId}
      className={`${sizes[size]} text-(--foreground) tracking-tight`}
    >
      {children}
    </h2>
  );
};
