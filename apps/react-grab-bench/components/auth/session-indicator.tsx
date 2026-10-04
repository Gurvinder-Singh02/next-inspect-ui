"use client";

interface SessionAvatarProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

export const SessionAvatar = ({
  children,
  "data-testid": testId,
}: SessionAvatarProps) => (
  <div data-testid={testId} style={{ padding: "8px" }}>
    {children ?? "SessionAvatar"}
  </div>
);
