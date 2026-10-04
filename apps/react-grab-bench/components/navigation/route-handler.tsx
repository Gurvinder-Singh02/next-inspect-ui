"use client";

interface RouteLinkProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const RouteLink = ({
  children,
  "data-testid": testId,
}: RouteLinkProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "RouteLink"}
  </div>
);
