"use client";

interface TaxLineProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const TaxLine = ({ children, "data-testid": testId }: TaxLineProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "TaxLine"}
  </div>
);
