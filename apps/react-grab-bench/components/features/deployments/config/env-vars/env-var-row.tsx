"use client";

interface EnvVarRowProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const EnvVarRow = ({
  children,
  "data-testid": testId,
}: EnvVarRowProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "EnvVarRow"}
  </div>
);
