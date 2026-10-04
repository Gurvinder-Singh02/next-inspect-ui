"use client";

const SmallWidget = ({ "data-testid": testId }: { "data-testid"?: string }) => (
  <div
    data-testid={testId}
    style={{
      padding: 8,
      borderRadius: 4,
      border: "1px solid var(--border)",
      fontSize: 11,
    }}
  >
    Small Widget
  </div>
);
const MediumWidget = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      padding: 16,
      borderRadius: 8,
      border: "1px solid var(--border)",
      fontSize: 13,
    }}
  >
    Medium Widget
  </div>
);
const LargeWidget = ({ "data-testid": testId }: { "data-testid"?: string }) => (
  <div
    data-testid={testId}
    style={{
      padding: 24,
      borderRadius: 12,
      border: "1px solid var(--border)",
      fontSize: 15,
    }}
  >
    Large Widget
  </div>
);

const WIDGET_REGISTRY: Record<string, React.FC<{ "data-testid"?: string }>> = {
  small: SmallWidget,
  medium: MediumWidget,
  large: LargeWidget,
};

export const DynamicWidget = ({
  size,
  "data-testid": testId,
}: {
  size: string;
  "data-testid"?: string;
}) => {
  const Widget = WIDGET_REGISTRY[size] ?? SmallWidget;
  return <Widget data-testid={testId} />;
};
