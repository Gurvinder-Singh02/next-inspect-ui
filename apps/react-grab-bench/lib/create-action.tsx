"use client";

interface ActionConfig {
  label: string;
  icon: string;
  testId: string;
}

export const createAction = (config: ActionConfig) => {
  const Action = () => (
    <button
      data-testid={config.testId}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 12px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "var(--background)",
        cursor: "pointer",
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </button>
  );
  Action.displayName = `Action(${config.label})`;
  return Action;
};
