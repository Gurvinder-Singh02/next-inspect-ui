"use client";
export const ReceiptLineItem = ({
  label,
  amount,
  "data-testid": testId,
}: {
  label: string;
  amount: number;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "4px 0",
      fontSize: 13,
    }}
  >
    <span>{label}</span>
    <span>${amount.toFixed(2)}</span>
  </div>
);
