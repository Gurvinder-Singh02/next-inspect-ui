"use client";
export const IconLabel = ({
  icon,
  text,
  "data-testid": testId,
}: {
  icon: string;
  text: string;
  "data-testid"?: string;
}) => (
  <span
    data-testid={testId}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 12,
    }}
  >
    <span>{icon}</span>
    <span>{text}</span>
  </span>
);
