"use client";

interface AlertConfig {
  severity: "info" | "warning" | "error" | "success";
  testId: string;
}

export const createAlert = (config: AlertConfig) => {
  const colors = {
    info: "#3b82f6",
    warning: "#f59e0b",
    error: "#ef4444",
    success: "#22c55e",
  };
  const Alert = ({ message }: { message: string }) => (
    <div
      data-testid={config.testId}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        borderLeft: `3px solid ${colors[config.severity]}`,
        background: "var(--muted)",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
  Alert.displayName = `Alert(${config.severity})`;
  return Alert;
};
