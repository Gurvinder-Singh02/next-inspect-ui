"use client";

import React from "react";

interface NavBaseProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const NavBase = ({ children, "data-testid": testId }: NavBaseProps) => (
  <nav
    data-testid={testId}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "8px 16px",
      borderBottom: "1px solid var(--border)",
      fontSize: 14,
      fontWeight: 500,
    }}
  >
    {children || (
      <>
        <span>Home</span>
        <span>Settings</span>
        <span>Profile</span>
      </>
    )}
  </nav>
);
