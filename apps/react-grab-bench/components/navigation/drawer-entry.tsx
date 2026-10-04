"use client";

interface DrawerEntryProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const DrawerEntry = ({
  children,
  "data-testid": testId,
}: DrawerEntryProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "DrawerEntry"}
  </div>
);
