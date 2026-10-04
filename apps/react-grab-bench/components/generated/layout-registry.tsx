"use client";

const SingleColumn = ({
  children,
  "data-testid": testId,
}: {
  children?: React.ReactNode;
  "data-testid"?: string;
}) => (
  <div data-testid={testId} style={{ maxWidth: 600 }}>
    {children ?? "Single Column"}
  </div>
);
const TwoColumn = ({
  children,
  "data-testid": testId,
}: {
  children?: React.ReactNode;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
  >
    {children ?? "Two Column"}
  </div>
);
const ThreeColumn = ({
  children,
  "data-testid": testId,
}: {
  children?: React.ReactNode;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
  >
    {children ?? "Three Column"}
  </div>
);
const Sidebar = ({
  children,
  "data-testid": testId,
}: {
  children?: React.ReactNode;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 8 }}
  >
    {children ?? "Sidebar Layout"}
  </div>
);
const Stacked = ({
  children,
  "data-testid": testId,
}: {
  children?: React.ReactNode;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ display: "flex", flexDirection: "column", gap: 8 }}
  >
    {children ?? "Stacked"}
  </div>
);

const LAYOUT_REGISTRY: Record<
  string,
  React.FC<{ children?: React.ReactNode; "data-testid"?: string }>
> = {
  single: SingleColumn,
  two: TwoColumn,
  three: ThreeColumn,
  sidebar: Sidebar,
  stacked: Stacked,
};

export const DynamicLayout = ({
  variant,
  children,
  "data-testid": testId,
}: {
  variant: string;
  children?: React.ReactNode;
  "data-testid"?: string;
}) => {
  const Layout = LAYOUT_REGISTRY[variant] ?? SingleColumn;
  return <Layout data-testid={testId}>{children}</Layout>;
};
