"use client";
import { useState } from "react";

export const useUndoToast = () => {
  const [active, setActive] = useState(false);
  return { active, toggle: () => setActive((a) => !a) };
};

export const UndoToast = ({
  children,
  "data-testid": testId,
}: {
  children?: React.ReactNode;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "UndoToast"}
  </div>
);
