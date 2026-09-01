import type { ReactNode } from "react";

/** Named export so the fiber.type.name is "TestCard". */
export function TestCard({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #333",
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        textAlign: "left",
        maxWidth: 420,
      }}
    >
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>{title}</h2>
      {children}
    </div>
  );
}
