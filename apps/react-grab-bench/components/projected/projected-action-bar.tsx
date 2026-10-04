"use client";
import React from "react";
import {
  ProjectionHost,
  ProjectionSource,
  ProjectionOutlet,
} from "@/lib/content-projection";

interface ProjectedActionBarProps {
  "data-testid"?: string;
}

export const ProjectedActionBar = ({
  "data-testid": testId,
}: ProjectedActionBarProps) => (
  <ProjectionHost>
    <ProjectionSource>
      <div style={{ display: "flex", gap: 8 }}>
        {["Save Draft", "Preview", "Publish"].map((label) => (
          <button
            key={label}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: label === "Publish" ? "#2563eb" : "var(--background)",
              color: label === "Publish" ? "white" : "inherit",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </ProjectionSource>
    <ProjectionOutlet data-testid={testId} />
  </ProjectionHost>
);
