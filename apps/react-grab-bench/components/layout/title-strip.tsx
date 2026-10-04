"use client";

interface TitleStripProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const TitleStrip = ({
  children,
  "data-testid": testId,
}: TitleStripProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "TitleStrip"}
  </div>
);
