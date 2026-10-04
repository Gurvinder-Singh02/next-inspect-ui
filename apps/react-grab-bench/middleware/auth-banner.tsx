"use client";

export const AuthBannerWidget = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      padding: "8px 16px",
      background: "#fef3c7",
      borderRadius: 4,
      fontSize: 12,
      color: "#92400e",
    }}
  >
    Authentication required
  </div>
);
