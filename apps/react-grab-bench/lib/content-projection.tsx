"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface ProjectionSlot {
  content: React.ReactNode;
  setContent: (node: React.ReactNode) => void;
}

const ProjectionContext = createContext<ProjectionSlot>({
  content: null,
  setContent: () => {},
});

export const ProjectionHost = ({ children }: { children: React.ReactNode }) => {
  const [content, setContent] = useState<React.ReactNode>(null);
  return (
    <ProjectionContext.Provider value={{ content, setContent }}>
      {children}
    </ProjectionContext.Provider>
  );
};

export const ProjectionSource = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { setContent } = useContext(ProjectionContext);
  useEffect(() => {
    setContent(children);
    return () => setContent(null);
  }, [children, setContent]);
  return null;
};

export const ProjectionOutlet = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => {
  const { content } = useContext(ProjectionContext);
  return (
    <div
      data-testid={testId}
      style={{
        padding: 12,
        borderRadius: 8,
        border: "1px solid var(--border)",
      }}
    >
      {content}
    </div>
  );
};
