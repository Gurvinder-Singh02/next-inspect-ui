"use client";

import React from "react";

interface DisplayNameMenuProps {
  children: React.ReactNode;
  "data-testid"?: string;
}

interface SubComponentProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

interface DisplayNameItemProps extends SubComponentProps {
  onSelect?: () => void;
}

export const DisplayNameTrigger = ({
  children,
  "data-testid": testId,
}: SubComponentProps) => (
  <button
    data-testid={testId}
    style={{
      padding: "6px 14px",
      borderRadius: 6,
      border: "1px solid var(--border)",
      backgroundColor: "#fff",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 500,
    }}
  >
    {children || "Menu"}
  </button>
);
DisplayNameTrigger.displayName = "MenuTrigger";

export const DisplayNameContent = ({
  children,
  "data-testid": testId,
}: SubComponentProps) => (
  <div
    data-testid={testId}
    style={{
      border: "1px solid var(--border)",
      borderRadius: 8,
      backgroundColor: "#fff",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      padding: "4px 0",
      minWidth: 180,
    }}
  >
    {children}
  </div>
);
DisplayNameContent.displayName = "MenuContent";

export const DisplayNameItem = ({
  children,
  onSelect,
  "data-testid": testId,
}: DisplayNameItemProps) => (
  <div
    data-testid={testId}
    onClick={onSelect}
    role="menuitem"
    style={{
      padding: "6px 12px",
      cursor: "pointer",
      fontSize: 14,
      borderRadius: 4,
      margin: "0 4px",
    }}
  >
    {children || "Menu Item"}
  </div>
);
DisplayNameItem.displayName = "MenuItem";

export const DisplayNameSeparator = ({
  "data-testid": testId,
}: {
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    role="separator"
    style={{
      height: 1,
      backgroundColor: "var(--border)",
      margin: "4px 0",
    }}
  />
);
DisplayNameSeparator.displayName = "MenuSeparator";

const findChildByDisplayName = (
  children: React.ReactNode,
  displayName: string,
): React.ReactNode[] =>
  React.Children.toArray(children).filter(
    (child) =>
      React.isValidElement(child) &&
      typeof child.type !== "string" &&
      (child.type as React.ComponentType & { displayName?: string })
        .displayName === displayName,
  );

export const DisplayNameMenu = ({
  children,
  "data-testid": testId,
}: DisplayNameMenuProps) => {
  const triggerElements = findChildByDisplayName(children, "MenuTrigger");
  const contentElements = findChildByDisplayName(children, "MenuContent");

  return (
    <div data-testid={testId} style={{ position: "relative" }}>
      {triggerElements}
      {contentElements}
    </div>
  );
};
