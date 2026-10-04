"use client";

interface DisplayConfig {
  title: string;
  format: "number" | "percent" | "currency";
  testId: string;
}

export const createDisplay = (config: DisplayConfig) => {
  const Display = ({ value }: { value: number }) => {
    let formatted = String(value);
    if (config.format === "percent") formatted = value + "%";
    if (config.format === "currency") formatted = "$" + value.toLocaleString();
    return (
      <div
        data-testid={config.testId}
        style={{
          padding: 12,
          borderRadius: 8,
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
          {config.title}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{formatted}</div>
      </div>
    );
  };
  Display.displayName = `Display(${config.title})`;
  return Display;
};
