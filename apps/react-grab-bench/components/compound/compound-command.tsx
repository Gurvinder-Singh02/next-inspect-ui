"use client";

import React, { forwardRef } from "react";

interface CompoundCommandProps {
  children: React.ReactNode;
  "data-testid"?: string;
}

interface SubComponentProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

interface CommandInputProps {
  placeholder?: string;
  "data-testid"?: string;
}

const CommandInput = ({
  placeholder = "Type a command...",
  "data-testid": testId,
}: CommandInputProps) => (
  <div
    data-testid={testId}
    style={{
      padding: "8px 12px",
      borderBottom: "1px solid var(--border)",
    }}
  >
    <input
      type="text"
      placeholder={placeholder}
      style={{
        width: "100%",
        border: "none",
        outline: "none",
        fontSize: 14,
        backgroundColor: "transparent",
      }}
    />
  </div>
);
CommandInput.displayName = "Command.Input";

interface CommandGroupProps extends SubComponentProps {
  heading?: string;
}

const CommandGroup = ({
  children,
  heading,
  "data-testid": testId,
}: CommandGroupProps) => (
  <div data-testid={testId} style={{ padding: "4px 0" }}>
    {heading && (
      <div
        style={{
          padding: "4px 12px",
          fontSize: 11,
          fontWeight: 600,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {heading}
      </div>
    )}
    {children}
  </div>
);
CommandGroup.displayName = "Command.Group";

const CommandItem = ({
  children,
  "data-testid": testId,
}: SubComponentProps) => (
  <div
    data-testid={testId}
    style={{
      padding: "6px 12px",
      cursor: "pointer",
      borderRadius: 4,
      fontSize: 14,
    }}
  >
    {children || "Command Item"}
  </div>
);
CommandItem.displayName = "Command.Item";

const CommandBase = forwardRef<HTMLDivElement, CompoundCommandProps>(
  ({ children, "data-testid": testId }, ref) => (
    <div
      ref={ref}
      data-testid={testId}
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#fff",
        minWidth: 240,
      }}
    >
      {children}
    </div>
  ),
);
CommandBase.displayName = "Command";

export const CompoundCommand = Object.assign(CommandBase, {
  Input: CommandInput,
  Group: CommandGroup,
  Item: CommandItem,
});
