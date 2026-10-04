"use client";

interface InfoPanelProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const InfoPanel = ({
  children,
  "data-testid": testId,
}: InfoPanelProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "InfoPanel"}
  </div>
);
