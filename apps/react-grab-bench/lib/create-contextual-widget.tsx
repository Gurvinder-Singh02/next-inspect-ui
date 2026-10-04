"use client";
import React, { createContext, useContext } from "react";

interface WidgetTheme {
  background: string;
  foreground: string;
  accent: string;
}

const ThemeContext = createContext<WidgetTheme>({
  background: "var(--background)",
  foreground: "var(--foreground)",
  accent: "#6366f1",
});

const WidgetChrome = ({ children }: { children: React.ReactNode }) => {
  const theme = useContext(ThemeContext);
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: theme.background,
        color: theme.foreground,
      }}
    >
      {children}
    </div>
  );
};

interface ContextualWidgetConfig {
  title: string;
  icon: string;
  theme: WidgetTheme;
  testId: string;
}

export const createContextualWidget = (config: ContextualWidgetConfig) => {
  const ContextualWidget = ({ value }: { value: string }) => (
    <ThemeContext.Provider value={config.theme}>
      <WidgetChrome>
        <div
          data-testid={config.testId}
          style={{ display: "flex", flexDirection: "column", gap: 4 }}
        >
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {config.icon} {config.title}
          </span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{value}</span>
        </div>
      </WidgetChrome>
    </ThemeContext.Provider>
  );
  ContextualWidget.displayName = `ContextualWidget(${config.title})`;
  return ContextualWidget;
};
