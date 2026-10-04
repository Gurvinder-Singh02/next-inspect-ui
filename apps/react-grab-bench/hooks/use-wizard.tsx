"use client";
import { useState } from "react";

export const useWizard = (steps: string[]) => {
  const [currentStep, setCurrentStep] = useState(0);
  return {
    currentStep,
    next: () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1)),
    prev: () => setCurrentStep((s) => Math.max(s - 1, 0)),
    steps,
  };
};

export const WizardStep = ({
  label,
  active,
  "data-testid": testId,
}: {
  label: string;
  active: boolean;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      padding: 12,
      opacity: active ? 1 : 0.4,
      fontWeight: active ? 600 : 400,
    }}
  >
    {label}
  </div>
);
