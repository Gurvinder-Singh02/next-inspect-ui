"use client";

interface CouponInputProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const CouponInput = ({
  children,
  "data-testid": testId,
}: CouponInputProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "CouponInput"}
  </div>
);
