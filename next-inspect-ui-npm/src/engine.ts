import {
  getOverlayPaint,
  INSPECTOR_IDES,
  toAbsolutePath,
  type InspectorIde,
  type InspectorSettings,
} from "./lib.ts"

const getElementFiber = <T = unknown>(element: Element): T | null => {
  const fiberKey = Object.keys(element).find((key) =>
    key.startsWith("__reactFiber$")
  )

  return fiberKey
    ? ((element as unknown as Record<string, T>)[fiberKey] ?? null)
    : null
}

export const isInspectorChrome = (element: Element) =>
  Boolean(
    element.closest(
      "[data-dev-inspector-overlay], [data-dev-inspector-tooltip], [data-dev-inspector-log], [data-dev-inspector-debug-toggle]"
    )
  )

/** Next/Suspense filler, scripts, and display:none hosts — skip for ] descent. */
const isSkippedNavHost = (element: Element) => {
  const tag = element.tagName.toLowerCase()
  if (
    tag === "script" ||
    tag === "style" ||
    tag === "template" ||
    tag === "link" ||
    tag === "meta" ||
    tag === "noscript"
  ) {
    return true
  }

  if (!(element instanceof HTMLElement)) return false
  if (element.hidden) return true
  if (element.getAttribute("aria-hidden") === "true") return true

  // Inline styles only (avoid layout reads during hotkey spam).
  const { display, visibility } = element.style
  if (display === "none" || visibility === "hidden") return true

  return false
}

const isInspectable = (element: Element) =>
  !isInspectorChrome(element) &&
  !isSkippedNavHost(element) &&
  getElementFiber(element) !== null

export const findParentInspectable = (element: Element): Element | null => {
  let current = element.parentElement

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    if (isInspectable(current)) return current
    current = current.parentElement
  }

  return null
}

export const findChildInspectable = (element: Element): Element | null => {
  for (const child of element.children) {
    if (isInspectorChrome(child) || isSkippedNavHost(child)) continue
    if (getElementFiber(child) !== null) return child
  }

  for (const child of element.children) {
    if (isInspectorChrome(child) || isSkippedNavHost(child)) continue
    const nested = findChildInspectable(child)
    if (nested) return nested
  }

  // Hidden wrappers may still house the real page host (Suspense / RSC shells).
  for (const child of element.children) {
    if (isInspectorChrome(child)) continue
    if (!isSkippedNavHost(child)) continue
    const nested = findChildInspectable(child)
    if (nested) return nested
  }

  return null
}

/**
 * BFS child search with an accept predicate (e.g. reject hosts that resolve
 * back to `from` after inspect remapping).
 */
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

export const findSiblingInspectable = (
  element: Element,
  direction: "prev" | "next"
): Element | null => {
  let current =
    direction === "prev"
      ? element.previousElementSibling
      : element.nextElementSibling

  while (current) {
    if (isInspectable(current)) return current
    current =
      direction === "prev"
        ? current.previousElementSibling
        : current.nextElementSibling
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


export type SourceLocation = {
  filePath: string;
  line: number;
  column: number;
};

type FiberDebugSource = {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
};

/**
 * Compiled / vendor paths — never show these in the tooltip. Prefer remapping
 * via source maps / `__nextjs_original-stack-frames` instead.
 */
export const isBundledOrExternalPath = (filePath: string) => {
  const file = filePath.replace(/\\/g, "/");
  return (
    file.includes("/node_modules/") ||
    file.includes("node_modules/") ||
    file.includes("/.next/") ||
    file.startsWith(".next/") ||
    file.includes("/_next/") ||
    file.includes("webpack-internal:") ||
    file.includes("webpack://") ||
    file.includes("turbopack://") ||
    file.includes("about://React/")
  );
};

/** Absolute filesystem paths (not Vite/Next URL pathnames like `/src/App.tsx`). */
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

/**
 * Turn a sourcemap `sources[]` entry into a filesystem path.
 *
 * Vite emits basename-only sources (`App.tsx`) with the map living at
 * `/src/App.tsx.map`. Per the source-map spec those are relative to the map
 * URL directory — join with `projectRoot` alone would open `project/App.tsx`
 * instead of `project/src/App.tsx`.
 */
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
    withRoot.startsWith(projectRoot) ||
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

export const formatPageLabel = (
  source: SourceLocation,
  projectRoot: string,
) => {
  const relativePath = source.filePath.startsWith(projectRoot)
    ? source.filePath.slice(projectRoot.length + 1)
    : source.filePath;
  return `${relativePath}:${source.line}`;
};

const isLikelySourceFile = (filePath: string) =>
  /\.(tsx|ts|jsx|js|mdx)$/.test(filePath.split("?")[0] ?? "");

/** Accept `_debugSource` only when it already points at real project source. */
export const sourceFromFiberDebugSource = (
  debugSource: FiberDebugSource | null | undefined,
  projectRoot: string,
): SourceLocation | null => {
  if (!debugSource?.fileName || isBundledOrExternalPath(debugSource.fileName)) {
    return null;
  }
  return {
    filePath: toAbsolutePath(debugSource.fileName, projectRoot),
    line: debugSource.lineNumber ?? 1,
    column: debugSource.columnNumber ?? 1,
  };
};

/** Distinct usage site = different file from the definition (line-only ≠ used-in). */
export const isDistinctUsedSource = (
  usage: SourceLocation | null | undefined,
  definition: SourceLocation | null | undefined,
) => Boolean(usage && definition && usage.filePath !== definition.filePath);

/**
 * Stop the owner chain once a step answers "where was this used" in project
 * source. Further owners are the functions that *contain* that JSX
 * (`SectionCards` above `<CardHeader>`), not additional call sites.
 *
 * Same-file wrappers (Chip defined next to its caller) keep climbing — usage
 * and definition share a file, so this returns false.
 *
 * `host` covers the sync gap where the component definition frame is not
 * available yet: a usage file that differs from the hovered host's file is
 * still a real call-site answer (shadcn `card.tsx` host used from
 * `section-cards.tsx`).
 */
export const isClimbUsageBoundary = ({
  usage,
  definition,
  host,
}: {
  usage: SourceLocation | null | undefined;
  definition: SourceLocation | null | undefined;
  host?: SourceLocation | null | undefined;
}) => {
  if (!usage || isBundledOrExternalPath(usage.filePath)) return false;
  if (definition && usage.filePath !== definition.filePath) return true;
  if (host && usage.filePath !== host.filePath) return true;
  return false;
};

type NamedSourceFrame = {
  methodName: string;
  source: SourceLocation;
};

const frameMatchesComponent = (methodName: string, componentName: string) => {
  const method = methodName.trim();
  if (!method || method === "<unknown>") return false;
  return (
    method === componentName ||
    method.endsWith(`.${componentName}`) ||
    method.startsWith(`${componentName}.`)
  );
};

/**
 * Click-open must land on the host JSX / component frame — not a nested
 * helper that happens to appear first in `_debugStack` (e.g. `copyError`
 * at L662 instead of `TestCard` JSX at L671).
 */
const pickPreferredStackSource = (
  frames: NamedSourceFrame[],
  componentName: string | null | undefined,
): SourceLocation | null => {
  if (frames.length === 0) return null;
  if (componentName) {
    const named = frames.find((frame) =>
      frameMatchesComponent(frame.methodName, componentName),
    );
    if (named) return named.source;
  }
  return frames[0]?.source ?? null;
};

/** Host `_debugSource` (exact clicked JSX) always beats stack fallbacks. */
const pickOpenSource = (
  host: SourceLocation | null | undefined,
  stack: SourceLocation | null | undefined,
): SourceLocation | null => host ?? stack ?? null;

export type ClimbSourcePair = {
  source: SourceLocation | null
  definition: SourceLocation | null
}

/** Usage site first (⌥ / node tree); fall back to the definition frame. */
export const getClimbStepDisplaySource = (
  step: ClimbSourcePair,
): SourceLocation | null => step.source ?? step.definition

const pickDefinedSource = ({
  host,
  componentDefinition,
  labelIsComponent,
}: {
  host: SourceLocation | null | undefined;
  componentDefinition: SourceLocation | null | undefined;
  labelIsComponent: boolean;
}): SourceLocation | null =>
  labelIsComponent
    ? (componentDefinition ?? host ?? null)
    : (host ?? componentDefinition ?? null);

export const underStackTransform = (depth: number) =>
  `translate(${29 * depth}px, calc(100% * ${depth} + ${5 * depth}px))`



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

type NamedTarget = {
  name: string
  fiber: ReactFiber
  debugInfo?: ServerDebugInfo
}

type StackFrame = {
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
const isMotionFactoryName = (name: string) => name.startsWith("motion.")

const isTransparentClimbFiber = (fiber: ReactFiber) => {
  if (!isCompositeComponentFiber(fiber)) return false
  const name = readComponentTypeName(fiber.type)
  return !!name && isMotionFactoryName(name)
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

type ClimbOwner = {
  name: string
  fiber: ReactFiber
  debugInfo?: ServerDebugInfo

  isSelfDebugOwner: boolean
}

const readDebugInfoOwner = (fiber: ReactFiber): ClimbOwner | null => {
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

const getOwningCompositeName = (hostFiber: ReactFiber): string | null => {
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

const getMotionFactoryName = (fiber: ReactFiber | null): string | null => {
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

const getDebugSourceUntil = (
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

const parseDebugStack = (stack: string) => {
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

const getStackFrames = (fiber: ReactFiber | null, stop?: ReactFiber | null) => {
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

const framesFromUnknownStack = (stack: unknown): StackFrame[] => {
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



type SourceMapData = {
  mappings: string
  sourceRoot?: string
  sources: string[]
}

type SourceMapSection = {
  offset: {
    line: number
    column: number
  }
  map: SourceMapData
}

export type SourceMap = SourceMapData & {
  sections?: SourceMapSection[]
}

type OriginalFrameResult =
  | {
      status: "fulfilled"
      value: {
        originalStackFrame:
          | (Omit<StackFrame, "isServer"> & {
              ignored: boolean
            })
          | null
      }
    }
  | {
      status: "rejected"
      reason: string
    }

export const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

export const resolveFirstMappedFrame = async (
  frames: StackFrame[],
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>,
  componentName?: string | null
): Promise<SourceLocation | null> => {
  const mapped: NamedSourceFrame[] = []

  const ordered =
    componentName && frames.some((f) => f.methodName.includes(componentName))
      ? [
          ...frames.filter((f) => f.methodName.includes(componentName)),
          ...frames.filter((f) => !f.methodName.includes(componentName)),
        ]
      : frames

  for (const frame of ordered) {
    try {
      const source = await resolveStackFrame(frame, projectRoot, sourceMapCache)
      if (!source) continue
      mapped.push({ methodName: frame.methodName, source })

      if (
        componentName &&
        pickPreferredStackSource(mapped, componentName) === source &&
        frame.methodName.includes(componentName)
      ) {
        return source
      }

      if (!componentName) return source
    } catch {
      continue
    }
  }

  return pickPreferredStackSource(mapped, componentName)
}

export const sourceFromStackFrame = (
  frame: StackFrame,
  projectRoot: string
): SourceLocation | null => {
  let file = frame.file
  if (!file) return null
  if (file.startsWith("about://React/Server/")) {
    file = file.slice("about://React/Server/".length)
  }

  if (
    isBundledOrExternalPath(file) ||
    ((file.startsWith("http://") || file.startsWith("https://")) &&
      !file.includes(projectRoot))
  ) {
    return null
  }

  const filePath = toAbsolutePath(file, projectRoot)
  if (isBundledOrExternalPath(filePath)) return null
  if (!isLikelySourceFile(filePath) && !filePath.startsWith(projectRoot)) {
    return null
  }

  return {
    filePath,
    line: frame.line1,
    column: frame.column1,
  }
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

const findNearestAuthorCallSiteSync = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => {
  const seen = new Set<ReactFiber>()
  const queue: ReactFiber[] = []

  if (fiber._debugOwner) queue.push(fiber._debugOwner)

  let hops = 0
  let stackFallback: SourceLocation | null = null
  let debugInfoFallback: SourceLocation | null = null

  const rememberDebugInfo = (node: ReactFiber) => {
    if (debugInfoFallback || !node._debugInfo?.length) return
    for (let i = node._debugInfo.length - 1; i >= 0; i -= 1) {
      const pair = resolveDebugInfoPairSync(node._debugInfo[i]!, projectRoot)
      const candidate = pair.source ?? pair.renderedBy
      if (candidate) {
        debugInfoFallback = candidate
        return
      }
    }
  }

  rememberDebugInfo(fiber)
  while (queue.length > 0 && hops < 48) {
    hops += 1
    const current = queue.shift()!
    if (seen.has(current)) continue
    seen.add(current)

    const fromDebug = sourceFromFiberDebugSource(
      current._debugSource,
      projectRoot
    )
    if (fromDebug) return fromDebug

    rememberDebugInfo(current)

    if (!stackFallback) {
      const fromStack = preferredSourceFromFrames(
        getOwnStackFrames(current),
        projectRoot,
        null
      )
      if (fromStack) stackFallback = fromStack
    }

    if (current._debugOwner && !seen.has(current._debugOwner)) {
      queue.push(current._debugOwner)
    }
  }

  return stackFallback ?? debugInfoFallback
}

/** Map owner stacks when sync frames still point at bundled paths. */
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
    owner = owner._debugOwner ?? null
  }
  return null
}

export const getHostAuthorSource = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => {
  const fromFiber = sourceFromFiberDebugSource(fiber._debugSource, projectRoot)
  const target = getNamedTarget(fiber)
  const bounded = target ? getDebugSourceUntil(fiber, target.fiber) : null
  const fromBounded = bounded
    ? {
        ...bounded,
        filePath: toAbsolutePath(bounded.filePath, projectRoot),
      }
    : null
  const fromHost = pickOpenSource(fromFiber, fromBounded)
  if (fromHost) {
    return fromHost ?? findNearestAuthorCallSiteSync(fiber, projectRoot)
  }

  const fromOwnStack = preferredSourceFromFrames(
    getOwnStackFrames(fiber),
    projectRoot,
    null
  )
  if (fromOwnStack) {
    return fromOwnStack ?? findNearestAuthorCallSiteSync(fiber, projectRoot)
  }

  return findNearestAuthorCallSiteSync(fiber, projectRoot)
}

export const getInstantDefinedSource = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => {
  const fromFiber = sourceFromFiberDebugSource(fiber._debugSource, projectRoot)
  const target = getNamedTarget(fiber)
  const componentName = target?.name ?? null
  const label = getComponentName(fiber)
  const labelIsComponent = Boolean(
    componentName && label && label === componentName
  )

  const bounded = target
    ? getDebugSourceUntil(fiber, target.fiber)
    : null
  const fromBounded = bounded
    ? {
        ...bounded,
        filePath: toAbsolutePath(bounded.filePath, projectRoot),
      }
    : null
  const fromHost = pickOpenSource(fromFiber, fromBounded)

  const fromComponentDef = target
    ? preferredSourceFromFrames(
        getOwnStackFrames(target.fiber),
        projectRoot,
        componentName
      ) ??
      preferredSourceFromFrames(
        getStackFrames(fiber, target.fiber),
        projectRoot,
        componentName
      ) ??
      (target.debugInfo
        ? preferredSourceFromFrames(
            getDebugInfoFrames(target.debugInfo),
            projectRoot,
            componentName
          )
        : null)
    : null

  const picked = pickDefinedSource({
    host: fromHost,
    componentDefinition: fromComponentDef,
    labelIsComponent,
  })
  if (picked) return picked

  if (fromHost) return fromHost

  const fromClickStack = preferredSourceFromFrames(
    getOwnStackFrames(fiber),
    projectRoot,
    componentName
  )
  if (fromClickStack) return fromClickStack

  return fromComponentDef
}

export const getInstantUsedSource = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => {
  const definition = getInstantDefinedSource(fiber, projectRoot)
  const target = getNamedTarget(fiber)

  if (!target) return null

  const accept = (candidate: SourceLocation | null) => {
    if (!candidate) return null
    if (definition && candidate.filePath === definition.filePath) return null
    return candidate
  }

  const fromDebugSource = (node: ReactFiber | null) =>
    accept(sourceFromFiberDebugSource(node?._debugSource, projectRoot))

  const component = target.fiber

  const fromComponent = fromDebugSource(component)
  if (fromComponent) return fromComponent

  const ownFrames = getOwnStackFrames(component)
    .map((frame) => sourceFromStackFrame(frame, projectRoot))
    .filter((source): source is SourceLocation => source !== null)

  for (const loc of ownFrames) {
    if (!isBundledOrExternalPath(loc.filePath)) return loc
  }

  let owner: ReactFiber | null = component._debugOwner ?? fiber._debugOwner ?? null
  let hops = 0
  while (owner && hops < 10) {
    hops += 1
    const fromOwner = fromDebugSource(owner)
    if (fromOwner) return fromOwner

    for (const frame of getOwnStackFrames(owner)) {
      const usage = accept(sourceFromStackFrame(frame, projectRoot))
      if (usage) return usage
    }

    owner = owner._debugOwner ?? null
  }

  return null
}

export const decodeVlq = (segment: string) => {
  const values: number[] = []
  let index = 0

  while (index < segment.length) {
    let value = 0
    let shift = 0
    let hasMore = true

    while (hasMore && index < segment.length) {
      const digit = BASE64_CHARS.indexOf(segment[index])

      if (digit < 0) return null

      index += 1
      hasMore = (digit & 32) !== 0
      value += (digit & 31) << shift
      shift += 5
    }

    const isNegative = (value & 1) === 1
    const decodedValue = value >> 1
    values.push(isNegative ? -decodedValue : decodedValue)
  }

  return values
}

const decodeOriginalPosition = (
  mappings: string,
  targetLine: number,
  targetColumn: number
) => {
  const lines = mappings.split(";")
  let sourceIndex = 0
  let originalLine = 0
  let originalColumn = 0
  let match: {
    sourceIndex: number
    originalLine: number
    originalColumn: number
  } | null = null

  for (let lineIndex = 0; lineIndex <= targetLine; lineIndex += 1) {
    let generatedColumn = 0

    for (const segment of lines[lineIndex]?.split(",") ?? []) {
      const values = decodeVlq(segment)

      if (!values?.length) continue

      generatedColumn += values[0]

      if (values.length < 4) continue

      sourceIndex += values[1]
      originalLine += values[2]
      originalColumn += values[3]

      if (lineIndex === targetLine && generatedColumn <= targetColumn) {
        match = { sourceIndex, originalLine, originalColumn }
      }
    }
  }

  return match
}

const getSourceMapSection = (
  sections: SourceMapSection[],
  generatedLine: number,
  generatedColumn: number
) => {
  for (let index = sections.length - 1; index >= 0; index -= 1) {
    const { offset } = sections[index]

    if (
      offset.line < generatedLine ||
      (offset.line === generatedLine && offset.column <= generatedColumn)
    ) {
      return sections[index]
    }
  }

  return null
}

const resolveServerStackFrame = async (
  frame: StackFrame,
  projectRoot: string
): Promise<SourceLocation | null> => {
  const response = await fetch("/__nextjs_original-stack-frames", {
    method: "POST",
    body: JSON.stringify({
      frames: [
        {
          file: frame.file,
          methodName: frame.methodName,
          arguments: frame.arguments,
          line1: frame.line1,
          column1: frame.column1,
        },
      ],
      isServer: true,
      isEdgeServer: false,
      isAppDirectory: true,
    }),
  })

  if (!response.ok) return null

  const [result] = (await response.json()) as OriginalFrameResult[]
  const originalFrame =
    result?.status === "fulfilled" ? result.value.originalStackFrame : null

  if (
    !originalFrame?.file ||
    isBundledOrExternalPath(originalFrame.file)
  ) {
    return null
  }

  return {
    filePath: toAbsolutePath(originalFrame.file, projectRoot),
    line: originalFrame.line1 ?? 1,
    column: originalFrame.column1 ?? 1,
  }
}

const resolveFiberDebugSource = async (
  debugSource: FiberDebugSource | null | undefined,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
): Promise<SourceLocation | null> => {
  if (!debugSource?.fileName) return null

  const direct = sourceFromFiberDebugSource(debugSource, projectRoot)
  if (direct) return direct

  const file = debugSource.fileName
  if (!isBundledOrExternalPath(file)) return null

  const isServer =
    file.includes("/server/") ||
    file.includes(".next/server") ||
    file.includes("/ssr/") ||
    file.includes("about://React/Server/") ||
    !(file.startsWith("http://") || file.startsWith("https://"))

  try {
    return await resolveStackFrame(
      {
        file,
        methodName: "<unknown>",
        arguments: [],
        line1: debugSource.lineNumber ?? 1,
        column1: debugSource.columnNumber ?? 1,
        isServer,
      },
      projectRoot,
      sourceMapCache
    )
  } catch {
    return null
  }
}

const resolveStackFrame = async (
  frame: StackFrame,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
): Promise<SourceLocation | null> => {

  const direct = sourceFromStackFrame(frame, projectRoot)
  if (direct) return direct

  if (
    frame.isServer ||
    frame.file.startsWith("about://React/Server/") ||
    frame.file.includes(".next/server")
  ) {
    return resolveServerStackFrame(frame, projectRoot)
  }

  const chunkUrl = new URL(frame.file)
  const sourceMapUrl = new URL(chunkUrl)
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
  const generatedLine = Math.max(0, frame.line1 - 1)
  const generatedColumn = Math.max(0, frame.column1 - 1)
  const section = sourceMap.sections
    ? getSourceMapSection(sourceMap.sections, generatedLine, generatedColumn)
    : null
  const map = section?.map ?? sourceMap
  const relativeLine = generatedLine - (section?.offset.line ?? 0)
  const relativeColumn =
    generatedColumn - (relativeLine === 0 ? (section?.offset.column ?? 0) : 0)
  const position = decodeOriginalPosition(
    map.mappings,
    relativeLine,
    relativeColumn
  )

  if (!position) return null

  const source = map.sources[position.sourceIndex]

  if (!source || isBundledOrExternalPath(source)) return null

  const filePath = resolveSourceMapSourcePath({
    source,
    sourceRoot: map.sourceRoot,
    sourceMapUrl,
    projectRoot,
  })
  if (isBundledOrExternalPath(filePath)) return null

  return {
    filePath,
    line: position.originalLine + 1,
    column: position.originalColumn + 1,
  }
}

export const resolveHostAuthorSource = async (
  fiber: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
): Promise<SourceLocation | null> => {
  const target = getNamedTarget(fiber)
  const fromFiberDebug = await resolveFiberDebugSource(
    fiber._debugSource,
    projectRoot,
    sourceMapCache
  )
  const bounded = target ? getDebugSourceUntil(fiber, target.fiber) : null
  const fromBounded = bounded
    ? {
        ...bounded,
        filePath: toAbsolutePath(bounded.filePath, projectRoot),
      }
    : null
  const fromHost = pickOpenSource(fromFiberDebug, fromBounded)
  if (fromHost) {
    return fromHost ?? findNearestAuthorCallSiteSync(fiber, projectRoot)
  }

  if (target) {
    let current: ReactFiber | null = fiber
    let hops = 0
      while (current && hops < 24) {
      hops += 1
      const remapped = await resolveFiberDebugSource(
        current._debugSource,
        projectRoot,
        sourceMapCache
      )
      if (remapped) return remapped
      if (current === target.fiber) break
      current = current.return ?? null
    }
  }

  const fromOwnStack = await resolveFirstMappedFrame(
    getOwnStackFrames(fiber),
    projectRoot,
    sourceMapCache,
    null
  )
  if (fromOwnStack) {
    return fromOwnStack ?? findNearestAuthorCallSiteSync(fiber, projectRoot)
  }

  return findNearestAuthorCallSite(fiber, projectRoot, sourceMapCache)
}

export const resolveSource = async (
  fiber: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
): Promise<SourceLocation | null> => {
  const target = getNamedTarget(fiber)
  const componentName = target?.name ?? null
  const label = getComponentName(fiber)
  const labelIsComponent = Boolean(
    componentName && label && label === componentName
  )

  const fromFiberDebug = await resolveFiberDebugSource(
    fiber._debugSource,
    projectRoot,
    sourceMapCache
  )
  const bounded = target ? getDebugSourceUntil(fiber, target.fiber) : null
  const fromBounded = bounded
    ? {
        ...bounded,
        filePath: toAbsolutePath(bounded.filePath, projectRoot),
      }
    : null
  const fromHost = pickOpenSource(fromFiberDebug, fromBounded)

  let fromComponentDef: SourceLocation | null = null
  if (target) {
    fromComponentDef =
      (await resolveFirstMappedFrame(
        getOwnStackFrames(target.fiber),
        projectRoot,
        sourceMapCache,
        componentName
      )) ??
      (await resolveFirstMappedFrame(
        getStackFrames(fiber, target.fiber),
        projectRoot,
        sourceMapCache,
        componentName
      ))

    if (!fromComponentDef && target.debugInfo) {
      fromComponentDef = await resolveFirstMappedFrame(
        getDebugInfoFrames(target.debugInfo),
        projectRoot,
        sourceMapCache,
        componentName
      )
    }
  }

  const picked = pickDefinedSource({
    host: fromHost,
    componentDefinition: fromComponentDef,
    labelIsComponent,
  })
  if (picked) return picked

  if (fromHost) return fromHost

  const fromClickStack = await resolveFirstMappedFrame(
    getOwnStackFrames(fiber),
    projectRoot,
    sourceMapCache,
    componentName
  )
  if (fromClickStack) return fromClickStack

  return fromComponentDef
}

export const resolveInstanceSource = async (
  fiber: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
): Promise<SourceLocation | null> => {
  const definition = await resolveSource(fiber, projectRoot, sourceMapCache)
  const target = getNamedTarget(fiber)
  if (!target) return null

  const accept = (candidate: SourceLocation | null) => {
    if (!candidate) return null
    if (definition && candidate.filePath === definition.filePath) return null
    return candidate
  }

  const fromDebugSource = async (node: ReactFiber | null) => {
    if (!node?._debugSource) return null
    return accept(
      await resolveFiberDebugSource(
        node._debugSource,
        projectRoot,
        sourceMapCache
      )
    )
  }

  const component = target.fiber

  const fromComponent = await fromDebugSource(component)
  if (fromComponent) return fromComponent

  for (const frame of getOwnStackFrames(component)) {
    try {
      const usage = await resolveStackFrame(frame, projectRoot, sourceMapCache)
      if (usage && !isBundledOrExternalPath(usage.filePath)) return usage
    } catch {
      continue
    }
  }

  let owner: ReactFiber | null = component._debugOwner ?? fiber._debugOwner ?? null
  let hops = 0
  while (owner && hops < 10) {
    hops += 1
    const fromOwner = await fromDebugSource(owner)
    if (fromOwner) return fromOwner

    for (const frame of getOwnStackFrames(owner)) {
      try {
        const usage = accept(
          await resolveStackFrame(frame, projectRoot, sourceMapCache)
        )
        if (usage) return usage
      } catch {
        continue
      }
    }

    owner = owner._debugOwner ?? null
  }

  return null
}

export const resolveNearestAncestorSource = async (
  element: Element,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
): Promise<{ source: SourceLocation; element: Element } | null> => {
  let current = element.parentElement
  let hops = 0

  while (current && hops < 24) {
    hops += 1
    if (isInspectorChrome(current)) {
      current = current.parentElement
      continue
    }

    const fiber = getFiber(current)
    if (fiber) {
      const source =
        (await resolveHostAuthorSource(fiber, projectRoot, sourceMapCache)) ??
        getHostAuthorSource(fiber, projectRoot)
      if (source && !isBundledOrExternalPath(source.filePath)) {
        return { source, element: current }
      }
    }

    current = current.parentElement
  }

  return null
}

export const openInEditor = (source: SourceLocation, ide: InspectorIde) => {
  window.location.href = INSPECTOR_IDES[ide].url(
    source.filePath,
    source.line,
    source.column
  )
}

export const resolveDebugInfoPairSync = (
  info: ServerDebugInfo,
  projectRoot: string
): { renderedBy: SourceLocation | null; source: SourceLocation | null } => {
  const ownFrames = getDebugInfoFrames(info)
  const source = preferredSourceFromFrames(ownFrames, projectRoot, info.name)

  let renderedBy: SourceLocation | null = null
  if (info.owner) {
    const ownerFrames = getDebugInfoFrames(info.owner)
    renderedBy = preferredSourceFromFrames(
      ownerFrames,
      projectRoot,
      info.owner.name
    )
  }

  return { renderedBy, source }
}

export const resolveDebugInfoPair = async (
  info: ServerDebugInfo,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
): Promise<{ renderedBy: SourceLocation | null; source: SourceLocation | null }> => {
  const sync = resolveDebugInfoPairSync(info, projectRoot)
  const ownFrames = getDebugInfoFrames(info)
  const source =
    sync.source ??
    (await resolveFirstMappedFrame(
      ownFrames,
      projectRoot,
      sourceMapCache,
      info.name
    ))

  let renderedBy = sync.renderedBy
  if (!renderedBy && info.owner) {
    const ownerFrames = getDebugInfoFrames(info.owner)
    renderedBy = await resolveFirstMappedFrame(
      ownerFrames,
      projectRoot,
      sourceMapCache,
      info.owner.name
    )
  }

  return { renderedBy, source }
}



const CSS_SKIP = new Set(["", "normal", "none", "auto", "0px", "rgba(0, 0, 0, 0)"])

const COLOR_PROPS = new Set(["color", "background-color", "border-color", "outline-color"])

const resolveToRgbKey = (() => {
  let probe: HTMLDivElement | null = null
  return (value: string) => {
    if (!probe) {
      probe = document.createElement("div")
      probe.style.cssText =
        "position:absolute;left:-9999px;top:0;pointer-events:none;visibility:hidden;"
      document.documentElement.appendChild(probe)
    }
    probe.style.color = ""
    probe.style.color = value
    const raw = getComputedStyle(probe).color.trim()
    const match = raw.match(
      /rgba?\(\s*([\d.]+)\s*,?\s*([\d.]+)\s*,?\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/i
    )
    if (!match) return raw
    const r = Math.round(Number(match[1]))
    const g = Math.round(Number(match[2]))
    const b = Math.round(Number(match[3]))
    let a = 1
    if (match[4] != null) {
      a = match[4].endsWith("%")
        ? Number(match[4].slice(0, -1)) / 100
        : Number(match[4])
    }
    return `rgba(${r},${g},${b},${Number.isFinite(a) ? a : 1})`
  }
})()

const collectDocumentCssVarNames = () => {
  const names = new Set<string>()
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) continue
      for (const prop of Array.from(rule.style)) {
        if (prop.startsWith("--")) names.add(prop)
      }
    }
  }
  return names
}

const scoreCssColorVar = (name: string) => {
  let score = 0

  if (!name.startsWith("--color-")) score += 20
  if (name.includes("muted")) score += 4
  if (name.includes("foreground")) score += 2
  if (name.includes("background")) score += 2
  if (name.includes("border")) score += 1
  if (name.startsWith("--chart-")) score -= 8
  if (name.startsWith("--sidebar-")) score -= 6
  if (name.startsWith("--radius")) score -= 10
  return score
}

const toCssColorVar = (computedColor: string) => {
  const target = resolveToRgbKey(computedColor)
  if (!target || target === "rgba(0,0,0,0)") return null

  const rootStyles = getComputedStyle(document.documentElement)
  let best: { name: string; score: number } | null = null

  for (const name of collectDocumentCssVarNames()) {
    const raw = rootStyles.getPropertyValue(name).trim()
    if (!raw) continue

    if (
      !/^(#|rgb|hsl|oklch|oklab|lab|lch|color|var\()/i.test(raw) &&
      !/^[\d.]+\s+[\d.]+\s+[\d.]+/.test(raw)
    ) {
      continue
    }

    const resolved = resolveToRgbKey(`var(${name})`)
    if (resolved !== target) continue

    const score = scoreCssColorVar(name)
    if (!best || score > best.score) best = { name, score }
  }

  return best ? `var(${best.name})` : null
}

type CssDeclaration = {
  prop: string

  value: string

  swatch?: string
}

const getCssDeclarations = (element: Element) => {
  const computed = window.getComputedStyle(element)
  const pick = (prop: string) => computed.getPropertyValue(prop).trim()
  const entries: CssDeclaration[] = []
  const add = (prop: string, value = pick(prop)) => {
    if (CSS_SKIP.has(value)) return

    if (COLOR_PROPS.has(prop) && isColorValue(value)) {
      const token = toCssColorVar(value)
      if (token) {
        entries.push({ prop, value: token, swatch: value })
        return
      }
    }

    entries.push({ prop, value })
  }

  add("display")
  add("color")
  add("background-color")
  add("font-size")
  if (pick("font-weight") !== "400") add("font-weight")
  add("line-height")
  add("padding")
  add("border-radius")
  add("gap")

  return { tag: element.tagName.toLowerCase(), entries }
}

const isColorValue = (value: string) =>
  /^(#|rgb|hsl|oklch|oklab|lab|lch|color\(|var\(--)/i.test(value)

const cssSpan = (text: string, color?: string) => {
  const span = document.createElement("span")
  span.textContent = text
  if (color) span.style.color = color
  return span
}

const createCodeSurface = () => {
  const wrap = document.createElement("div")
  wrap.style.cssText =
    "margin-top:12px;overflow:auto;border-radius:8px;background:#0b0b0c;padding:10px 12px;"
  const pre = document.createElement("pre")
  pre.style.cssText =
    "margin:0;white-space:pre-wrap;word-break:break-word;font:11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;"
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
  return (
    slot.includes("trigger") ||
    slot.includes("button") ||
    slot.endsWith("-link")
  )
}

const isNestedMediaHit = (element: Element) => {
  const tag = element.tagName.toLowerCase()
  if (
    tag === "svg" ||
    tag === "path" ||
    tag === "img" ||
    tag === "picture" ||
    tag === "canvas" ||
    tag === "video"
  ) {
    return true
  }
  if (element.getAttribute("aria-hidden") === "true") return true
  if (element.hasAttribute("data-icon")) return true
  return false
}

export const resolveInspectElement = (hit: Element): Element => {
  if (isNestedMediaHit(hit) || !isPreferredInspectHost(hit)) {
    let current: Element | null = hit.parentElement
    while (
      current &&
      current !== document.body &&
      current !== document.documentElement
    ) {
      if (getFiber(current) && isPreferredInspectHost(current)) {
        return current
      }
      current = current.parentElement
    }
  }

  if (getElementClassName(hit) && getFiber(hit)) return hit

  let current: Element | null = hit.parentElement
  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
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
  wrap.style.marginTop = "0"

  pre.append(cssSpan(tag, "#7ee787"), cssSpan(" {\n", "#8b949e"))
  for (const { prop, value, swatch } of entries) {
    const colorForSwatch = swatch ?? (isColorValue(value) ? value : null)
    pre.append(cssSpan(`  ${prop}`, "#79c0ff"), cssSpan(": ", "#8b949e"))
    if (colorForSwatch) {
      const swatchEl = document.createElement("span")
      swatchEl.style.cssText = `display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;vertical-align:middle;border:1px solid rgb(255 255 255 / 25%);background:${colorForSwatch};`
      pre.append(swatchEl)
    }
    pre.append(
      cssSpan(value, colorForSwatch ? "#a5d6ff" : "#c9d1d9"),
      cssSpan(";\n", "#8b949e")
    )
  }
  pre.append(cssSpan("}", "#8b949e"))
  return wrap
}

const createTailwindBlock = (element: Element) => {
  const { wrap, pre } = createCodeSurface()
  wrap.style.marginTop = "0"
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
  const root = document.createElement("div")
  root.style.cssText =
    "margin-top:14px;display:flex;flex-direction:column;gap:12px;"

  const toggle = document.createElement("div")
  toggle.setAttribute("role", "tablist")
  toggle.setAttribute("aria-label", "Styles format")
  toggle.style.cssText =
    "position:relative;display:inline-flex;align-items:center;gap:1px;padding:2px;border-radius:6px;background:var(--muted,#27272a);width:fit-content;"

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
  const pill = document.createElement("div")
  pill.setAttribute("aria-hidden", "true")
  pill.style.cssText = prefersReducedMotion
    ? "position:absolute;top:2px;left:2px;height:calc(100% - 4px);border-radius:4px;background:var(--background,#18181b);pointer-events:none;"
    : "position:absolute;top:2px;left:2px;height:calc(100% - 4px);border-radius:4px;background:var(--background,#18181b);pointer-events:none;transition:transform 180ms ease,width 180ms ease;will-change:transform,width;"

  type StylesMode = "tailwind" | "css"

  const makeTab = (mode: StylesMode, text: string) => {
    const tab = document.createElement("button")
    tab.type = "button"
    tab.setAttribute("role", "tab")
    tab.dataset.mode = mode
    tab.textContent = text
    tab.style.cssText =
      "all:unset;position:relative;z-index:1;box-sizing:border-box;cursor:pointer;padding:2px 7px;border-radius:4px;font-size:10px;letter-spacing:0.04em;text-transform:uppercase;transition:color 180ms ease;"
    return tab
  }

  const twTab = makeTab("tailwind", "Tailwind")
  const cssTab = makeTab("css", "CSS")
  toggle.append(pill, twTab, cssTab)

  const body = document.createElement("div")
  body.style.cssText = prefersReducedMotion
    ? "min-width:0;overflow:hidden;"
    : "min-width:0;overflow:hidden;transition:width 220ms ease;"
  let mode: StylesMode = "tailwind"
  let bodyWidthReady = false

  const movePill = (tab: HTMLButtonElement, animate: boolean) => {
    const toggleBox = toggle.getBoundingClientRect()
    const tabBox = tab.getBoundingClientRect()
    const x = tabBox.left - toggleBox.left - 2
    const width = tabBox.width
    if (!animate || prefersReducedMotion) pill.style.transition = "none"
    pill.style.width = `${width}px`
    pill.style.transform = `translateX(${x}px)`
    if (!animate && !prefersReducedMotion) {
      void pill.offsetWidth
      pill.style.transition = "transform 180ms ease,width 180ms ease"
    }
  }

  const paint = (animate = true) => {
    const active = mode === "tailwind" ? twTab : cssTab
    const idle = mode === "tailwind" ? cssTab : twTab
    active.style.color = "var(--foreground,#e4e4e7)"
    idle.style.color = "var(--muted-foreground,#8b949e)"
    active.setAttribute("aria-selected", "true")
    idle.setAttribute("aria-selected", "false")
    movePill(active, animate)

    const block =
      mode === "tailwind" ? createTailwindBlock(element) : createCssBlock(element)
    block.style.marginTop = "0"
    body.replaceChildren(block)

    const nextWidth = Math.ceil(block.scrollWidth)
    if (!bodyWidthReady || prefersReducedMotion || !animate) {
      body.style.transition = "none"
      body.style.width = `${nextWidth}px`
      if (!prefersReducedMotion) {
        void body.offsetWidth
        body.style.transition = "width 220ms ease"
      }
      bodyWidthReady = true
    } else {
      body.style.width = `${nextWidth}px`
    }

    onLayout()
  }

  twTab.onclick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (mode === "tailwind") return
    mode = "tailwind"
    paint(true)
  }
  cssTab.onclick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (mode === "css") return
    mode = "css"
    paint(true)
  }

  root.append(toggle, body)

  requestAnimationFrame(() => paint(false))
  return root
}

export const applyOverlayStyles = (
  overlay: HTMLDivElement,
  tooltip: HTMLDivElement,
  settings: InspectorSettings
) => {
  const paint = getOverlayPaint(settings)

  overlay.style.backgroundColor = paint.fill
  overlay.style.backgroundImage = "none"
  overlay.style.animation = "none"
  overlay.style.border = paint.border
  overlay.style.borderRadius = paint.borderRadius
  overlay.style.transition = paint.transition

  tooltip.style.background = paint.tooltipBackground
  tooltip.style.border = `1px solid ${paint.tooltipBorder}`
  tooltip.style.color = paint.tooltipText
  tooltip.style.padding = paint.tooltipPadding
  tooltip.style.borderRadius = paint.tooltipBorderRadius
  tooltip.style.transition = paint.tooltipTransition
}

export const ARROW_UP_RIGHT_ICON =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>'
