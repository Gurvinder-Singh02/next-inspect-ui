"use client";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

const InternalOverlayBanner = ({
  message,
  "data-testid": testId,
}: {
  message: string;
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
        top: 0,
        left: 0,
        right: 0,
        padding: "8px 16px",
        background: "var(--foreground)",
        color: "var(--background)",
        fontSize: 12,
        textAlign: "center",
        zIndex: 9999,
      }}
    >
      {message}
    </div>,
    document.body,
  );
};

export { InternalOverlayBanner as OverlayBanner };
