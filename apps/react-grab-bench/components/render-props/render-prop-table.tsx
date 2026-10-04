"use client";
import React from "react";

interface RenderPropTableProps {
  columns?: string[];
  rows?: string[][];
  renderCell: (
    cellValue: string,
    props: { "data-testid"?: string },
  ) => React.ReactNode;
  "data-testid"?: string;
}

export const RenderPropTable = ({
  columns = ["Name", "Status", "Action"],
  rows = [
    ["Alice", "Active", "Edit"],
    ["Bob", "Inactive", "Edit"],
  ],
  renderCell,
  "data-testid": testId,
}: RenderPropTableProps) => (
  <table
    data-testid={testId}
    style={{ width: "100%", borderCollapse: "collapse" }}
  >
    <thead>
      <tr>
        {columns.map((columnName) => (
          <th
            key={columnName}
            style={{
              textAlign: "left",
              padding: "8px 12px",
              borderBottom: "2px solid var(--border)",
              fontSize: 12,
            }}
          >
            {columnName}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {row.map((cellValue, cellIndex) => (
            <td
              key={cellIndex}
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {renderCell(cellValue, {
                "data-testid": testId
                  ? `${testId}-cell-${rowIndex}-${cellIndex}`
                  : undefined,
              })}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
