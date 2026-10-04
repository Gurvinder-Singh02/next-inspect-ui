"use client";
import React from "react";

interface PricingFeature {
  name: string;
  renderValue: (props: { "data-testid"?: string }) => React.ReactNode;
}

const PRICING_FEATURES: PricingFeature[] = [
  {
    name: "API Requests",
    renderValue: ({ "data-testid": testId }) => (
      <span data-testid={testId} style={{ fontWeight: 600 }}>
        10,000/mo
      </span>
    ),
  },
  {
    name: "Team Members",
    renderValue: ({ "data-testid": testId }) => (
      <span data-testid={testId} style={{ fontWeight: 600 }}>
        Unlimited
      </span>
    ),
  },
  {
    name: "Storage",
    renderValue: ({ "data-testid": testId }) => (
      <span data-testid={testId} style={{ fontWeight: 600 }}>
        50GB
      </span>
    ),
  },
];

export const PricingFeatureDisplay = ({
  index,
  "data-testid": testId,
}: {
  index: number;
  "data-testid"?: string;
}) => {
  const feature = PRICING_FEATURES[index] ?? PRICING_FEATURES[0];
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span>{feature.name}</span>
      {feature.renderValue({ "data-testid": testId })}
    </div>
  );
};
