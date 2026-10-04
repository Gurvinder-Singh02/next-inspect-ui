"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface TunnelContextValue {
  content: ReactNode;
  setContent: (content: ReactNode) => void;
}

const TunnelContext = createContext<TunnelContextValue>({
  content: null,
  setContent: () => {},
});

export const TunnelProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<ReactNode>(null);
  return (
    <TunnelContext.Provider value={{ content, setContent }}>
      {children}
    </TunnelContext.Provider>
  );
};

export const TunnelIn = ({ children }: { children: ReactNode }) => {
  const { setContent } = useContext(TunnelContext);
  React.useEffect(() => {
    setContent(children);
    return () => setContent(null);
  }, [children, setContent]);
  return null;
};

export const TunnelOut = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => {
  const { content } = useContext(TunnelContext);
  return <div data-testid={testId}>{content}</div>;
};
