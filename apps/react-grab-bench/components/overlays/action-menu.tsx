"use client";

interface ActionMenuProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ActionMenu = ({
  children,
  "data-testid": testId,
}: ActionMenuProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "ActionMenu"}
  </div>
);
