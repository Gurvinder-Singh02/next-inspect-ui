import {
  INSPECTOR_IDES,
  toAbsolutePath,
  type InspectorIde,
} from "./index.ts"
import { markInspectNode, paintStyleTab } from "../styles/styles.ts"

const getElementFiber = <T = unknown>(element: Element): T | null => {
  const fiberKey = Object.keys(element).find((key) => key.startsWith("__reactFiber$"))
  return fiberKey ? ((element as unknown as Record<string, T>)[fiberKey] ?? null) : null
}

export const isInspectorChrome = (element: Element) =>
  Boolean(
    element.closest(
      "[data-dev-inspector-ghost-overlay], [data-dev-inspector-ghost-tooltip], [data-dev-inspector-overlay], [data-dev-inspector-tooltip], [data-dev-inspector-info], [data-dev-inspector-log], [data-dev-inspector-debug-toggle]"
    )
  )

const isSkippedNavHost = (element: Element) => {
  const tag = element.tagName.toLowerCase()
  if (["script","style","template","link","meta","noscript"].includes(tag)) {
    return true
  }

  if (!(element instanceof HTMLElement)) return false
  if (element.hidden) return true
  if (element.getAttribute("aria-hidden") === "true") return true

  const { display, visibility } = element.style
  if (display === "none" || visibility === "hidden") return true

  return false
}

const isInspectable = (element: Element) =>
  !isInspectorChrome(element) &&
  !isSkippedNavHost(element) &&
  getElementFiber(element) !== null

export const findParentInspectable = (element: Element): Element | null => {
  for (let current = element.parentElement; current && current !== document.body && current !== document.documentElement; current = current.parentElement) {
    if (isInspectable(current)) return current
  }
  return null
}

export const findChildInspectable = (element: Element): Element | null => {
  const walk = (onlySkipped: boolean): Element | null => {
    for (const child of element.children) {
      if (isInspectorChrome(child)) continue
      if (onlySkipped ? !isSkippedNavHost(child) : isSkippedNavHost(child)) continue
      if (!onlySkipped && getElementFiber(child) !== null) return child
      const nested = findChildInspectable(child)
      if (nested) return nested
    }
    return null
  }
  return walk(false) ?? walk(true)
}

export const findChildInspectableWhere = (
  element: Element,
  accept: (candidate: Element) => boolean
): Element | null => {
  const queue: Element[] = Array.from(element.children)
  const seen = new Set<Element>()

  while (queue.length > 0) {
    const child = queue.shift()!
    if (seen.has(child) || isInspectorChrome(child)) continue
    seen.add(child)

    if (!isSkippedNavHost(child) && getElementFiber(child) !== null) {
      if (accept(child)) return child
    }

    for (const nested of child.children) queue.push(nested)
  }

  return null
}

export const findSiblingInspectable = (element: Element, direction: "prev" | "next"): Element | null => {
  for (let current = direction === "prev" ? element.previousElementSibling : element.nextElementSibling; current; current = direction === "prev" ? current.previousElementSibling : current.nextElementSibling) {
    if (isInspectable(current)) return current
  }
  return null
}

export const findEdgeSiblingInspectable = (
  element: Element,
  edge: "first" | "last"
): Element | null => {
  const parent = element.parentElement
  if (!parent) return null

  const children = Array.from(parent.children)
  const ordered = edge === "first" ? children : children.reverse()

  for (const child of ordered) {
    if (isInspectable(child)) return child
  }

  return null
}

export type SourceLocation = { filePath: string; line: number; column: number }

type FiberDebugSource = { fileName?: string; lineNumber?: number; columnNumber?: number }

export const isBundledOrExternalPath = (filePath: string) => {
  const file = filePath.replace(/\\/g, "/")
  return /(?:^|\/)node_modules\/|\/(?:\.next|_next)\/|^\.next\/|webpack-internal:|webpack:\/\/|turbopack:\/\/|about:\/\/React\//.test(file)
}

/** RSC / Next server chunks — including Turbopack `.next/dev/server`. */
export const isReactServerStackFile = (filePath: string) => {
  const file = filePath.replace(/\\/g, "/")
  return (
    file.startsWith("about://React/Server/") ||
    file.includes(".next/server") ||
    file.includes(".next/dev/server") ||
    file.includes("/(rsc)/") ||
    file.includes("/ssr/")
  )
}

const isFilesystemAbsolutePath = (filePath: string) => {
  const file = filePath.replace(/\\/g, "/")
  return (
    file.startsWith("/Users/") ||
    file.startsWith("/home/") ||
    file.startsWith("/private/") ||
    file.startsWith("/Volumes/") ||
    /^\/[a-zA-Z]:\//.test(file) ||
    /^[a-zA-Z]:\//.test(file)
  )
}

export const resolveSourceMapSourcePath = ({
  source,
  sourceRoot,
  sourceMapUrl,
  projectRoot,
}: {
  source: string
  sourceRoot?: string
  sourceMapUrl: URL
  projectRoot: string
}) => {
  const withRoot = sourceRoot
    ? `${sourceRoot.replace(/\/$/, "")}/${source.replace(/^\.\//, "")}`
    : source

  if (withRoot.startsWith("file://")) {
    return toAbsolutePath(withRoot, projectRoot)
  }

  if (
    (projectRoot && withRoot.startsWith(projectRoot)) ||
    isFilesystemAbsolutePath(withRoot)
  ) {
    return toAbsolutePath(withRoot, projectRoot)
  }

  const mapPathname = sourceMapUrl.pathname.endsWith(".map")
    ? sourceMapUrl.pathname.slice(0, -4)
    : sourceMapUrl.pathname
  const mapDir = mapPathname.replace(/[^/]+$/, "") || "/"

  let urlPathname: string
  try {
    if (withRoot.startsWith("http://") || withRoot.startsWith("https://")) {
      urlPathname = new URL(withRoot).pathname
    } else if (withRoot.startsWith("/")) {
      urlPathname = withRoot
    } else {
      urlPathname = new URL(withRoot, `http://vite.local${mapDir}`).pathname
    }
  } catch {
    return toAbsolutePath(withRoot, projectRoot)
  }

  const isHttpMap =
    sourceMapUrl.protocol === "http:" || sourceMapUrl.protocol === "https:"

  if (
    isHttpMap &&
    urlPathname.startsWith("/") &&
    isLikelySourceFile(urlPathname) &&
    !urlPathname.includes("/node_modules/") &&
    !urlPathname.includes("/_next/") &&
    !isFilesystemAbsolutePath(urlPathname)
  ) {
    return `${projectRoot.replace(/\/$/, "")}${urlPathname}`
  }

  return toAbsolutePath(urlPathname.startsWith("/") ? urlPathname : withRoot, projectRoot)
}

export const formatPageLabel = (source: SourceLocation, projectRoot: string) => {
  const relativePath = projectRoot && source.filePath.startsWith(projectRoot) ? source.filePath.slice(projectRoot.length + 1) : source.filePath
  return `${relativePath}:${source.line}`
}

const isLikelySourceFile = (filePath: string) =>
  /\.(tsx|ts|jsx|js|mdx)$/.test(filePath.split("?")[0] ?? "");

export const sourceFromFiberDebugSource = (debugSource: FiberDebugSource | null | undefined, projectRoot: string): SourceLocation | null => {
  if (!debugSource?.fileName || isBundledOrExternalPath(debugSource.fileName)) return null
  return { filePath: toAbsolutePath(debugSource.fileName, projectRoot), line: debugSource.lineNumber ?? 1, column: debugSource.columnNumber ?? 1 }
}

export const isDistinctUsedSource = (usage: SourceLocation | null | undefined, definition: SourceLocation | null | undefined) =>
  Boolean(usage && definition && usage.filePath !== definition.filePath)

export const isClimbUsageBoundary = ({
  usage, definition, host,
}: { usage: SourceLocation | null | undefined; definition: SourceLocation | null | undefined; host?: SourceLocation | null | undefined }) => {
  if (!usage || isBundledOrExternalPath(usage.filePath)) return false
  if (definition && usage.filePath !== definition.filePath) return true
  if (host && usage.filePath !== host.filePath) return true
  return false
}

type NamedSourceFrame = { methodName: string; source: SourceLocation }

const frameMatchesComponent = (methodName: string, componentName: string) => {
  const method = methodName.trim()
  return !!method && method !== "<unknown>" && (method === componentName || method.endsWith(`.${componentName}`) || method.startsWith(`${componentName}.`))
}

const pickPreferredStackSource = (frames: NamedSourceFrame[], componentName?: string | null): SourceLocation | null => {
  if (!frames.length) return null
  if (componentName) return frames.find((frame) => frameMatchesComponent(frame.methodName, componentName))?.source ?? frames[0]?.source ?? null
  return frames[0]?.source ?? null
}

const pickOpenSource = (
  host: SourceLocation | null | undefined,
  stack: SourceLocation | null | undefined,
): SourceLocation | null => host ?? stack ?? null;

export type ClimbSourcePair = { source: SourceLocation | null; definition: SourceLocation | null }

export const getClimbStepDisplaySource = (
  step: ClimbSourcePair,
): SourceLocation | null => step.source ?? step.definition

const pickDefinedSource = ({
  host, componentDefinition, labelIsComponent,
}: { host: SourceLocation | null | undefined; componentDefinition: SourceLocation | null | undefined; labelIsComponent: boolean }) =>
  labelIsComponent ? (componentDefinition ?? host ?? null) : (host ?? componentDefinition ?? null)

export type ServerDebugInfo = {
  name?: string; env?: string; key?: string; stack?: unknown; debugStack?: unknown
  debugLocation?: unknown; owner?: ServerDebugInfo | null
}

export type ReactFiber = {
  _debugInfo?: ServerDebugInfo[] | null; _debugOwner?: ReactFiber | null
  _debugSource?: { fileName?: string; lineNumber?: number; columnNumber?: number }
  _debugStack?: Error | string; return?: ReactFiber | null; child?: ReactFiber | null; tag?: number
  stateNode?: unknown; memoizedProps?: { className?: unknown; class?: unknown } | null
  type?: { displayName?: string; name?: string }
  elementType?: { displayName?: string; name?: string }
}

type NamedTarget = { name: string; fiber: ReactFiber; debugInfo?: ServerDebugInfo }

type StackFrame = {
  file: string; methodName: string; arguments: string[]; line1: number; column1: number; isServer: boolean
}

export const getFiber = (element: Element) => getElementFiber<ReactFiber>(element)

export const readComponentTypeName = (type: ReactFiber["type"]): string | null => {
  if (!type || typeof type === "string") return null
  const w = type as {
    displayName?: string; name?: string
    render?: { displayName?: string; name?: string }
    type?: { displayName?: string; name?: string }
  }
  const candidate = w.displayName ?? w.name ?? w.render?.displayName ?? w.render?.name ?? w.type?.displayName ?? w.type?.name
  return typeof candidate === "string" && candidate ? candidate : null
}

export const readFiberComponentName = (fiber: ReactFiber): string | null =>
  fiber.elementType?.displayName || readComponentTypeName(fiber.type)

export const isCompositeComponentFiber = (fiber: ReactFiber) =>
  [0, 1, 11, 14, 15].includes(fiber.tag ?? -1)

export const isHostComponentFiber = (fiber: ReactFiber) => fiber.tag === 5

const FRAMEWORK_EXACT = new Set([
  "SegmentViewNode", "SegmentTrieNode", "ClientSegmentRoot", "RenderFromTemplateContext",
  "OuterLayoutRouter", "InnerLayoutRouter", "AppRouter", "Router", "HotReload",
  "ReactDevOverlay", "ErrorBoundaryHandler", "LoadingBoundary", "RedirectBoundary",
  "HTTPAccessFallbackBoundary", "DevRootHTTPAccessFallbackBoundary", "ScrollAndFocusHandler",
  "RedirectErrorBoundary", "NotFoundBoundary", "NotFoundErrorBoundary", "RootErrorBoundary",
  "ReactStrictMode", "StrictMode", "ClientPageRoot", "ServerRoot", "AppDevOverlay",
  "AppDevOverlayErrorBoundary",
  "ScrollAndMaybeFocusHandler", "InnerScrollAndFocusHandlerOld", "DevLayout",
])

export const isFrameworkInspectorName = (name: string) =>
  FRAMEWORK_EXACT.has(name) ||
  name.startsWith("Segment") ||
  name.startsWith("__next") ||
  name.startsWith("Next") ||
  /Boundary$/i.test(name) ||
  /Fallback/i.test(name) ||
  /Router$/i.test(name) ||
  (/Provider$/i.test(name) && name.includes("Next"))

const getHostTagName = (fiber: ReactFiber | null): string | null => {
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
  for (let current = fiber; current; current = current.return ?? null) {
    if (isTransparentClimbFiber(current)) continue
    if (isCompositeComponentFiber(current)) {
      const name = readFiberComponentName(current)
      if (name && !isFrameworkInspectorName(name)) return { name, fiber: current }
    }
    if (current._debugInfo?.length) {
      for (let index = current._debugInfo.length - 1; index >= 0; index -= 1) {
        const info = current._debugInfo[index]
        if (info.name && !isFrameworkInspectorName(info.name)) return { name: info.name, fiber: current, debugInfo: info }
      }
    }
  }
  return null
}

// A route's page is the last content component; layouts own the app shell.
const isPopoverLayout = (name: string) => name === "Layout" || /Layout$/.test(name)
const isPopoverPage = (name: string) => name === "Page" || /Page$/.test(name)

/** Immediate ancestry within the route, without walking into the app shell. */
export const getPopoverComponentAncestors = (fiber: ReactFiber): NamedTarget[] => {
  const ancestors: NamedTarget[] = []
  const seenFibers = new Set<ReactFiber>()
  const seenInfo = new Set<ServerDebugInfo>()
  for (let current: ReactFiber | null = fiber; current && !seenFibers.has(current); current = current.return ?? current._debugOwner ?? null) {
    seenFibers.add(current)
    const rawName = isCompositeComponentFiber(current) ? readFiberComponentName(current) : null
    if (rawName && isPopoverLayout(rawName)) break
    const name = !isTransparentClimbFiber(current) ? rawName : null
    const component = name && !isFrameworkInspectorName(name) ? { name, fiber: current } : null
    if (component) ancestors.push(component)
    for (const info of [...(current._debugInfo ?? [])].reverse()) {
      if (seenInfo.has(info)) continue
      seenInfo.add(info)
      if (info.name && isPopoverLayout(info.name)) return ancestors
      if (!info.name || isFrameworkInspectorName(info.name)) continue
      const existing = ancestors.find(ancestor => ancestor.fiber === current && ancestor.name === info.name)
      if (existing) existing.debugInfo = info
      else ancestors.push({ name: info.name, fiber: current, debugInfo: info })
      if (isPopoverPage(info.name)) return ancestors
    }
    if (name && isPopoverPage(name)) break
  }
  return ancestors
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

const isMotionFactoryName = (name: string) => name.startsWith("motion.")

/** Turbopack/webpack vendor chunks and node_modules paths — not project sources. */
export const isVendorModulePath = (filePath: string) => {
  const file = filePath.replace(/\\/g, "/")
  return /node_modules|(?:^|[/_])(?:@|%40)[a-z0-9.-]+[_/]|next[_-]dist/i.test(file)
}

const readStackText = (fiber: ReactFiber) => {
  const stack = fiber._debugStack instanceof Error ? fiber._debugStack.stack : fiber._debugStack
  return typeof stack === "string" ? stack : ""
}

const firstNonWrapperChild = (fiber: ReactFiber): ReactFiber | null => {
  let child = fiber.child ?? null
  while (child && isWrapperFiber(child)) child = child.child ?? null
  return child
}

const hostStackBuiltByVendor = (host: ReactFiber) => {
  const stack = readStackText(host)
  if (!stack) return false
  for (const line of stack.split("\n")) {
    const match = line.match(/at\s+(?:Object\.)?(\S+)\s+\((.+)\)$/)
    if (!match) continue
    if (/^(?:exports\.)?(?:createElement|jsxDEV|jsx|jsxs)$/.test(match[1]) || /react[_-]stack/.test(match[1])) continue
    const file = match[2].replace(/:\d+:\d+$/, "")
    return isVendorModulePath(file)
  }
  return false
}

const isVendorHostBuilder = (fiber: ReactFiber) => {
  if (!isCompositeComponentFiber(fiber)) return false
  const name = readFiberComponentName(fiber)
  if (!name) return false
  const child = firstNonWrapperChild(fiber)
  if (!child || !isHostComponentFiber(child)) return false
  // React 18 has no creation stacks for hosts made by vendor createElement calls.
  if (!readStackText(child) && !child._debugSource && fiber._debugOwner &&
    readFiberComponentName(fiber._debugOwner) === name) return true
  return hostStackBuiltByVendor(child)
}

const isTransparentClimbFiber = (fiber: ReactFiber) => {
  if (!isCompositeComponentFiber(fiber)) return false
  const name = readFiberComponentName(fiber)
  if (name && isMotionFactoryName(name)) return true
  if (!name || !isVendorHostBuilder(fiber)) return false

  let current = fiber.return ?? null
  while (current) {
    if (isWrapperFiber(current)) {
      current = current.return ?? null
      continue
    }
    const currentName = readFiberComponentName(current)
    if (currentName && isMotionFactoryName(currentName)) {
      current = current.return ?? null
      continue
    }
    if (isHostComponentFiber(current)) return false
    if (isCompositeComponentFiber(current)) {
      if (
        currentName &&
        currentName === name &&
        !isFrameworkInspectorName(currentName) &&
        !isVendorHostBuilder(current)
      ) {
        return true
      }
      return false
    }
    current = current.return ?? null
  }
  return false
}

const skipClimbAncestor = (fiber: ReactFiber) =>
  isWrapperFiber(fiber) || isTransparentClimbFiber(fiber)

const getOwningCompositeFiber = (hostFiber: ReactFiber): ReactFiber | null => {
  let current = hostFiber.return ?? null

  while (current) {
    if (skipClimbAncestor(current)) {
      current = current.return ?? null
      continue
    }

    if (isCompositeComponentFiber(current)) {
      const name = readFiberComponentName(current)
      if (name && !isFrameworkInspectorName(name)) return current
      current = current.return ?? null
      continue
    }

    if (isHostComponentFiber(current)) return null

    current = current.return ?? null
  }

  return null
}

const isHostNestedUnderHost = (hostFiber: ReactFiber): boolean => {
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

type ClimbOwner = { name: string; fiber: ReactFiber; debugInfo?: ServerDebugInfo; isSelfDebugOwner: boolean }

const readDebugInfoOwner = (fiber: ReactFiber): ClimbOwner | null => {
  if (!fiber._debugInfo?.length) return null
  for (let index = fiber._debugInfo.length - 1; index >= 0; index -= 1) {
    const info = fiber._debugInfo[index]
    if (info.name && !isFrameworkInspectorName(info.name)) {
      return { name: info.name, fiber, debugInfo: info, isSelfDebugOwner: true }
    }
  }
  return null
}

const isNestedDebugInfoHost = (hostFiber: ReactFiber): boolean => {
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

const getLabelOwner = (hostFiber: ReactFiber): ClimbOwner | null => {
  const fromDebug = readDebugInfoOwner(hostFiber)
  if (fromDebug) {
    if (isNestedDebugInfoHost(hostFiber)) return null
    return fromDebug
  }

  const composite = getOwningCompositeFiber(hostFiber)
  if (!composite) return null
  const name = readFiberComponentName(composite)
  if (!name || isFrameworkInspectorName(name)) return null
  return { name, fiber: composite, isSelfDebugOwner: false }
}

export const getDirectClimbOwner = (hostFiber: ReactFiber): ClimbOwner | null => {
  const strict = getLabelOwner(hostFiber)
  if (strict) return strict

  if (isHostNestedUnderHost(hostFiber)) return null

  let owner: ReactFiber | null = hostFiber._debugOwner ?? null
  let hops = 0
  while (owner && hops < 12) {
    hops += 1
    const name = readFiberComponentName(owner)
    if (name && (isMotionFactoryName(name) || isTransparentClimbFiber(owner))) {
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

const getOwningCompositeName = (hostFiber: ReactFiber): string | null => {
  return getLabelOwner(hostFiber)?.name ?? null
}

export const isOwnerAncestorOf = (child: ReactFiber, parent: ReactFiber): boolean => {
  for (let current = child._debugOwner ?? null, hops = 0; current && hops < 32; hops += 1, current = current._debugOwner ?? null) {
    if (current === parent) return true
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

const getMotionFactoryName = (fiber: ReactFiber | null): string | null => {
  let current = fiber?.return ?? null
  while (current) {
    if (isWrapperFiber(current)) {
      current = current.return ?? null
      continue
    }
    if (isHostComponentFiber(current)) return null
    if (isCompositeComponentFiber(current)) {
      const name = readFiberComponentName(current)
      if (name && isMotionFactoryName(name)) return name
      return null
    }
    current = current.return ?? null
  }
  return null
}

export const getDomHoverName = (fiber: ReactFiber | null) =>
  getMotionFactoryName(fiber) ?? getHostTagName(fiber)

const getDebugSourceUntil = (start: ReactFiber | null, stop: ReactFiber | null): SourceLocation | null => {
  for (let current = start; current; current = current.return ?? null) {
    const source = current._debugSource
    if (source?.fileName && !isBundledOrExternalPath(source.fileName)) {
      return { filePath: source.fileName, line: source.lineNumber ?? 1, column: source.columnNumber ?? 1 }
    }
    if (stop && current === stop) break
  }
  return null
}

export const parseDebugStack = (stack: string) => {
  const frames: StackFrame[] = []
  const frameKeys = new Set<string>()
  const push = (frame: StackFrame) => {
    const key = `${frame.file}:${frame.line1}:${frame.column1}`
    if (frameKeys.has(key)) return
    frameKeys.add(key)
    frames.push(frame)
  }
  for (const line of stack.split("\n")) {
    if (/node_modules|react-dom|jsxDEV|fakeJSXCallSite|react-stack|react_stack_bottom_frame/.test(line)) {
      continue
    }
    let match = line.match(
      /((?:about:\/\/React\/Server\/)?(?:file|https?|webpack-internal|webpack):\/\/[^\s]+?):(\d+):(\d+)\)?$/
    )
    if (!match) {
      match = line.match(
        /(?:at\s+)?(.+?)\s+\((\/?(?:Users|home|var|opt|app|[A-Za-z]:)[^)\s]+?\.(?:tsx|ts|jsx|js|mdx)):(\d+):(\d+)\)/
      )
      if (match) {
        push({
          file: match[2],
          methodName: match[1].replace(/^\s*at\s+/, "") || "<unknown>",
          arguments: [],
          line1: Number(match[3]),
          column1: Number(match[4]),
          isServer: true,
        })
      }
      continue
    }
    push({
      file: match[1],
      methodName:
        line.slice(0, line.indexOf(match[0])).replace(/^\s*at\s+/, "").replace(/\s+\($/, "") ||
        "<unknown>",
      arguments: [],
      line1: Number(match[2]),
      column1: Number(match[3]),
      isServer: match[1].startsWith("about://React/Server/") || isReactServerStackFile(match[1]),
    })
  }
  return frames
}

const getStackFrames = (fiber: ReactFiber | null, stop?: ReactFiber | null) => {
  const frames: StackFrame[] = [], frameKeys = new Set<string>()
  for (let current = fiber; current; current = current.return ?? null) {
    const stack = current._debugStack instanceof Error ? current._debugStack.stack : current._debugStack
    if (typeof stack === "string") {
      for (const frame of parseDebugStack(stack)) {
        const frameKey = `${frame.file}:${frame.line1}:${frame.column1}`
        if (!frameKeys.has(frameKey)) { frameKeys.add(frameKey); frames.push(frame) }
      }
    }
    if (stop && current === stop) break
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

const stackStr = (v: unknown): v is string => typeof v === "string"
const stackNum = (v: unknown): v is number => typeof v === "number"
const stackFile = (r: Record<string, unknown>) =>
  (["fileName", "filename", "file", "source"] as const).map((k) => r[k]).find(stackStr) ?? null
const stackLine = (r: Record<string, unknown>) =>
  (["lineNumber", "line1", "line"] as const).map((k) => r[k]).find(stackNum) ?? null
const stackCol = (r: Record<string, unknown>, fallback = 1) =>
  (["columnNumber", "column1", "column"] as const).map((k) => r[k]).find(stackNum) ?? fallback
const stackServer = (file: string) =>
  file.startsWith("about://React/Server/") ||
  file.includes(".next/server")

const frameFromRecord = (record: Record<string, unknown>): StackFrame | null => {
  const file = stackFile(record)
  const line1 = stackLine(record)
  if (!file || line1 == null) return null
  return {
    file,
    methodName: stackStr(record.methodName)
      ? record.methodName
      : stackStr(record.name)
        ? record.name
        : "<unknown>",
    arguments: [],
    line1,
    column1: stackCol(record),
    isServer: stackServer(file) || isReactServerStackFile(file),
  }
}

const framesFromUnknownStack = (stack: unknown): StackFrame[] => {
  if (!stack) return []
  if (stackStr(stack)) return parseDebugStack(stack)
  if (stack instanceof Error && stackStr(stack.stack)) return parseDebugStack(stack.stack)
  if (!Array.isArray(stack)) return []
  const frames: StackFrame[] = []
  for (const entry of stack) {
    if (Array.isArray(entry) && entry.length >= 4 && stackStr(entry[1]) && stackNum(entry[2])) {
      frames.push({
        file: entry[1],
        methodName: stackStr(entry[0]) ? entry[0] : "<unknown>",
        arguments: [],
        line1: entry[2],
        column1: stackNum(entry[3]) ? entry[3] : 1,
        isServer: stackServer(entry[1]) || isReactServerStackFile(entry[1]),
      })
      continue
    }
    if (entry && typeof entry === "object") {
      const frame = frameFromRecord(entry as Record<string, unknown>)
      if (frame) frames.push(frame)
    }
  }
  return frames
}

const getDebugInfoFrames = (info: ServerDebugInfo) => {
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

type SourceMapData = { mappings: string; sourceRoot?: string; sources: string[] }
type SourceMapSection = { offset: { line: number; column: number }; map: SourceMapData }
export type SourceMap = SourceMapData & { sections?: SourceMapSection[] }
type OriginalFrameResult =
  | { status: "fulfilled"; value: { originalStackFrame: (Omit<StackFrame, "isServer"> & { ignored: boolean }) | null } }
  | { status: "rejected"; reason: string }

export const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

export const resolveFirstMappedFrame = async (
  frames: StackFrame[], projectRoot: string, sourceMapCache: Map<string, Promise<SourceMap>>, componentName?: string | null
) => {
  const mapped: NamedSourceFrame[] = []
  const ordered = componentName && frames.some((f) => f.methodName.includes(componentName))
    ? [...frames.filter((f) => f.methodName.includes(componentName)), ...frames.filter((f) => !f.methodName.includes(componentName))]
    : frames
  for (const frame of ordered) {
    try {
      const source = await resolveStackFrame(frame, projectRoot, sourceMapCache)
      if (!source) continue
      mapped.push({ methodName: frame.methodName, source })
      if (componentName && pickPreferredStackSource(mapped, componentName) === source && frame.methodName.includes(componentName)) return source
      if (!componentName) return source
    } catch { continue }
  }
  return pickPreferredStackSource(mapped, componentName)
}

export const sourceFromStackFrame = (frame: StackFrame, projectRoot: string): SourceLocation | null => {
  let file = frame.file
  if (!file) return null
  if (file.startsWith("about://React/Server/")) file = file.slice("about://React/Server/".length)
  if (isBundledOrExternalPath(file) || ((file.startsWith("http://") || file.startsWith("https://")) && (!projectRoot || !file.includes(projectRoot)))) {
    return null
  }
  const filePath = toAbsolutePath(file, projectRoot)
  if (isBundledOrExternalPath(filePath)) return null
  if (!isLikelySourceFile(filePath) && (!projectRoot || !filePath.startsWith(projectRoot))) return null
  return { filePath, line: frame.line1, column: frame.column1 }
}

export const preferredSourceFromFrames = (
  frames: StackFrame[],
  projectRoot: string,
  componentName?: string | null
): SourceLocation | null => {
  const mapped: NamedSourceFrame[] = []
  for (const frame of frames) {
    const source = sourceFromStackFrame(frame, projectRoot)
    if (source) mapped.push({ methodName: frame.methodName, source })
  }
  return pickPreferredStackSource(mapped, componentName)
}

const findNearestAuthorCallSiteSync = (fiber: ReactFiber, projectRoot: string): SourceLocation | null => {
  const seen = new Set<ReactFiber>(), queue: ReactFiber[] = []
  if (fiber._debugOwner) queue.push(fiber._debugOwner)
  let stackFallback: SourceLocation | null = null, debugInfoFallback: SourceLocation | null = null
  const rememberDebugInfo = (node: ReactFiber) => {
    if (debugInfoFallback || !node._debugInfo?.length) return
    for (let i = node._debugInfo.length - 1; i >= 0; i -= 1) {
      const pair = resolveDebugInfoPairSync(node._debugInfo[i]!, projectRoot)
      const candidate = pair.source ?? pair.renderedBy
      if (candidate) { debugInfoFallback = candidate; return }
    }
  }
  rememberDebugInfo(fiber)
  for (let hops = 0; queue.length > 0 && hops < 48; hops += 1) {
    const current = queue.shift()!
    if (seen.has(current)) continue
    seen.add(current)
    const fromDebug = sourceFromFiberDebugSource(current._debugSource, projectRoot)
    if (fromDebug) return fromDebug
    rememberDebugInfo(current)
    if (!stackFallback) stackFallback = preferredSourceFromFrames(getOwnStackFrames(current), projectRoot, null)
    if (current._debugOwner && !seen.has(current._debugOwner)) queue.push(current._debugOwner)
  }
  return stackFallback ?? debugInfoFallback
}

const mappedDebugInfoSource = async (
  node: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
) => {
  if (!node._debugInfo?.length) return null
  for (let i = node._debugInfo.length - 1; i >= 0; i -= 1) {
    const pair = await resolveDebugInfoPair(node._debugInfo[i]!, projectRoot, sourceMapCache)
    const candidate = pair.source ?? pair.renderedBy
    if (candidate && !isBundledOrExternalPath(candidate.filePath)) return candidate
  }
  return null
}

const findNearestAuthorCallSite = async (
  fiber: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
): Promise<SourceLocation | null> => {
  const sync = findNearestAuthorCallSiteSync(fiber, projectRoot)
  if (sync) return sync

  let owner: ReactFiber | null = fiber._debugOwner ?? fiber
  let hops = 0
  while (owner && hops < 16) {
    hops += 1
    const mapped = await resolveFirstMappedFrame(
      getOwnStackFrames(owner),
      projectRoot,
      sourceMapCache,
      null
    )
    if (mapped) return mapped
    const fromDebugInfo = await mappedDebugInfoSource(owner, projectRoot, sourceMapCache)
    if (fromDebugInfo) return fromDebugInfo
    owner = owner._debugOwner ?? null
  }
  return null
}

const absBoundedSource = (
  fiber: ReactFiber,
  target: NamedTarget | null,
  projectRoot: string
) => {
  const bounded = target ? getDebugSourceUntil(fiber, target.fiber) : null
  return bounded
    ? { ...bounded, filePath: toAbsolutePath(bounded.filePath, projectRoot) }
    : null
}

const definedSourceParts = (
  fiber: ReactFiber,
  projectRoot: string,
  hostDebug: SourceLocation | null
) => {
  const target = getNamedTarget(fiber)
  const componentName = target?.name ?? null
  const label = getComponentName(fiber)
  return {
    target,
    componentName,
    labelIsComponent: Boolean(componentName && label && label === componentName),
    fromHost: pickOpenSource(hostDebug, absBoundedSource(fiber, target, projectRoot)),
  }
}

const finishDefinedSource = (
  parts: ReturnType<typeof definedSourceParts>,
  fromComponentDef: SourceLocation | null,
  fromClickStack: SourceLocation | null
) => {
  const picked = pickDefinedSource({
    host: parts.fromHost,
    componentDefinition: fromComponentDef,
    labelIsComponent: parts.labelIsComponent,
  })
  if (picked) return picked
  if (parts.fromHost) return parts.fromHost
  return fromClickStack ?? fromComponentDef
}

const resolveUsageSourceSync = (
  fiber: ReactFiber,
  definition: SourceLocation | null,
  target: NamedTarget,
  projectRoot: string
) => {
  const accept = (candidate: SourceLocation | null) => {
    if (!candidate) return null
    if (definition && candidate.filePath === definition.filePath) return null
    return candidate
  }
  const debug = (node: ReactFiber | null) =>
    accept(sourceFromFiberDebugSource(node?._debugSource, projectRoot))
  const frame = (stackFrame: StackFrame) => sourceFromStackFrame(stackFrame, projectRoot)
  const component = target.fiber
  const fromComponent = sourceFromFiberDebugSource(component._debugSource, projectRoot)
  if (fromComponent) return fromComponent
  for (const stackFrame of getOwnStackFrames(component)) {
    const usage = frame(stackFrame)
    if (usage && !isBundledOrExternalPath(usage.filePath)) return usage
  }
  let owner: ReactFiber | null = component._debugOwner ?? fiber._debugOwner ?? null
  for (let hops = 0; owner && hops < 10; hops += 1, owner = owner._debugOwner ?? null) {
    const fromOwner = debug(owner)
    if (fromOwner) return fromOwner
    for (const stackFrame of getOwnStackFrames(owner)) {
      const usage = accept(frame(stackFrame))
      if (usage) return usage
    }
  }
  return null
}

export const getHostAuthorSource = (fiber: ReactFiber, projectRoot: string) => {
  const target = getNamedTarget(fiber)
  const fromHost = pickOpenSource(
    sourceFromFiberDebugSource(fiber._debugSource, projectRoot),
    absBoundedSource(fiber, target, projectRoot)
  )
  if (fromHost) return fromHost ?? findNearestAuthorCallSiteSync(fiber, projectRoot)
  const fromOwnStack = preferredSourceFromFrames(getOwnStackFrames(fiber), projectRoot, null)
  if (fromOwnStack) return fromOwnStack ?? findNearestAuthorCallSiteSync(fiber, projectRoot)
  return findNearestAuthorCallSiteSync(fiber, projectRoot)
}

export const getInstantDefinedSource = (fiber: ReactFiber, projectRoot: string) => {
  const parts = definedSourceParts(
    fiber,
    projectRoot,
    sourceFromFiberDebugSource(fiber._debugSource, projectRoot)
  )
  const map = (frames: StackFrame[], name?: string | null) =>
    preferredSourceFromFrames(frames, projectRoot, name)
  const fromComponentDef = parts.target
    ? map(getOwnStackFrames(parts.target.fiber), parts.componentName) ??
      map(getStackFrames(fiber, parts.target.fiber), parts.componentName) ??
      (parts.target.debugInfo
        ? map(getDebugInfoFrames(parts.target.debugInfo), parts.componentName)
        : null)
    : null
  return finishDefinedSource(parts, fromComponentDef, map(getOwnStackFrames(fiber), parts.componentName))
}

export const getInstantUsedSource = (fiber: ReactFiber, projectRoot: string) => {
  const target = getNamedTarget(fiber)
  if (!target) return null
  return resolveUsageSourceSync(
    fiber,
    getInstantDefinedSource(fiber, projectRoot),
    target,
    projectRoot
  )
}

export const decodeVlq = (segment: string) => {
  const values: number[] = []
  let index = 0
  while (index < segment.length) {
    let value = 0, shift = 0, hasMore = true
    while (hasMore && index < segment.length) {
      const digit = BASE64_CHARS.indexOf(segment[index++])
      if (digit < 0) return null
      hasMore = (digit & 32) !== 0
      value += (digit & 31) << shift
      shift += 5
    }
    const decodedValue = value >> 1
    values.push((value & 1) === 1 ? -decodedValue : decodedValue)
  }
  return values
}

const decodeOriginalPosition = (mappings: string, targetLine: number, targetColumn: number) => {
  const lines = mappings.split(";")
  let sourceIndex = 0, originalLine = 0, originalColumn = 0
  let match: { sourceIndex: number; originalLine: number; originalColumn: number } | null = null
  for (let lineIndex = 0; lineIndex <= targetLine; lineIndex += 1) {
    let generatedColumn = 0
    for (const segment of lines[lineIndex]?.split(",") ?? []) {
      const values = decodeVlq(segment)
      if (!values?.length) continue
      generatedColumn += values[0]
      if (values.length < 4) continue
      sourceIndex += values[1]; originalLine += values[2]; originalColumn += values[3]
      if (lineIndex === targetLine && generatedColumn <= targetColumn) match = { sourceIndex, originalLine, originalColumn }
    }
  }
  return match
}

const getSourceMapSection = (sections: SourceMapSection[], generatedLine: number, generatedColumn: number) => {
  for (let index = sections.length - 1; index >= 0; index -= 1) {
    const { offset } = sections[index]
    if (offset.line < generatedLine || (offset.line === generatedLine && offset.column <= generatedColumn)) return sections[index]
  }
  return null
}

const resolveNextStackFrame = async (frame: StackFrame, projectRoot: string) => {
  const response = await fetch("/__nextjs_original-stack-frames", {
    method: "POST",
    body: JSON.stringify({ frames: [{ file: frame.file, methodName: frame.methodName, arguments: frame.arguments, line1: frame.line1, column1: frame.column1 }], isServer: frame.isServer, isEdgeServer: false, isAppDirectory: true }),
  })
  if (!response.ok) return null
  const [result] = (await response.json()) as OriginalFrameResult[]
  const originalFrame = result?.status === "fulfilled" ? result.value.originalStackFrame : null
  if (!originalFrame?.file || isBundledOrExternalPath(originalFrame.file)) return null
  return { filePath: toAbsolutePath(originalFrame.file, projectRoot), line: originalFrame.line1 ?? 1, column: originalFrame.column1 ?? 1 }
}

const resolveFiberDebugSource = async (debugSource: FiberDebugSource | null | undefined, projectRoot: string, sourceMapCache: Map<string, Promise<SourceMap>>) => {
  if (!debugSource?.fileName) return null
  const direct = sourceFromFiberDebugSource(debugSource, projectRoot)
  if (direct) return direct
  const file = debugSource.fileName
  if (!isBundledOrExternalPath(file)) return null
  const isServer = /\/server\/|\.next\/server|\/ssr\/|about:\/\/React\/Server\//.test(file) || !(file.startsWith("http://") || file.startsWith("https://"))
  try {
    return await resolveStackFrame({ file, methodName: "<unknown>", arguments: [], line1: debugSource.lineNumber ?? 1, column1: debugSource.columnNumber ?? 1, isServer }, projectRoot, sourceMapCache)
  } catch { return null }
}

const resolveStackFrame = async (frame: StackFrame, projectRoot: string, sourceMapCache: Map<string, Promise<SourceMap>>) => {
  const direct = sourceFromStackFrame(frame, projectRoot)
  if (direct) return direct
  if (frame.isServer || frame.file.startsWith("webpack-internal:") || frame.file.startsWith("webpack://")) {
    return resolveNextStackFrame(frame, projectRoot)
  }
  const sourceMapUrl = new URL(frame.file)
  sourceMapUrl.pathname = `${sourceMapUrl.pathname}.map`
  let sourceMapPromise = sourceMapCache.get(sourceMapUrl.href)
  if (!sourceMapPromise) {
    sourceMapPromise = fetch(sourceMapUrl.href).then(async (response) => {
      if (!response.ok) throw new Error("Source map unavailable")
      return (await response.json()) as SourceMap
    })
    sourceMapCache.set(sourceMapUrl.href, sourceMapPromise)
  }
  const sourceMap = await sourceMapPromise
  const generatedLine = Math.max(0, frame.line1 - 1), generatedColumn = Math.max(0, frame.column1 - 1)
  const section = sourceMap.sections ? getSourceMapSection(sourceMap.sections, generatedLine, generatedColumn) : null
  const map = section?.map ?? sourceMap
  const relativeLine = generatedLine - (section?.offset.line ?? 0)
  const relativeColumn = generatedColumn - (relativeLine === 0 ? (section?.offset.column ?? 0) : 0)
  const position = decodeOriginalPosition(map.mappings, relativeLine, relativeColumn)
  if (!position) return null
  const source = map.sources[position.sourceIndex]
  if (!source || isBundledOrExternalPath(source)) return null
  const filePath = resolveSourceMapSourcePath({ source, sourceRoot: map.sourceRoot, sourceMapUrl, projectRoot })
  if (isBundledOrExternalPath(filePath)) return null
  return { filePath, line: position.originalLine + 1, column: position.originalColumn + 1 }
}

export const resolveHostAuthorSource = async (
  fiber: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
) => {
  const target = getNamedTarget(fiber)
  const hostDebug = await resolveFiberDebugSource(fiber._debugSource, projectRoot, sourceMapCache)
  const fromHost = pickOpenSource(hostDebug, absBoundedSource(fiber, target, projectRoot))
  if (fromHost) return fromHost ?? findNearestAuthorCallSiteSync(fiber, projectRoot)
  if (target) {
    let current: ReactFiber | null = fiber
    for (let hops = 0; current && hops < 24; hops += 1, current = current.return ?? null) {
      const remapped = await resolveFiberDebugSource(current._debugSource, projectRoot, sourceMapCache)
      if (remapped) return remapped
      if (current === target.fiber) break
    }
  }
  const fromOwnStack = await resolveFirstMappedFrame(
    getOwnStackFrames(fiber),
    projectRoot,
    sourceMapCache,
    null
  )
  if (fromOwnStack) return fromOwnStack ?? findNearestAuthorCallSiteSync(fiber, projectRoot)
  return findNearestAuthorCallSite(fiber, projectRoot, sourceMapCache)
}

export const resolveSource = async (
  fiber: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
) => {
  const parts = definedSourceParts(
    fiber,
    projectRoot,
    await resolveFiberDebugSource(fiber._debugSource, projectRoot, sourceMapCache)
  )
  const map = (frames: StackFrame[], name?: string | null) =>
    resolveFirstMappedFrame(frames, projectRoot, sourceMapCache, name)
  const fromComponentDef = parts.target
    ? (await map(getOwnStackFrames(parts.target.fiber), parts.componentName)) ??
      (await map(getStackFrames(fiber, parts.target.fiber), parts.componentName)) ??
      (parts.target.debugInfo
        ? await map(getDebugInfoFrames(parts.target.debugInfo), parts.componentName)
        : null)
    : null
  return finishDefinedSource(
    parts,
    fromComponentDef,
    await map(getOwnStackFrames(fiber), parts.componentName)
  )
}

export const resolveInstanceSource = async (
  fiber: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
) => {
  const definition = await resolveSource(fiber, projectRoot, sourceMapCache)
  const target = getNamedTarget(fiber)
  if (!target) return null
  const accept = (candidate: SourceLocation | null) => {
    if (!candidate) return null
    if (definition && candidate.filePath === definition.filePath) return null
    return candidate
  }
  const debug = async (node: ReactFiber | null) =>
    accept(
      node?._debugSource
        ? await resolveFiberDebugSource(node._debugSource, projectRoot, sourceMapCache)
        : null
    )
  const component = target.fiber
  const fromComponent = component._debugSource
    ? await resolveFiberDebugSource(component._debugSource, projectRoot, sourceMapCache)
    : null
  if (fromComponent) return fromComponent
  for (const stackFrame of getOwnStackFrames(component)) {
    try {
      const usage = await resolveStackFrame(stackFrame, projectRoot, sourceMapCache)
      if (usage && !isBundledOrExternalPath(usage.filePath)) return usage
    } catch {
      continue
    }
  }
  let owner: ReactFiber | null = component._debugOwner ?? fiber._debugOwner ?? null
  for (let hops = 0; owner && hops < 10; hops += 1, owner = owner._debugOwner ?? null) {
    const fromOwner = await debug(owner)
    if (fromOwner) return fromOwner
    for (const stackFrame of getOwnStackFrames(owner)) {
      try {
        const usage = accept(await resolveStackFrame(stackFrame, projectRoot, sourceMapCache))
        if (usage) return usage
      } catch {
        continue
      }
    }
  }
  return null
}

export const resolveNearestAncestorSource = async (element: Element, projectRoot: string, sourceMapCache: Map<string, Promise<SourceMap>>) => {
  for (let current = element.parentElement, hops = 0; current && hops < 24; hops += 1, current = current.parentElement) {
    if (isInspectorChrome(current)) continue
    const fiber = getFiber(current)
    if (!fiber) continue
    const source = (await resolveHostAuthorSource(fiber, projectRoot, sourceMapCache)) ?? getHostAuthorSource(fiber, projectRoot)
    if (source && !isBundledOrExternalPath(source.filePath)) return { source, element: current }
  }
  return null
}

export const openInEditor = (source: SourceLocation, ide: InspectorIde) => {
  if (isFilesystemAbsolutePath(source.filePath)) {
    window.location.href = INSPECTOR_IDES[ide].url(source.filePath, source.line, source.column)
    return
  }
  void (async () => {
    const next = document.getElementById("__next") !== null || Array.from(document.scripts).some(script => script.src.includes("/_next/"))
    const params = new URLSearchParams({ file: source.filePath, [next ? "line1" : "line"]: String(source.line), [next ? "column1" : "column"]: String(source.column) })
    try {
      const response = await fetch(`${next ? "/__nextjs_launch-editor" : "/__open-in-editor"}?${params}`)
      if (response.ok) return
    } catch { /* Fall back to the configured editor URL. */ }
    window.location.href = INSPECTOR_IDES[ide].url(source.filePath, source.line, source.column)
  })()
}

export const resolveDebugInfoPairSync = (info: ServerDebugInfo, projectRoot: string) => ({
  source: preferredSourceFromFrames(getDebugInfoFrames(info), projectRoot, info.name),
  renderedBy: info.owner
    ? preferredSourceFromFrames(getDebugInfoFrames(info.owner), projectRoot, info.owner.name)
    : null,
})

export const resolveDebugInfoPair = async (
  info: ServerDebugInfo,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
) => {
  const sync = resolveDebugInfoPairSync(info, projectRoot)
  return {
    source: sync.source ?? (await resolveFirstMappedFrame(getDebugInfoFrames(info), projectRoot, sourceMapCache, info.name)),
    renderedBy: sync.renderedBy ?? (info.owner
      ? await resolveFirstMappedFrame(getDebugInfoFrames(info.owner), projectRoot, sourceMapCache, info.owner.name)
      : null),
  }
}

const CSS_SKIP = new Set(["", "normal", "none", "auto", "0px", "rgba(0, 0, 0, 0)"])
const CSS_PROPS = [
  "display", "color", "background-color", "font-size", "font-weight",
  "line-height", "padding", "border-radius", "gap",
]

const getCssDeclarations = (element: Element) => {
  const computed = window.getComputedStyle(element)
  const pick = (prop: string) => computed.getPropertyValue(prop).trim()
  const entries: { prop: string; value: string }[] = []
  for (const prop of CSS_PROPS) {
    const value = pick(prop)
    if (prop === "font-weight" && value === "400") continue
    if (!CSS_SKIP.has(value)) entries.push({ prop, value })
  }
  return { tag: element.tagName.toLowerCase(), entries }
}

const cssSpan = (text: string, color?: string) => {
  const span = document.createElement("span")
  span.textContent = text
  if (color) span.style.color = color
  return span
}

const createCodeSurface = () => {
  const wrap = markInspectNode(document.createElement("div"), "data-dev-inspector-code")
  const pre = document.createElement("pre")
  wrap.appendChild(pre)
  return { wrap, pre }
}

const classNameFromProps = (props: ReactFiber["memoizedProps"]) => {
  if (!props) return ""
  const raw = props.className ?? props.class
  if (typeof raw === "string") return raw.trim()
  if (Array.isArray(raw)) {
    return raw
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(" ")
      .trim()
  }
  return ""
}

const getElementClassName = (element: Element) => {
  let fiber: ReactFiber | null = getFiber(element)
  for (let depth = 0; fiber && depth < 12; depth += 1) {
    if (fiber.stateNode === element) {
      const fromProps = classNameFromProps(fiber.memoizedProps)
      if (fromProps) return fromProps
      break
    }
    fiber = fiber.return ?? null
  }
  if (typeof (element as HTMLElement).className === "string") {
    return (element as HTMLElement).className.trim()
  }
  return (element.getAttribute("class") ?? "").trim()
}

const isPreferredInspectHost = (element: Element) => {
  const tag = element.tagName.toLowerCase()
  if (tag === "button" || tag === "a") return true
  const role = element.getAttribute("role")
  if (role === "button" || role === "link" || role === "menuitem") return true
  const slot = element.getAttribute("data-slot") ?? ""
  return slot.includes("trigger") || slot.includes("button") || slot.endsWith("-link")
}

const isNestedMediaHit = (element: Element) => {
  const tag = element.tagName.toLowerCase()
  if (tag === "svg" || tag === "path" || tag === "img" || tag === "picture" || tag === "canvas" || tag === "video") {
    return true
  }
  return element.getAttribute("aria-hidden") === "true" || element.hasAttribute("data-icon")
}

export const resolveInspectElement = (hit: Element): Element => {
  if (isNestedMediaHit(hit) || !isPreferredInspectHost(hit)) {
    let current: Element | null = hit.parentElement
    while (current && current !== document.body && current !== document.documentElement) {
      if (getFiber(current) && isPreferredInspectHost(current)) return current
      current = current.parentElement
    }
  }
  if (getElementClassName(hit) && getFiber(hit)) return hit
  let current: Element | null = hit.parentElement
  while (current && current !== document.body && current !== document.documentElement) {
    if (getFiber(current) && getElementClassName(current)) return current
    current = current.parentElement
  }
  return hit
}

export const isPointInRect = (
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
) =>
  clientX >= rect.left &&
  clientX <= rect.left + rect.width &&
  clientY >= rect.top &&
  clientY <= rect.top + rect.height

const createCssBlock = (element: Element) => {
  const { tag, entries } = getCssDeclarations(element)
  const { wrap, pre } = createCodeSurface()
  pre.append(cssSpan(tag, "#7ee787"), cssSpan(" {\n", "#8b949e"))
  for (const { prop, value } of entries) {
    pre.append(
      cssSpan(`  ${prop}`, "#79c0ff"),
      cssSpan(": ", "#8b949e"),
      cssSpan(value, "#c9d1d9"),
      cssSpan(";\n", "#8b949e")
    )
  }
  pre.append(cssSpan("}", "#8b949e"))
  return wrap
}

const createTailwindBlock = (element: Element) => {
  const { wrap, pre } = createCodeSurface()
  const classes = getElementClassName(element)
  const tag = element.tagName.toLowerCase()
  pre.append(
    cssSpan(`<${tag} `, "#8b949e"),
    cssSpan("className", "#79c0ff"),
    cssSpan("=", "#8b949e"),
    cssSpan('"', "#a5d6ff"),
    cssSpan(classes || "/* no className */", classes ? "#c9d1d9" : "#8b949e"),
    cssSpan('"', "#a5d6ff"),
    cssSpan(" />", "#8b949e")
  )
  return wrap
}

export const createStylesSection = (element: Element, onLayout: () => void) => {
  const root = markInspectNode(document.createElement("div"), "data-dev-inspector-styles")
  const tabs = markInspectNode(document.createElement("div"), "data-dev-inspector-style-tabs")
  const body = document.createElement("div")
  let mode: "tailwind" | "css" = "tailwind"
  const mkTab = (next: typeof mode, label: string) => {
    const btn = markInspectNode(document.createElement("button"), "data-dev-inspector-style-tab")
    btn.type = "button"
    btn.textContent = label
    btn.onclick = (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (mode === next) return
      mode = next
      paint()
    }
    return btn
  }
  const twTab = mkTab("tailwind", "Tailwind")
  const cssTab = mkTab("css", "CSS")
  tabs.append(twTab, cssTab)
  const paint = () => {
    paintStyleTab(twTab, mode === "tailwind")
    paintStyleTab(cssTab, mode === "css")
    body.replaceChildren(mode === "tailwind" ? createTailwindBlock(element) : createCssBlock(element))
    onLayout()
  }
  root.append(tabs, body)
  paint()
  return root
}

export { applyOverlayPaint as applyOverlayStyles } from "../styles/styles.ts"
