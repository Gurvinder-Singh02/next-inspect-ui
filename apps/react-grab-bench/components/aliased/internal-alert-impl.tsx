"use client";

import React from "react";

interface AlertImplProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const AlertImpl = ({
  children,
  "data-testid": testId,
}: AlertImplProps) => (
  <div
    data-testid={testId}
    role="alert"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 14px",
      borderRadius: 6,
      backgroundColor: "#fef3c7",
      border: "1px solid #fcd34d",
      fontSize: 13,
      color: "#92400e",
    }}
  >
    <span>&#x26A0;</span>
    {children || "Alert: Something needs your attention."}
  </div>
);
