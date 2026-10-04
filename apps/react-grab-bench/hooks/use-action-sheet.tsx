"use client";
import { useState } from "react";

export const useActionSheet = () => {
  const [open, setOpen] = useState(false);
  return { open, toggle: () => setOpen((previousOpen) => !previousOpen) };
};

export const ActionSheetButton = ({
  children,
  "data-testid": testId,
}: {
  children?: React.ReactNode;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}
  >
    {children ?? "ActionSheetButton"}
  </div>
);
