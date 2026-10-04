"use client";

export const AuthBadge = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <span
    data-testid={testId}
    style={{
      padding: "2px 8px",
      borderRadius: 99,
      background: "rgba(0,200,100,0.15)",
      fontSize: 11,
    }}
  >
    Authenticated
  </span>
);
