"use client";

interface RangePickerProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const RangePicker = ({
  children,
  "data-testid": testId,
}: RangePickerProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "RangePicker"}
  </div>
);
