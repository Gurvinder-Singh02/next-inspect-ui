"use client";
import React, { ComponentType } from "react";

export const withAnalytics = <P extends object>(
  WrappedComponent: ComponentType<P>,
) => {
  const WithAnalytics = (props: P) => (
    <div data-analytics="enabled" style={{ display: "contents" }}>
      <WrappedComponent {...props} />
    </div>
  );
  WithAnalytics.displayName = `withAnalytics(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return WithAnalytics;
};
