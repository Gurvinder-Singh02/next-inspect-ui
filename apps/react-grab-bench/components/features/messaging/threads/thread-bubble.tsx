"use client";
export const ThreadBubble = ({
  text,
  sender,
  "data-testid": testId,
}: {
  text: string;
  sender: string;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      padding: "8px 12px",
      borderRadius: 12,
      background: "var(--muted)",
      maxWidth: 280,
      fontSize: 13,
    }}
  >
    <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 2 }}>
      {sender}
    </div>
    {text}
  </div>
);
