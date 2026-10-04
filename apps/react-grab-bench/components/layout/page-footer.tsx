"use client";

interface PageFooterProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const PageFooter = ({
  children,
  "data-testid": testId,
}: PageFooterProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "PageFooter"}
  </div>
);
