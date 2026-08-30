/**
 * Reading the build-time stamps written by `plugin/babel-stamp`.
 *
 * Client-safe: no Node imports, so the runtime overlay and the verifier share
 * one definition of the stamp format. If the format ever changes, it changes
 * in one place and both ends move together.
 */

import type { SourceLocation } from "./inspector-source"

export const HOST_STAMP_ATTR = "data-inspect-host"
export const OWNER_STAMP_ATTR = "data-inspect-owner"

/**
 * Stamps are `relative/path.tsx:line:column`. Parsed from the right, because a
 * path may legitimately contain a colon while the two trailing numeric fields
 * never do.
 */
export const parseStampValue = (
  value: string | null | undefined,
  projectRoot: string
): SourceLocation | null => {
  if (!value) return null

  const lastColon = value.lastIndexOf(":")
  if (lastColon <= 0) return null

  const prevColon = value.lastIndexOf(":", lastColon - 1)
  if (prevColon <= 0) return null

  const line = Number(value.slice(prevColon + 1, lastColon))
  const column = Number(value.slice(lastColon + 1))
  const relativePath = value.slice(0, prevColon)

  if (!relativePath || !Number.isFinite(line) || !Number.isFinite(column)) {
    return null
  }

  return {
    filePath: `${projectRoot.replace(/\/$/, "")}/${relativePath.replace(/^\.\//, "")}`,
    line,
    column,
  }
}

/**
 * The DOM node's own authoring site. Read straight off the element — the stamp
 * is pushed after any `{...props}` spread, so a wrapper's caller cannot have
 * overwritten it.
 */
export const readHostStamp = (
  element: Element,
  projectRoot: string
): SourceLocation | null =>
  parseStampValue(element.getAttribute(HOST_STAMP_ATTR), projectRoot)

/**
 * The call site of the component that produced this node, when the component
 * forwards unknown props onto its host (`{...props}`, Base UI `mergeProps`).
 * Absent for components that don't forward — that's expected, not a failure.
 */
export const readOwnerStamp = (
  element: Element,
  projectRoot: string
): SourceLocation | null =>
  parseStampValue(element.getAttribute(OWNER_STAMP_ATTR), projectRoot)

/**
 * Nearest stamped ancestor, for DOM built inside `node_modules` (Base UI's
 * `useRender`, `next/image`) where the hovered node itself was never authored
 * in project source.
 */
export const findNearestHostStamp = (
  element: Element,
  projectRoot: string
): { source: SourceLocation; element: Element } | null => {
  let current: Element | null = element

  while (current) {
    const source = readHostStamp(current, projectRoot)
    if (source) return { source, element: current }
    current = current.parentElement
  }

  return null
}

/** Whether stamping is active at all — drives the "add withInspectUI" nudge. */
export const documentHasStamps = () =>
  document.querySelector(`[${HOST_STAMP_ATTR}]`) !== null
