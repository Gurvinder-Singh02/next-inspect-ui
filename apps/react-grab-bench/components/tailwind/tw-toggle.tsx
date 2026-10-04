"use client";
import React, { useState } from "react";

export const TwToggle = ({
  label,
  defaultChecked = false,
  "data-testid": testId,
}: {
  label?: string;
  defaultChecked?: boolean;
  "data-testid"?: string;
}) => {
  const [isChecked, setIsChecked] = useState(defaultChecked);

  return (
    <label
      data-testid={testId}
      className="inline-flex items-center gap-3 cursor-pointer select-none"
    >
      <button
        role="switch"
        aria-checked={isChecked}
        onClick={() => setIsChecked((previous) => !previous)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isChecked ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            isChecked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      {label && (
        <span className="text-sm text-[var(--foreground)]">{label}</span>
      )}
    </label>
  );
};
