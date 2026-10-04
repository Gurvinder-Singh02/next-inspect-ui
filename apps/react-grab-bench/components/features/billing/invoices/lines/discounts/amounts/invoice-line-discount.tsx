"use client";

interface InvoiceLineDiscountProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const InvoiceLineDiscount = ({
  children,
  "data-testid": testId,
}: InvoiceLineDiscountProps) => (
  <span
    data-testid={testId}
    style={{
      display: "inline-block",
      padding: "2px 8px",
      background: "#f0fdf4",
      border: "1px solid #bbf7d0",
      borderRadius: 4,
      fontSize: 12,
      color: "#166534",
    }}
  >
    {children ?? "-10%"}
  </span>
);
