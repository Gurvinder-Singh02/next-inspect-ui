"use client";

interface DeploymentEnvSecretProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const DeploymentEnvSecret = ({
  children,
  "data-testid": testId,
}: DeploymentEnvSecretProps) => (
  <div
    data-testid={testId}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 12px",
      background: "#fafafa",
      border: "1px solid var(--border)",
      borderRadius: 4,
      fontSize: 12,
      fontFamily: "monospace",
    }}
  >
    {children ?? "••••••••"}
  </div>
);
