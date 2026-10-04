"use client";
import React, { ComponentType } from "react";

export const withFeatureFlag = <P extends object>(
  WrappedComponent: ComponentType<P>,
) => {
  const WithFeatureFlag = (props: P) => (
    <div data-feature-flag="active" style={{ display: "contents" }}>
      <WrappedComponent {...props} />
    </div>
  );
  WithFeatureFlag.displayName = `withFeatureFlag(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return WithFeatureFlag;
};
