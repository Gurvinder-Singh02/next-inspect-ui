"use client";
import React from "react";

interface StepConfig {
  title: string;
  StepContent: React.FC<{ "data-testid"?: string }>;
  StepIndicator: React.FC<{ "data-testid"?: string }>;
}

const WelcomeContent = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div data-testid={testId} style={{ padding: 16 }}>
    Welcome to the wizard
  </div>
);

const WelcomeIndicator = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      width: 24,
      height: 24,
      borderRadius: "50%",
      background: "#3b82f6",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
    }}
  >
    1
  </div>
);

const STEPS: StepConfig[] = [
  {
    title: "Welcome",
    StepContent: WelcomeContent,
    StepIndicator: WelcomeIndicator,
  },
];

export const WizardStepFromConfig = ({
  stepIndex,
  part,
  "data-testid": testId,
}: {
  stepIndex: number;
  part: "content" | "indicator";
  "data-testid"?: string;
}) => {
  const step = STEPS[stepIndex] ?? STEPS[0];
  const Component = part === "content" ? step.StepContent : step.StepIndicator;
  return <Component data-testid={testId} />;
};
