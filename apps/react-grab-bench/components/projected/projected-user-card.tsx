"use client";
import React from "react";
import {
  ProjectionHost,
  ProjectionSource,
  ProjectionOutlet,
} from "@/lib/content-projection";

interface ProjectedUserCardProps {
  "data-testid"?: string;
}

export const ProjectedUserCard = ({
  "data-testid": testId,
}: ProjectedUserCardProps) => (
  <ProjectionHost>
    <ProjectionSource>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#8b5cf6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 600,
          }}
        >
          AB
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>Aiden Bai</div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            aiden@example.com
          </div>
        </div>
      </div>
    </ProjectionSource>
    <ProjectionOutlet data-testid={testId} />
  </ProjectionHost>
);
