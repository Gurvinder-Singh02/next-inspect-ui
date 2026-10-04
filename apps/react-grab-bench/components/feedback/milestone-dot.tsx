"use client";

interface MilestoneDotProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const MilestoneDot = ({
  children,
  "data-testid": testId,
}: MilestoneDotProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "MilestoneDot"}
  </div>
);
