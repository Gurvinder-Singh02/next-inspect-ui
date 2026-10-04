"use client";
import { useState, useCallback } from "react";

export const useToastQueue = () => {
  const [toasts, setToasts] = useState<string[]>([]);
  const push = useCallback((msg: string) => setToasts((t) => [...t, msg]), []);
  const dismiss = useCallback(
    (index: number) => setToasts((t) => t.filter((_, i) => i !== index)),
    [],
  );
  return { toasts, push, dismiss };
};

export const ToastMessage = ({
  message,
  "data-testid": testId,
}: {
  message: string;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      padding: "8px 16px",
      borderRadius: 8,
      background: "var(--foreground)",
      color: "var(--background)",
      fontSize: 13,
    }}
  >
    {message}
  </div>
);
