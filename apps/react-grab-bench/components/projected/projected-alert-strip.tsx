"use client";
import React from "react";
import {
  ProjectionHost,
  ProjectionSource,
  ProjectionOutlet,
} from "@/lib/content-projection";

interface ProjectedAlertStripProps {
  "data-testid"?: string;
}

export const ProjectedAlertStrip = ({
  "data-testid": testId,
}: ProjectedAlertStripProps) => (
  <ProjectionHost>
    <ProjectionSource>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#b91c1c",
        }}
      >
        <span>⛔</span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          Rate limit exceeded — retry in 30s
        </span>
      </div>
    </ProjectionSource>
    <ProjectionOutlet data-testid={testId} />
  </ProjectionHost>
);
