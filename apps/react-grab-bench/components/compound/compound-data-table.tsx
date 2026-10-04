"use client";

import React, { forwardRef } from "react";

interface CompoundDataTableProps {
  children: React.ReactNode;
  "data-testid"?: string;
}

interface SubComponentProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

const TableHead = ({ children, "data-testid": testId }: SubComponentProps) => (
  <thead data-testid={testId}>
    <tr
      style={{
        borderBottom: "2px solid var(--border)",
        backgroundColor: "#f9fafb",
      }}
    >
      {children || (
        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>
          Column
        </th>
      )}
    </tr>
  </thead>
);
TableHead.displayName = "DataTable.Head";

const TableRow = ({ children, "data-testid": testId }: SubComponentProps) => (
  <tr data-testid={testId} style={{ borderBottom: "1px solid var(--border)" }}>
    {children || <td style={{ padding: "8px 12px" }}>Row Data</td>}
  </tr>
);
TableRow.displayName = "DataTable.Row";

const TableCell = ({ children, "data-testid": testId }: SubComponentProps) => (
  <td data-testid={testId} style={{ padding: "8px 12px", fontSize: 14 }}>
    {children || "Cell Value"}
  </td>
);
TableCell.displayName = "DataTable.Cell";

const DataTableBase = forwardRef<HTMLTableElement, CompoundDataTableProps>(
  ({ children, "data-testid": testId }, ref) => (
    <table
      ref={ref}
      data-testid={testId}
      style={{
        width: "100%",
        borderCollapse: "collapse",
        border: "1px solid var(--border)",
        borderRadius: 8,
        fontSize: 14,
      }}
    >
      {children}
    </table>
  ),
);
DataTableBase.displayName = "DataTable";

export const CompoundDataTable = Object.assign(DataTableBase, {
  Head: TableHead,
  Row: TableRow,
  Cell: TableCell,
});
