"use client";
import React from "react";

interface SlotContentConfig {
  slotName: string;
  testId: string;
}

const SlotFrame = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => (
  <div
    style={{
      padding: 12,
      borderRadius: 8,
      border: "1px dashed var(--border)",
      position: "relative",
    }}
  >
    <span
      style={{
        position: "absolute",
        top: -8,
        left: 8,
        fontSize: 10,
        padding: "0 4px",
        background: "var(--background)",
        color: "var(--muted-foreground)",
      }}
    >
      slot: {label}
    </span>
    {children}
  </div>
);

export const createSlotContent = (config: SlotContentConfig) => {
  const SlotContent = ({ children }: { children: React.ReactNode }) => (
    <SlotFrame label={config.slotName}>
      <div data-testid={config.testId}>{children}</div>
    </SlotFrame>
  );
  SlotContent.displayName = `SlotContent(${config.slotName})`;
  return SlotContent;
};
