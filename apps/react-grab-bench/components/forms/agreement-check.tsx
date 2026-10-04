"use client";

interface AgreementCheckProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const AgreementCheck = ({
  children,
  "data-testid": testId,
}: AgreementCheckProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "AgreementCheck"}
  </div>
);
