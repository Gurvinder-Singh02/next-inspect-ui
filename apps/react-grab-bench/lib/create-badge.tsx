"use client";

interface BadgeConfig {
  variant: string;
  testId: string;
}

export const createBadge = (config: BadgeConfig) => {
  const Badge = ({ label }: { label: string }) => (
    <span
      data-testid={config.testId}
      style={{
        padding: "2px 8px",
        borderRadius: 99,
        fontSize: 11,
        background: "var(--muted)",
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
  Badge.displayName = `Badge(${config.variant})`;
  return Badge;
};
