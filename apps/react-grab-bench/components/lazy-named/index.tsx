"use client";
import React, { lazy, Suspense } from "react";

const LazyRichEditor = lazy(() =>
  import("./lazy-editor-source").then((module) => ({
    default: module.RichEditor,
  })),
);

const LazyAnalyticsChart = lazy(() =>
  import("./lazy-chart-source").then((module) => ({
    default: module.AnalyticsChart,
  })),
);

const LazyEventCalendar = lazy(() =>
  import("./lazy-calendar-source").then((module) => ({
    default: module.EventCalendar,
  })),
);

const LazyDataGrid = lazy(() =>
  import("./lazy-table-source").then((module) => ({
    default: module.DataGrid,
  })),
);

export const LazyNamedEditor = (props: { "data-testid"?: string }) => (
  <Suspense fallback={<div>Loading editor...</div>}>
    <LazyRichEditor {...props} />
  </Suspense>
);

export const LazyNamedChart = (props: { "data-testid"?: string }) => (
  <Suspense fallback={<div>Loading chart...</div>}>
    <LazyAnalyticsChart {...props} />
  </Suspense>
);

export const LazyNamedCalendar = (props: { "data-testid"?: string }) => (
  <Suspense fallback={<div>Loading calendar...</div>}>
    <LazyEventCalendar {...props} />
  </Suspense>
);

export const LazyNamedTable = (props: { "data-testid"?: string }) => (
  <Suspense fallback={<div>Loading table...</div>}>
    <LazyDataGrid {...props} />
  </Suspense>
);
