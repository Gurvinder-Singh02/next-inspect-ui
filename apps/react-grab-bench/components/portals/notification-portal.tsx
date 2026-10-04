"use client";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

const _NotificationToast = ({
  text,
  "data-testid": testId,
}: {
  text: string;
  "data-testid"?: string;
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(
    <div
      data-testid={testId}
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        padding: "12px 20px",
        borderRadius: 8,
        background: "var(--foreground)",
        color: "var(--background)",
        fontSize: 13,
        zIndex: 9999,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      {text}
    </div>,
    document.body,
  );
};

export { _NotificationToast as NotificationToast };
