/**
 * Main entry — exactly one component.
 *
 * Everything else (settings, stamp parsing, source resolution, DOM
 * navigation helpers) lives at `next-inspect-ui/lib`. Bundlers retain every
 * export of a `"use client"` entry in the client bundle, so anything
 * exported from here is a per-page production cost for every consumer.
 */

export { InspectUI, type InspectUIProps } from "./inspect-ui"
