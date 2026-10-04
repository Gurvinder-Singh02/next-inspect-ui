"use client";

interface OptionPickerProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const OptionPicker = ({
  children,
  "data-testid": testId,
}: OptionPickerProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "OptionPicker"}
  </div>
);
