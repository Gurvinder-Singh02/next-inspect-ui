"use client";

interface CalendarEntryProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const CalendarEntry = ({
  children,
  "data-testid": testId,
}: CalendarEntryProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      fontSize: 12,
      border: "1px solid var(--border)",
      borderRadius: 6,
    }}
  >
    {children ?? "CalendarEntry"}
  </div>
);
