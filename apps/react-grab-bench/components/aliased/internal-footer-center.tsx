"use client";

import React from "react";

interface FooterCenterProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const FooterCenter = ({
  children,
  "data-testid": testId,
}: FooterCenterProps) => (
  <footer
    data-testid={testId}
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "12px 16px",
      borderTop: "1px solid var(--border)",
      fontSize: 13,
      color: "#6b7280",
    }}
  >
    {children || "Footer Center"}
  </footer>
);
