"use client";

interface DecisionPromptProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const DecisionPrompt = ({
  children,
  "data-testid": testId,
}: DecisionPromptProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "DecisionPrompt"}
  </div>
);
