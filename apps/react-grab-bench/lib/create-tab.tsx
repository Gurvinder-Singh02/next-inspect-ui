"use client";

interface TabConfig {
  label: string;
  testId: string;
}

export const createTab = (config: TabConfig) => {
  const Tab = ({ active }: { active?: boolean }) => (
    <button
      data-testid={config.testId}
      style={{
        padding: "6px 14px",
        borderRadius: 6,
        border: active
          ? "1px solid var(--foreground)"
          : "1px solid transparent",
        background: active ? "var(--muted)" : "transparent",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {config.label}
    </button>
  );
  Tab.displayName = `Tab(${config.label})`;
  return Tab;
};
