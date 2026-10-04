"use client";

interface RoleSelectorProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const RoleSelector = ({
  children,
  "data-testid": testId,
}: RoleSelectorProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "RoleSelector"}
  </div>
);
