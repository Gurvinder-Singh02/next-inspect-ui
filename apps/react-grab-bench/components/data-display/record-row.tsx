"use client";

interface RecordRowProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const RecordRow = ({
  children,
  "data-testid": testId,
}: RecordRowProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "RecordRow"}
  </div>
);
