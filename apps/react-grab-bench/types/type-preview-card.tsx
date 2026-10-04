"use client";

interface TypePreviewCardProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const TypePreviewCard = ({
  children,
  "data-testid": testId,
}: TypePreviewCardProps) => (
  <div
    data-testid={testId}
    style={{
      padding: 12,
      border: "1px dashed #a78bfa",
      borderRadius: 6,
      background: "#faf5ff",
      fontSize: 12,
      color: "#6b21a8",
    }}
  >
    {children ?? "Type preview"}
  </div>
);
