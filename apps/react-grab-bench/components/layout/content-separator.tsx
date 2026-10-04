"use client";

interface ContentDividerProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const ContentDivider = ({
  children,
  "data-testid": testId,
}: ContentDividerProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "ContentDivider"}
  </div>
);
