"use client";
import React from "react";
import {
  ProjectionHost,
  ProjectionSource,
  ProjectionOutlet,
} from "@/lib/content-projection";

interface ProjectedBreadcrumbProps {
  "data-testid"?: string;
}

export const ProjectedBreadcrumb = ({
  "data-testid": testId,
}: ProjectedBreadcrumbProps) => (
  <ProjectionHost>
    <ProjectionSource>
      <nav style={{ display: "flex", gap: 4, fontSize: 13 }}>
        {["Home", "Projects", "react-bench", "Settings"].map(
          (segment, segmentIndex, segments) => (
            <React.Fragment key={segment}>
              <span
                style={{
                  color:
                    segmentIndex === segments.length - 1
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                  fontWeight: segmentIndex === segments.length - 1 ? 600 : 400,
                }}
              >
                {segment}
              </span>
              {segmentIndex < segments.length - 1 && (
                <span style={{ color: "var(--muted-foreground)" }}>/</span>
              )}
            </React.Fragment>
          ),
        )}
      </nav>
    </ProjectionSource>
    <ProjectionOutlet data-testid={testId} />
  </ProjectionHost>
);
