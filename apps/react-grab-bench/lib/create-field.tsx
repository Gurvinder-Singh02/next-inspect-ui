"use client";
import { useState } from "react";

interface FieldConfig {
  label: string;
  placeholder: string;
  testId: string;
  type?: string;
}

export const createField = (config: FieldConfig) => {
  const Field = () => {
    const [value, setValue] = useState("");
    return (
      <label
        data-testid={config.testId}
        style={{ display: "flex", flexDirection: "column", gap: 4 }}
      >
        <span style={{ fontSize: 12, fontWeight: 500 }}>{config.label}</span>
        <input
          type={config.type ?? "text"}
          placeholder={config.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--background)",
          }}
        />
      </label>
    );
  };
  Field.displayName = `Field(${config.label})`;
  return Field;
};
