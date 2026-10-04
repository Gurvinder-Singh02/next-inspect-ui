"use client";

interface CalendarCellProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const CalendarCell = ({
  children,
  "data-testid": testId,
}: CalendarCellProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "CalendarCell"}
  </div>
);
