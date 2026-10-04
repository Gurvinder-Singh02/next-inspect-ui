"use client";
import React from "react";

const shapeClasses = {
  text: "h-4 w-full rounded",
  circle: "h-10 w-10 rounded-full",
  card: "h-32 w-full rounded-lg",
  avatar: "h-12 w-12 rounded-full",
};

export const TwSkeleton = ({
  shape = "text",
  count = 1,
  "data-testid": testId,
}: {
  shape?: keyof typeof shapeClasses;
  count?: number;
  "data-testid"?: string;
}) => {
  return (
    <div data-testid={testId} className="flex flex-col gap-3" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-(--muted) ${shapeClasses[shape]}`}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};
