"use client";
import React from "react";

interface ElementRendererProps {
  elementType: string;
  "data-testid"?: string;
}

interface InternalElementProps {
  "data-testid"?: string;
}

const elementStyle: React.CSSProperties = {
  padding: 8,
  border: "1px solid var(--border, #e5e7eb)",
  borderRadius: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
};

const TextElement = ({ "data-testid": testId }: InternalElementProps) => (
  <div data-testid={testId} style={elementStyle}>
    <input
      type="text"
      placeholder="Enter text..."
      style={inputStyle}
      readOnly
    />
  </div>
);

const NumberElement = ({ "data-testid": testId }: InternalElementProps) => (
  <div data-testid={testId} style={elementStyle}>
    <input type="number" placeholder="0" style={inputStyle} readOnly />
  </div>
);

const DateElement = ({ "data-testid": testId }: InternalElementProps) => (
  <div data-testid={testId} style={elementStyle}>
    <input type="date" style={inputStyle} readOnly />
  </div>
);

const SelectElement = ({ "data-testid": testId }: InternalElementProps) => (
  <div data-testid={testId} style={elementStyle}>
    <select style={{ ...inputStyle, cursor: "pointer" }} disabled>
      <option>Select an option...</option>
      <option>Option A</option>
      <option>Option B</option>
      <option>Option C</option>
    </select>
  </div>
);

const RatingElement = ({ "data-testid": testId }: InternalElementProps) => (
  <div
    data-testid={testId}
    style={{ ...elementStyle, display: "flex", gap: 4 }}
  >
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        style={{
          fontSize: 18,
          color: "var(--muted, #d1d5db)",
          cursor: "default",
        }}
      >
        ★
      </span>
    ))}
  </div>
);

const ELEMENT_MAP: Record<string, React.FC<InternalElementProps>> = {
  text: TextElement,
  number: NumberElement,
  date: DateElement,
  select: SelectElement,
  rating: RatingElement,
};

export const ElementRenderer = ({
  elementType,
  "data-testid": testId,
}: ElementRendererProps) => {
  const Element = ELEMENT_MAP[elementType] ?? TextElement;
  return <Element data-testid={testId} />;
};
