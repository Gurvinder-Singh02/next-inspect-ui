"use client";

export const computeDiff = (a: string, b: string) => ({
  added: b.length - a.length,
  removed: a.length - b.length,
});

export const DiffLine = ({
  line,
  type,
  "data-testid": testId,
}: {
  line: string;
  type: "added" | "removed" | "unchanged";
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{
      fontFamily: "monospace",
      fontSize: 12,
      padding: "2px 8px",
      background:
        type === "added"
          ? "rgba(0,200,0,0.1)"
          : type === "removed"
            ? "rgba(200,0,0,0.1)"
            : "transparent",
    }}
  >
    <span style={{ color: "var(--muted-foreground)", marginRight: 8 }}>
      {type === "added" ? "+" : type === "removed" ? "-" : " "}
    </span>
    {line}
  </div>
);
