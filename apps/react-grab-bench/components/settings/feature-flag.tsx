"use client";

interface FeatureToggleProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const FeatureToggle = ({
  children,
  "data-testid": testId,
}: FeatureToggleProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "FeatureToggle"}
  </div>
);
