"use client";

interface CardConfig {
  title: string;
  icon: string;
  testId: string;
}

export const createCard = (config: CardConfig) => {
  const Card = ({ value }: { value: string | number }) => (
    <div
      data-testid={config.testId}
      style={{
        padding: 16,
        borderRadius: 12,
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span>{config.icon}</span>
        <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
          {config.title}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
  Card.displayName = `Card(${config.title})`;
  return Card;
};
