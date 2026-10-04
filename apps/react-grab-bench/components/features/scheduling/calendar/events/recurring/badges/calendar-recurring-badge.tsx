"use client";

interface CalendarRecurringBadgeProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const CalendarRecurringBadge = ({
  children,
  "data-testid": testId,
}: CalendarRecurringBadgeProps) => (
  <span
    data-testid={testId}
    style={{
      display: "inline-block",
      padding: "2px 8px",
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      borderRadius: 10,
      fontSize: 11,
      color: "#1e40af",
    }}
  >
    {children ?? "Recurring"}
  </span>
);
