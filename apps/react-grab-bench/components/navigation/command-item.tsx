"use client";

interface CommandItemProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const CommandItem = ({
  children,
  "data-testid": testId,
}: CommandItemProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "CommandItem"}
  </div>
);
