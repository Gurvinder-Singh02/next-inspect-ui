"use client";
import React from "react";

interface RenderPropFormProps {
  fields?: string[];
  renderField: (
    fieldName: string,
    props: { "data-testid"?: string },
  ) => React.ReactNode;
  "data-testid"?: string;
}

export const RenderPropForm = ({
  fields = ["Name", "Email", "Message"],
  renderField,
  "data-testid": testId,
}: RenderPropFormProps) => (
  <form
    data-testid={testId}
    style={{ display: "flex", flexDirection: "column", gap: 12 }}
    onSubmit={(event) => event.preventDefault()}
  >
    {fields.map((fieldName, fieldIndex) => (
      <div key={fieldIndex}>
        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
          {fieldName}
        </label>
        {renderField(fieldName, {
          "data-testid": testId ? `${testId}-field-${fieldIndex}` : undefined,
        })}
      </div>
    ))}
  </form>
);
