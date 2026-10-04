"use client";
import React from "react";
import {
  ProjectionHost,
  ProjectionSource,
  ProjectionOutlet,
} from "@/lib/content-projection";

interface ProjectedStatsRowProps {
  "data-testid"?: string;
}

export const ProjectedStatsRow = ({
  "data-testid": testId,
}: ProjectedStatsRowProps) => (
  <ProjectionHost>
    <ProjectionSource>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          textAlign: "center",
        }}
      >
        {[
          { label: "Stars", value: "6.4k" },
          { label: "Forks", value: "312" },
          { label: "Issues", value: "47" },
        ].map((stat) => (
          <div key={stat.label}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </ProjectionSource>
    <ProjectionOutlet data-testid={testId} />
  </ProjectionHost>
);
