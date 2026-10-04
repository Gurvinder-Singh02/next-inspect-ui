"use client";

interface PanelActionsProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const PanelActions = ({
  children,
  "data-testid": testId,
}: PanelActionsProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "PanelActions"}
  </div>
);
