"use client";

interface ReactionChipProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ReactionChip = ({
  children,
  "data-testid": testId,
}: ReactionChipProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "ReactionChip"}
  </div>
);
