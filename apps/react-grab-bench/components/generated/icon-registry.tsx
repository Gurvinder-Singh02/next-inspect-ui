"use client";

const CircleIcon = ({ "data-testid": testId }: { "data-testid"?: string }) => (
  <div
    data-testid={testId}
    style={{
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: "var(--foreground)",
    }}
  />
);
const SquareIcon = ({ "data-testid": testId }: { "data-testid"?: string }) => (
  <div
    data-testid={testId}
    style={{
      width: 16,
      height: 16,
      borderRadius: 2,
      background: "var(--foreground)",
    }}
  />
);
const TriangleIcon = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      width: 0,
      height: 0,
      borderLeft: "8px solid transparent",
      borderRight: "8px solid transparent",
      borderBottom: "16px solid var(--foreground)",
    }}
  />
);
const StarIcon = ({ "data-testid": testId }: { "data-testid"?: string }) => (
  <div data-testid={testId} style={{ fontSize: 16 }}>
    ★
  </div>
);
const DiamondIcon = ({ "data-testid": testId }: { "data-testid"?: string }) => (
  <div
    data-testid={testId}
    style={{
      width: 12,
      height: 12,
      background: "var(--foreground)",
      transform: "rotate(45deg)",
    }}
  />
);

const ICON_REGISTRY: Record<string, React.FC<{ "data-testid"?: string }>> = {
  circle: CircleIcon,
  square: SquareIcon,
  triangle: TriangleIcon,
  star: StarIcon,
  diamond: DiamondIcon,
};

export const DynamicIcon = ({
  shape,
  "data-testid": testId,
}: {
  shape: string;
  "data-testid"?: string;
}) => {
  const Icon = ICON_REGISTRY[shape] ?? CircleIcon;
  return <Icon data-testid={testId} />;
};
