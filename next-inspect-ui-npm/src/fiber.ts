import { getElementFiber } from "./nav"
import { isBundledOrExternalPath, type SourceLocation } from "./source"

export type ServerDebugInfo = {
  name?: string
  env?: string
  key?: string
  stack?: unknown
  debugStack?: unknown
  debugLocation?: unknown
  owner?: ServerDebugInfo | null
}

export type ReactFiber = {
  _debugInfo?: ServerDebugInfo[] | null
  _debugOwner?: ReactFiber | null
  _debugSource?: {
    fileName?: string
    lineNumber?: number
    columnNumber?: number
  }
  _debugStack?: Error | string
  return?: ReactFiber | null
  child?: ReactFiber | null
  tag?: number
  stateNode?: unknown
  memoizedProps?: {
    className?: unknown
    class?: unknown
  } | null
  type?: {
    displayName?: string
    name?: string
  }
}

export type NamedTarget = {
  name: string
  fiber: ReactFiber
  debugInfo?: ServerDebugInfo
}

export type StackFrame = {
  file: string
  methodName: string
  arguments: string[]
  line1: number
  column1: number
  isServer: boolean
}

export const getFiber = (element: Element) => getElementFiber<ReactFiber>(element)

export const readComponentTypeName = (type: ReactFiber["type"]): string | null => {
  if (!type || typeof type === "string") return null

  const wrapper = type as {
    displayName?: string
    name?: string
    render?: { displayName?: string; name?: string }
    type?: { displayName?: string; name?: string }
  }
  const candidate =
    wrapper.displayName ??
    wrapper.name ??
    wrapper.render?.displayName ??
    wrapper.render?.name ??
    wrapper.type?.displayName ??
    wrapper.type?.name
  return typeof candidate === "string" && candidate ? candidate : null
}

export const isCompositeComponentFiber = (fiber: ReactFiber) => {
  const tag = fiber.tag
  return tag === 0 || tag === 1 || tag === 11 || tag === 14 || tag === 15
}

export const isHostComponentFiber = (fiber: ReactFiber) => fiber.tag === 5

export const isFrameworkInspectorName = (name: string) => {
  if (
    name === "SegmentViewNode" ||
    name === "SegmentTrieNode" ||
    name === "ClientSegmentRoot" ||
    name === "RenderFromTemplateContext" ||
    name === "OuterLayoutRouter" ||
    name === "InnerLayoutRouter" ||
    name === "AppRouter" ||
    name === "Router" ||
    name === "HotReload" ||
    name === "ReactDevOverlay" ||
    name === "ErrorBoundaryHandler" ||
    name === "LoadingBoundary" ||
    name === "RedirectBoundary" ||
    name === "HTTPAccessFallbackBoundary" ||
    name === "DevRootHTTPAccessFallbackBoundary" ||
    name === "ScrollAndFocusHandler" ||
    name === "RedirectErrorBoundary" ||
    name === "NotFoundBoundary" ||
    name === "NotFoundErrorBoundary" ||
    name === "RootErrorBoundary" ||
    name === "ReactStrictMode" ||
    name === "StrictMode" ||
    name === "ClientPageRoot" ||
    name === "ServerRoot" ||
    name === "AppDevOverlay" ||
    name === "AppDevOverlayErrorBoundary"
  ) {
    return true
  }

  return (
    name.startsWith("Segment") ||
    name.startsWith("__next") ||
    name.startsWith("Next") ||
    /Boundary$/i.test(name) ||
    /Fallback/i.test(name) ||
    /Router$/i.test(name) ||
    /Provider$/i.test(name) && name.includes("Next")
  )
}

export const getHostTagName = (fiber: ReactFiber | null): string | null => {
  let current = fiber

  while (current) {
    if (
      isHostComponentFiber(current) &&
      current.stateNode instanceof Element
    ) {
      return current.stateNode.tagName.toLowerCase()
    }

    if (current.tag === 6) {
      current = current.return ?? null
      continue
    }

    break
  }

  if (fiber?.stateNode instanceof Element) {
    return fiber.stateNode.tagName.toLowerCase()
  }

  return null
}

export const getNamedTarget = (fiber: ReactFiber | null): NamedTarget | null => {
  let current = fiber

  while (current) {
    if (isCompositeComponentFiber(current)) {
      const name = readComponentTypeName(current.type)
      if (name && !isFrameworkInspectorName(name)) {
        return { name, fiber: current }
      }
    }

    if (current._debugInfo?.length) {
      for (let index = current._debugInfo.length - 1; index >= 0; index -= 1) {
        const info = current._debugInfo[index]
        if (info.name && !isFrameworkInspectorName(info.name)) {
          return { name: info.name, fiber: current, debugInfo: info }
        }
      }
    }

    current = current.return ?? null
  }

  return null
}

const FRAGMENT_TAG = 7
const MODE_TAG = 8
const CONTEXT_CONSUMER_TAG = 9
const CONTEXT_PROVIDER_TAG = 10
const PROFILER_TAG = 12

const isWrapperFiber = (fiber: ReactFiber) =>
  fiber.tag === FRAGMENT_TAG ||
  fiber.tag === MODE_TAG ||
  fiber.tag === CONTEXT_CONSUMER_TAG ||
  fiber.tag === CONTEXT_PROVIDER_TAG ||
  fiber.tag === PROFILER_TAG

/** `motion.div` / `motion.rect` — a factory, not a user component. */
export const isMotionFactoryName = (name: string) => name.startsWith("motion.")

const isTransparentClimbFiber = (fiber: ReactFiber) => {
  if (!isCompositeComponentFiber(fiber)) return false
  const name = readComponentTypeName(fiber.type)
  return !!name && isMotionFactoryName(name)
}

const skipClimbAncestor = (fiber: ReactFiber) =>
  isWrapperFiber(fiber) || isTransparentClimbFiber(fiber)

export const getOwningCompositeFiber = (hostFiber: ReactFiber): ReactFiber | null => {
  let current = hostFiber.return ?? null

  while (current) {
    if (skipClimbAncestor(current)) {
      current = current.return ?? null
      continue
    }

    if (isCompositeComponentFiber(current)) {
      const name = readComponentTypeName(current.type)
      if (name && !isFrameworkInspectorName(name)) return current
      current = current.return ?? null
      continue
    }

    if (isHostComponentFiber(current)) return null

    current = current.return ?? null
  }

  return null
}

/**
 * Nested HTML under another host (`<div><p/></div>`) in a client fiber tree
 * — another host sits between this host and the nearest composite.
 * `motion.*` is skipped like the host it produces, so
 * `<div><motion.div/></div>` counts as nested.
 */
export const isHostNestedUnderHost = (hostFiber: ReactFiber): boolean => {
  let current = hostFiber.return ?? null

  while (current) {
    if (skipClimbAncestor(current)) {
      current = current.return ?? null
      continue
    }

    if (isHostComponentFiber(current)) return true
    if (isCompositeComponentFiber(current)) return false

    current = current.return ?? null
  }

  return false
}

export type ClimbOwner = {
  name: string
  fiber: ReactFiber
  debugInfo?: ServerDebugInfo

  isSelfDebugOwner: boolean
}

export const readDebugInfoOwner = (fiber: ReactFiber): ClimbOwner | null => {
  if (!fiber._debugInfo?.length) return null
  for (let index = fiber._debugInfo.length - 1; index >= 0; index -= 1) {
    const info = fiber._debugInfo[index]
    if (info.name && !isFrameworkInspectorName(info.name)) {
      return {
        name: info.name,
        fiber,
        debugInfo: info,
        isSelfDebugOwner: true,
      }
    }
  }
  return null
}

/**
 * RSC writes `_debugInfo` on every host in a component's return. A host is
 * nested (should not climb) when an ancestor host shares the same debug
 * component name — e.g. `<p>` under ServerCard's root `<div>`. A return-root
 * host whose parent host belongs to a *different* component (SuiteCase stage
 * wrapping `<ServerCard/>`) still climbs.
 */
export const isNestedDebugInfoHost = (hostFiber: ReactFiber): boolean => {
  const self = readDebugInfoOwner(hostFiber)
  if (!self) return false

  let current = hostFiber.return ?? null
  while (current) {
    if (skipClimbAncestor(current)) {
      current = current.return ?? null
      continue
    }

    if (isHostComponentFiber(current)) {
      const parentOwner = readDebugInfoOwner(current)
      return parentOwner?.name === self.name
    }

    if (isCompositeComponentFiber(current)) return false

    current = current.return ?? null
  }

  return false
}

export const getLabelOwner = (hostFiber: ReactFiber): ClimbOwner | null => {
  const fromDebug = readDebugInfoOwner(hostFiber)
  if (fromDebug) {
    // Same-component nested HTML (`return (<div><p/></div>)`) must not climb.
    // Return-root hosts still do — including RSC roots placed under a parent
    // host from a different component.
    if (isNestedDebugInfoHost(hostFiber)) return null
    return fromDebug
  }

  const composite = getOwningCompositeFiber(hostFiber)
  if (!composite) return null
  const name = readComponentTypeName(composite.type)
  if (!name || isFrameworkInspectorName(name)) return null
  return { name, fiber: composite, isSelfDebugOwner: false }
}

export const getDirectClimbOwner = (hostFiber: ReactFiber): ClimbOwner | null => {
  const strict = getLabelOwner(hostFiber)
  if (strict) return strict

  // `_debugOwner` points at the creating component even for nested HTML —
  // only allow that fallback for return-root hosts.
  if (isHostNestedUnderHost(hostFiber)) return null

  let owner: ReactFiber | null = hostFiber._debugOwner ?? null
  let hops = 0
  while (owner && hops < 12) {
    hops += 1
    const name = readComponentTypeName(owner.type)
    if (name && isMotionFactoryName(name)) {
      owner = owner._debugOwner ?? null
      continue
    }
    if (name && !isFrameworkInspectorName(name)) {
      return { name, fiber: owner, isSelfDebugOwner: false }
    }
    owner = owner._debugOwner ?? null
  }

  return null
}

export const getOwningCompositeName = (hostFiber: ReactFiber): string | null => {
  return getLabelOwner(hostFiber)?.name ?? null
}

export const isOwnerAncestorOf = (child: ReactFiber, parent: ReactFiber): boolean => {
  let current: ReactFiber | null = child._debugOwner ?? null
  let hops = 0

  while (current && hops < 32) {
    hops += 1
    if (current === parent) return true
    current = current._debugOwner ?? null
  }

  return false
}

export const isDirectFiberChildOf = (
  child: ReactFiber,
  parent: ReactFiber
): boolean => {
  let current = child.return ?? null

  while (current) {
    if (skipClimbAncestor(current)) {
      current = current.return ?? null
      continue
    }

    if (current === parent) return true
    if (isHostComponentFiber(current)) return false
    if (isCompositeComponentFiber(current)) return false

    current = current.return ?? null
  }

  return false
}

export const getComponentName = (fiber: ReactFiber | null) => {
  const hostTag = getHostTagName(fiber)
  const isHost =
    !!fiber &&
    (isHostComponentFiber(fiber) || fiber.stateNode instanceof Element)

  if (isHost && fiber) {
    const ownerName = getOwningCompositeName(fiber)
    if (ownerName) return ownerName
    if (hostTag) return hostTag
  }

  return getNamedTarget(fiber)?.name ?? hostTag
}

export const getMotionFactoryName = (fiber: ReactFiber | null): string | null => {
  let current = fiber?.return ?? null
  while (current) {
    if (isWrapperFiber(current)) {
      current = current.return ?? null
      continue
    }
    if (isHostComponentFiber(current)) return null
    if (isCompositeComponentFiber(current)) {
      const name = readComponentTypeName(current.type)
      if (name && isMotionFactoryName(name)) return name
      return null
    }
    current = current.return ?? null
  }
  return null
}

export const getDomHoverName = (fiber: ReactFiber | null) =>
  getMotionFactoryName(fiber) ?? getHostTagName(fiber)

export const getDebugSourceUntil = (
  start: ReactFiber | null,
  stop: ReactFiber | null
): SourceLocation | null => {
  let current = start

  while (current) {
    const source = current._debugSource

    if (source?.fileName && !isBundledOrExternalPath(source.fileName)) {
      return {
        filePath: source.fileName,
        line: source.lineNumber ?? 1,
        column: source.columnNumber ?? 1,
      }
    }

    if (stop && current === stop) break
    current = current.return ?? null
  }

  return null
}

export const parseDebugStack = (stack: string) => {
  const frames: StackFrame[] = []
  const frameKeys = new Set<string>()

  for (const line of stack.split("\n")) {
    if (
      line.includes("node_modules") ||
      line.includes("react-dom") ||
      line.includes("jsxDEV") ||
      line.includes("fakeJSXCallSite") ||
      line.includes("react-stack") ||
      line.includes("react_stack_bottom_frame")
    ) {
      continue
    }

    let match = line.match(
      /((?:about:\/\/React\/Server\/)?(?:file|https?):\/\/[^\s)]+?):(\d+):(\d+)\)?$/
    )

    if (!match) {
      match = line.match(
        /(?:at\s+)?(.+?)\s+\((\/?(?:Users|home|var|opt|app|[A-Za-z]:)[^)\s]+?\.(?:tsx|ts|jsx|js|mdx)):(\d+):(\d+)\)/
      )
      if (match) {
        const frame: StackFrame = {
          file: match[2],
          methodName: match[1].replace(/^\s*at\s+/, "") || "<unknown>",
          arguments: [],
          line1: Number(match[3]),
          column1: Number(match[4]),
          isServer: true,
        }
        const frameKey = `${frame.file}:${frame.line1}:${frame.column1}`
        if (!frameKeys.has(frameKey)) {
          frames.push(frame)
          frameKeys.add(frameKey)
        }
        continue
      }
    }

    if (!match) continue

    const methodName =
      line
        .slice(0, line.indexOf(match[0]))
        .replace(/^\s*at\s+/, "")
        .replace(/\s+\($/, "") || "<unknown>"

    const frame: StackFrame = {
      file: match[1],
      methodName,
      arguments: [],
      line1: Number(match[2]),
      column1: Number(match[3]),
      isServer: match[1].startsWith("about://React/Server/"),
    }
    const frameKey = `${frame.file}:${frame.line1}:${frame.column1}`

    if (!frameKeys.has(frameKey)) {
      frames.push(frame)
      frameKeys.add(frameKey)
    }
  }

  return frames
}

export const getStackFrames = (fiber: ReactFiber | null, stop?: ReactFiber | null) => {
  const frames: StackFrame[] = []
  const frameKeys = new Set<string>()
  let current = fiber

  while (current) {
    const stack =
      current._debugStack instanceof Error
        ? current._debugStack.stack
        : current._debugStack

    if (typeof stack === "string") {
      for (const frame of parseDebugStack(stack)) {
        const frameKey = `${frame.file}:${frame.line1}:${frame.column1}`
        if (!frameKeys.has(frameKey)) {
          frames.push(frame)
          frameKeys.add(frameKey)
        }
      }
    }

    if (stop && current === stop) break
    current = current.return ?? null
  }

  return frames
}

export const getOwnStackFrames = (fiber: ReactFiber) => {
  const stack =
    fiber._debugStack instanceof Error
      ? fiber._debugStack.stack
      : fiber._debugStack

  return typeof stack === "string" ? parseDebugStack(stack) : []
}

export const framesFromUnknownStack = (stack: unknown): StackFrame[] => {
  if (!stack) return []

  if (typeof stack === "string") return parseDebugStack(stack)

  if (stack instanceof Error && typeof stack.stack === "string") {
    return parseDebugStack(stack.stack)
  }

  if (typeof stack === "object" && !Array.isArray(stack)) {
    const record = stack as Record<string, unknown>
    const file =
      (typeof record.fileName === "string" && record.fileName) ||
      (typeof record.filename === "string" && record.filename) ||
      (typeof record.file === "string" && record.file) ||
      (typeof record.source === "string" && record.source) ||
      null
    const line1 =
      (typeof record.lineNumber === "number" && record.lineNumber) ||
      (typeof record.line1 === "number" && record.line1) ||
      (typeof record.line === "number" && record.line) ||
      null
    if (file && line1 != null) {
      const column1 =
        (typeof record.columnNumber === "number" && record.columnNumber) ||
        (typeof record.column1 === "number" && record.column1) ||
        (typeof record.column === "number" && record.column) ||
        1
      return [
        {
          file,
          methodName:
            typeof record.methodName === "string"
              ? record.methodName
              : typeof record.name === "string"
                ? record.name
                : "<unknown>",
          arguments: [],
          line1,
          column1,
          isServer:
            file.startsWith("about://React/Server/") ||
            file.includes("/_next/") ||
            file.includes(".next/server"),
        },
      ]
    }
  }

  if (Array.isArray(stack)) {
    const frames: StackFrame[] = []
    for (const entry of stack) {
      if (Array.isArray(entry) && entry.length >= 4) {
        const [methodName, file, line1, column1] = entry
        if (typeof file === "string" && typeof line1 === "number") {
          frames.push({
            file,
            methodName: typeof methodName === "string" ? methodName : "<unknown>",
            arguments: [],
            line1,
            column1: typeof column1 === "number" ? column1 : 1,
            isServer:
              file.startsWith("about://React/Server/") ||
              file.includes("/_next/"),
          })
        }
        continue
      }

      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>
        const file =
          (typeof record.file === "string" && record.file) ||
          (typeof record.fileName === "string" && record.fileName) ||
          (typeof record.filename === "string" && record.filename) ||
          (typeof record.source === "string" && record.source) ||
          null
        const line1 =
          (typeof record.line1 === "number" && record.line1) ||
          (typeof record.lineNumber === "number" && record.lineNumber) ||
          (typeof record.line === "number" && record.line) ||
          null
        if (!file || line1 == null) continue
        const column1 =
          (typeof record.column1 === "number" && record.column1) ||
          (typeof record.columnNumber === "number" && record.columnNumber) ||
          (typeof record.column === "number" && record.column) ||
          1
        frames.push({
          file,
          methodName:
            typeof record.methodName === "string"
              ? record.methodName
              : typeof record.name === "string"
                ? record.name
                : "<unknown>",
          arguments: [],
          line1,
          column1,
          isServer:
            file.startsWith("about://React/Server/") || file.includes("/_next/"),
        })
      }
    }
    return frames
  }

  return []
}

export const getDebugInfoFrames = (info: ServerDebugInfo) => {
  const frames: StackFrame[] = []
  const seen = new Set<string>()

  for (const candidate of [info.debugLocation, info.debugStack, info.stack]) {
    for (const frame of framesFromUnknownStack(candidate)) {
      const key = `${frame.file}:${frame.line1}:${frame.column1}`
      if (seen.has(key)) continue
      seen.add(key)
      frames.push(frame)
    }
  }

  return frames
}
