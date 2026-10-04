"use client";

interface FilterChipProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const FilterChip = ({
  children,
  "data-testid": testId,
}: FilterChipProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "FilterChip"}
  </div>
);
