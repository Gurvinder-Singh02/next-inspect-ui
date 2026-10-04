"use client";
import { useState } from "react";

export const usePageNav = (total: number, pageSize = 10) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    totalPages,
    next: () =>
      setPage((previousPage) => Math.min(previousPage + 1, totalPages - 1)),
    prev: () => setPage((previousPage) => Math.max(previousPage - 1, 0)),
  };
};

export const PaginationNav = ({
  current,
  total,
  "data-testid": testId,
}: {
  current: number;
  total: number;
  "data-testid"?: string;
}) => (
  <div
    data-testid={testId}
    style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 12 }}
  >
    <span style={{ color: "var(--muted-foreground)" }}>
      Page {current + 1} of {total}
    </span>
  </div>
);
