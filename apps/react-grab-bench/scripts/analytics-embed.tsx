"use client";

interface AnalyticsEmbedWidgetProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const AnalyticsEmbedWidget = ({
  children,
  "data-testid": testId,
}: AnalyticsEmbedWidgetProps) => (
  <div
    data-testid={testId}
    style={{
      padding: "8px 12px",
      background: "#f0f9ff",
      border: "1px solid #bae6fd",
      borderRadius: 4,
      fontSize: 12,
      color: "#0c4a6e",
    }}
  >
    {children ?? "Analytics tracking active"}
  </div>
);
