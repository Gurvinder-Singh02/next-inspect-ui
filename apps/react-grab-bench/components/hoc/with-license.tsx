"use client";
import React, { ComponentType } from "react";

export const withLicense = <P extends object>(
  WrappedComponent: ComponentType<P>,
) => {
  const WithLicense = (props: P) => (
    <div data-license="premium" style={{ display: "contents" }}>
      <WrappedComponent {...props} />
    </div>
  );
  WithLicense.displayName = `withLicense(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return WithLicense;
};
