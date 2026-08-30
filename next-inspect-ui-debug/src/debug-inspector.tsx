"use client"

import { useEffect } from "react"

import {
  findChildInspectable,
  findChildInspectableWhere,
  findEdgeSiblingInspectable,
  findParentInspectable,
  findSiblingInspectable,
  getElementFiber,
  isInspectorChrome,
} from "next-inspect-ui/lib"
import {
  DEFAULT_DEV_SPOTLIGHT_PROPS,
  formatTooltipLabel,
  expandRectWithPadding,
  formatComponentTag,
  formatDomTag,
  getInspectorSettings,
  getOverlayPaint,
  getTooltipPosition,
  initInspectorSettings,
  INSPECTOR_IDES,
  matchesInspectorShortcut,
  PADDING_MAX,
  PADDING_MIN,
  setDevSpotlightProps,
  subscribeInspectorSettings,
  type InspectorIde,
  type InspectorSettings,
} from "next-inspect-ui/lib"
import {
  formatPageLabel,
  getClimbOpenSource,
  getClimbStepDisplaySource,
  isBundledOrExternalPath,
  isDistinctUsedSource,
  isLikelySourceFile,
  isSameSourceLine,
  normalizeSourceLocation,
  pickDefinedSource,
  pickOpenSource,
  pickPreferredStackSource,
  sourceFromFiberDebugSource,
  toAbsolutePath,
  underStackTransform,
  type FiberDebugSource,
  type NamedSourceFrame,
  type SourceLocation,
} from "next-inspect-ui/lib"
import {
  documentHasStamps,
  readHostStamp,
  readOwnerStamp,
} from "next-inspect-ui/lib"

type ServerDebugInfo = {
  name?: string
  env?: string
  key?: string
  stack?: unknown
  debugStack?: unknown
  debugLocation?: unknown
  owner?: ServerDebugInfo | null
}

type ReactFiber = {
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

type SourceMap = SourceMapData & {
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

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

const getFiber = (element: Element) => getElementFiber<ReactFiber>(element)

const readComponentTypeName = (type: ReactFiber["type"]): string | null => {
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

const isCompositeComponentFiber = (fiber: ReactFiber) => {
  const tag = fiber.tag
  return tag === 0 || tag === 1 || tag === 11 || tag === 14 || tag === 15
}

const isHostComponentFiber = (fiber: ReactFiber) => fiber.tag === 5

const isFrameworkInspectorName = (name: string) => {
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

const isSameSource = (
  a: SourceLocation | null | undefined,
  b: SourceLocation | null | undefined
) =>
  Boolean(
    a &&
      b &&
      a.filePath === b.filePath &&
      a.line === b.line &&
      a.column === b.column
  )

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

const getNamedTarget = (fiber: ReactFiber | null): NamedTarget | null => {
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

const getOwningCompositeFiber = (hostFiber: ReactFiber): ReactFiber | null => {
  let current = hostFiber.return ?? null

  while (current) {
    
    if (current.tag === 7 || current.tag === 8 || current.tag === 12) {
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

const getLabelOwner = (hostFiber: ReactFiber): ClimbOwner | null => {
  
  const fromDebug = readDebugInfoOwner(hostFiber)
  if (fromDebug) return fromDebug

  const composite = getOwningCompositeFiber(hostFiber)
  if (!composite) return null
  const name = readComponentTypeName(composite.type)
  if (!name || isFrameworkInspectorName(name)) return null
  return { name, fiber: composite, isSelfDebugOwner: false }
}

const getDirectClimbOwner = (hostFiber: ReactFiber): ClimbOwner | null => {
  const strict = getLabelOwner(hostFiber)
  if (strict) return strict

  let owner: ReactFiber | null = hostFiber._debugOwner ?? null
  let hops = 0
  while (owner && hops < 12) {
    hops += 1
    const name = readComponentTypeName(owner.type)
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

type ComponentRuntime = "server" | "client"

const framesLookServer = (frames: StackFrame[]) =>
  frames.some(
    (frame) =>
      frame.isServer ||
      frame.file.startsWith("about://React/Server/") ||
      frame.file.includes(".next/server")
  )

const getComponentRuntime = (
  fiber: ReactFiber | null | undefined,
  debugInfo?: ServerDebugInfo
): ComponentRuntime | null => {
  if (debugInfo) {
    const env = (debugInfo.env ?? "").toLowerCase()
    if (env.includes("client")) return "client"
    if (env.includes("server")) return "server"
    if (framesLookServer(getDebugInfoFrames(debugInfo))) return "server"
    
    if (debugInfo.name) return "server"
  }

  if (!fiber) return null

  const self = readDebugInfoOwner(fiber)
  if (self?.debugInfo && self.debugInfo !== debugInfo) {
    return getComponentRuntime(fiber, self.debugInfo)
  }

  const named = getNamedTarget(fiber)
  if (named?.debugInfo && named.debugInfo !== debugInfo) {
    return getComponentRuntime(named.fiber, named.debugInfo)
  }

  if (isCompositeComponentFiber(fiber)) {
    const name = readComponentTypeName(fiber.type)
    if (name && !isFrameworkInspectorName(name)) return "client"
  }

  if (named && isCompositeComponentFiber(named.fiber) && !named.debugInfo) {
    return "client"
  }

  return null
}

const formatRuntimeLabel = (runtime: ComponentRuntime) =>
  runtime === "server" ? "Server" : "Client"

const createRuntimeBadge = (runtime: ComponentRuntime) => {
  const badge = document.createElement("span")
  badge.textContent = formatRuntimeLabel(runtime)
  badge.setAttribute("data-dev-inspector-runtime", runtime)
  
  badge.style.cssText =
    runtime === "server"
      ? "display:inline-flex;align-items:center;flex:none;margin-left:8px;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:0.04em;line-height:1.4;background:rgb(161 161 170 / 18%);color:rgb(212 212 216);border:1px solid rgb(161 161 170 / 28%);"
      : "display:inline-flex;align-items:center;flex:none;margin-left:8px;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:0.04em;line-height:1.4;background:rgb(56 189 248 / 14%);color:rgb(125 211 252);border:1px solid rgb(56 189 248 / 28%);"
  return badge
}

const isOwnerAncestorOf = (child: ReactFiber, parent: ReactFiber): boolean => {
  let current: ReactFiber | null = child._debugOwner ?? null
  let hops = 0

  while (current && hops < 32) {
    hops += 1
    if (current === parent) return true
    current = current._debugOwner ?? null
  }

  return false
}

const isDirectFiberChildOf = (
  child: ReactFiber,
  parent: ReactFiber
): boolean => {
  let current = child.return ?? null

  while (current) {
    if (current.tag === 7 || current.tag === 8 || current.tag === 12) {
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

const getComponentName = (fiber: ReactFiber | null) => {
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

const getDomHoverName = (fiber: ReactFiber | null) => getHostTagName(fiber)

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

const getOwnStackFrames = (fiber: ReactFiber) => {
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

const resolveFirstMappedFrame = async (
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
      
    }
  }

  return pickPreferredStackSource(mapped, componentName)
}

const sourceFromStackFrame = (
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

const preferredSourceFromFrames = (
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

const findNearestAuthorCallSite = async (
  fiber: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
): Promise<SourceLocation | null> => {
  const sync = findNearestAuthorCallSiteSync(fiber, projectRoot)
  if (sync) return sync

  const seen = new Set<ReactFiber>()
  const queue: ReactFiber[] = []
  
  
  
  
  
  if (fiber._debugOwner) queue.push(fiber._debugOwner)

  let hops = 0
  let stackFallback: SourceLocation | null = null
  let debugInfoFallback: SourceLocation | null = null

  
  const rememberDebugInfo = async (node: ReactFiber) => {
    if (debugInfoFallback || !node._debugInfo?.length) return
    for (let i = node._debugInfo.length - 1; i >= 0; i -= 1) {
      const pair = await resolveDebugInfoPair(
        node._debugInfo[i]!,
        projectRoot,
        sourceMapCache
      )
      const candidate = pair.source ?? pair.renderedBy
      if (candidate) {
        debugInfoFallback = candidate
        return
      }
    }
  }

  await rememberDebugInfo(fiber)
  while (queue.length > 0 && hops < 48) {
    hops += 1
    const current = queue.shift()!
    if (seen.has(current)) continue
    seen.add(current)

    const fromDebug = await resolveFiberDebugSource(
      current._debugSource,
      projectRoot,
      sourceMapCache
    )
    if (fromDebug) return fromDebug

    await rememberDebugInfo(current)

    if (!stackFallback) {
      const fromStack = await resolveFirstMappedFrame(
        getOwnStackFrames(current),
        projectRoot,
        sourceMapCache,
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

const stampedHostSource = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => {
  const node = fiber.stateNode
  if (!(node instanceof Element)) return null
  return normalizeSourceLocation(readHostStamp(node, projectRoot))
}

const stampedOwnerSource = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => {
  const node = fiber.stateNode
  if (!(node instanceof Element)) return null
  return normalizeSourceLocation(readOwnerStamp(node, projectRoot))
}

let stampsFeedResolution = false

const setStampsFeedResolution = (on: boolean) => {
  stampsFeedResolution = on
}

const readGroundTruthStamp = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => stampedHostSource(fiber, projectRoot)

const stampedAuthorSource = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null =>
  stampsFeedResolution ? readGroundTruthStamp(fiber, projectRoot) : null

const finalizeHostAuthorSource = (
  fiber: ReactFiber,
  candidate: SourceLocation | null,
  projectRoot: string
): SourceLocation | null =>
  candidate ?? findNearestAuthorCallSiteSync(fiber, projectRoot)

const getHostAuthorSource = (
  fiber: ReactFiber,
  projectRoot: string,
  
  useStamps = true
): SourceLocation | null => {
  
  const stamped = useStamps ? stampedAuthorSource(fiber, projectRoot) : null
  if (stamped) return stamped

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
    return finalizeHostAuthorSource(fiber, fromHost, projectRoot)
  }

  const fromOwnStack = preferredSourceFromFrames(
    getOwnStackFrames(fiber),
    projectRoot,
    null
  )
  if (fromOwnStack) {
    return finalizeHostAuthorSource(fiber, fromOwnStack, projectRoot)
  }

  
  return findNearestAuthorCallSiteSync(fiber, projectRoot)
}

const getInstantDefinedSource = (
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

const getInstantUsedSource = (
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

const decodeVlq = (segment: string) => {
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

  const sourceWithRoot = map.sourceRoot
    ? `${map.sourceRoot.replace(/\/$/, "")}/${source}`
    : source

  const filePath = toAbsolutePath(sourceWithRoot, projectRoot)
  if (isBundledOrExternalPath(filePath)) return null

  return {
    filePath,
    line: position.originalLine + 1,
    column: position.originalColumn + 1,
  }
}

const resolveHostAuthorSource = async (
  fiber: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>,
  
  useStamps = true
): Promise<SourceLocation | null> => {
  
  const stamped = useStamps ? stampedAuthorSource(fiber, projectRoot) : null
  if (stamped) return stamped

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
    return finalizeHostAuthorSource(fiber, fromHost, projectRoot)
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
    return finalizeHostAuthorSource(fiber, fromOwnStack, projectRoot)
  }

  return findNearestAuthorCallSite(fiber, projectRoot, sourceMapCache)
}

const resolveSource = async (
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

const resolveInstanceSource = async (
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
        
      }
    }

    owner = owner._debugOwner ?? null
  }

  return null
}

const resolveNearestAncestorSource = async (
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

const openInEditor = (source: SourceLocation, ide: InspectorIde) => {
  window.location.href = INSPECTOR_IDES[ide].url(
    source.filePath,
    source.line,
    source.column
  )
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

const resolveInspectElement = (hit: Element): Element => {
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

const isPointInRect = (
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

const createStylesSection = (element: Element, onLayout: () => void) => {
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

const applyOverlayStyles = (
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

const ARROW_UP_RIGHT_ICON =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>'

const DUAL_SOURCE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm8.2-6l-1.625 1.625l1.4 1.4L16 13l-4.025-4.025l-1.4 1.4L12.2 12H8v2z"/></svg>'

type OpenKind = "used" | "defined"

type OwnerChainStep = {
  name: string
  
  source: SourceLocation | null
  
  definition: SourceLocation | null
  
  parentFiber: ReactFiber
  
  debugInfo?: ServerDebugInfo
  
  runtime: ComponentRuntime | null
}

const resolveDebugInfoPairSync = (
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

const resolveDebugInfoPair = async (
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

export const InspectUI = ({
  projectRoot,
  debug = false,
  verify = false,
}: {
  projectRoot: string
  debug?: boolean
  verify?: boolean
}) => {

  
  
  
  
  
  
  if (process.env.NODE_ENV !== "development") return null

  
  useEffect(() => {
    initInspectorSettings()

    const sourceMapCache = new Map<string, Promise<SourceMap>>()
    const sourceCache = new WeakMap<
      ReactFiber,
      Promise<SourceLocation | null>
    >()
    const instanceSourceCache = new WeakMap<
      ReactFiber,
      Promise<SourceLocation | null>
    >()
    
    const instantDefinedPathCache = new WeakMap<ReactFiber, string>()
    const instantUsedPathCache = new WeakMap<ReactFiber, string>()
    type SourceAvailability = {
      used: boolean
      defined: boolean
      dual: boolean
    }
    const availabilityCache = new WeakMap<ReactFiber, SourceAvailability>()
    const overlay = document.createElement("div")
    const tooltip = document.createElement("div")
    const info = document.createElement("div")
    const logPanel = document.createElement("div")
    const logEntries = document.createElement("div")
    const logFooter = document.createElement("div")
    const previousCursor = document.body.style.cursor
    let hoveredElement: Element | null = null
    
    
    let pendingClickElement: Element | null = null
    let infoVisible = false
    let infoTarget: Element | null = null
    let isActive = false
    let pointerPinned = false
    let pinnedPointerX = 0
    let pinnedPointerY = 0
    
    let treeNavStack: Element[] = []
    
    let optionHeld = false
    
    let ownerChainDepth = 0
    let ownerChainCache = new WeakMap<ReactFiber, OwnerChainStep[]>()
    const bustOwnerChainCache = () => {
      ownerChainCache = new WeakMap()
    }
    
    const instantHostPathCache = new WeakMap<ReactFiber, string>()
    
    type ClimbSelection = { depth: number; step: OwnerChainStep }
    let infoClimbSelection: ClimbSelection | null = null

    const rememberAvailability = (
      fiber: ReactFiber,
      usage: SourceLocation | null,
      definition: SourceLocation | null
    ) => {
      const avail: SourceAvailability = {
        used: Boolean(usage),
        defined: Boolean(definition),
        dual: isDistinctUsedSource(usage, definition),
      }
      availabilityCache.set(fiber, avail)
      return avail
    }

    const getAvailability = (fiber: ReactFiber): SourceAvailability => {
      const cached = availabilityCache.get(fiber)
      if (cached) return cached

      const usage = getInstantUsedSource(fiber, projectRoot)
      const definition = getInstantDefinedSource(fiber, projectRoot)
      return rememberAvailability(fiber, usage, definition)
    }
    
    
    
    let inspectGeneration = 0
    let settings = getInspectorSettings()
    let lastTargetRect: {
      left: number
      top: number
      width: number
      height: number
    } | null = null

    overlay.setAttribute("aria-hidden", "true")
    overlay.setAttribute("data-dev-inspector-overlay", "")
    tooltip.setAttribute("aria-hidden", "true")
    tooltip.setAttribute("data-dev-inspector-tooltip", "")
    overlay.style.cssText =
      "position:fixed;z-index:2147483646;display:none;pointer-events:none;box-sizing:border-box;border-radius:4px;"
    
    tooltip.style.cssText =
      'position:fixed;z-index:2147483647;display:none;pointer-events:none;max-width:min(36rem,calc(100vw - 16px));overflow:visible;box-sizing:border-box;font:12px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;'
    const tooltipFront = document.createElement("div")
    tooltipFront.setAttribute("data-dev-inspector-tooltip-front", "")
    tooltipFront.style.cssText =
      "position:relative;z-index:2;display:flex;align-items:center;box-sizing:border-box;max-width:min(36rem,calc(100vw - 16px));overflow:hidden;box-shadow:0 4px 12px rgb(0 0 0 / 30%);"
    
    const tooltipDualBadge = document.createElement("span")
    tooltipDualBadge.setAttribute("aria-hidden", "true")
    tooltipDualBadge.innerHTML = DUAL_SOURCE_ICON
    tooltipDualBadge.style.cssText =
      "display:none;flex:none;align-items:center;justify-content:center;margin-right:3px;width:14px;height:14px;box-sizing:border-box;"
    const tooltipIconWrap = document.createElement("span")
    tooltipIconWrap.setAttribute("aria-hidden", "true")
    tooltipIconWrap.style.cssText =
      "display:inline-flex;flex:none;align-items:center;justify-content:center;overflow:hidden;width:0;margin-right:0;transition:width 160ms ease,margin-right 160ms ease;"
    tooltipIconWrap.innerHTML = ARROW_UP_RIGHT_ICON
    const tooltipLabel = document.createElement("span")
    tooltipLabel.style.cssText =
      "min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
    tooltipFront.append(tooltipDualBadge, tooltipIconWrap, tooltipLabel)
    tooltip.append(tooltipFront)

    const tooltipUnderLayers: HTMLDivElement[] = []

    const paintTooltipChip = (chip: HTMLElement) => {
      const paint = getOverlayPaint(settings)
      chip.style.background = paint.tooltipBackground
      chip.style.border = `1px solid ${paint.tooltipBorder}`
      chip.style.color = paint.tooltipText
      chip.style.borderRadius = paint.tooltipBorderRadius
      chip.style.padding = paint.tooltipPadding
    }

    const stackMotionOk = () =>
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const clearTooltipStack = () => {
      for (const layer of tooltipUnderLayers) layer.remove()
      tooltipUnderLayers.length = 0
      
      tooltip
        .querySelectorAll("[data-dev-inspector-tooltip-under]")
        .forEach((el) => el.remove())
    }

    const layoutTooltipStack = () => {
      const total = tooltipUnderLayers.length
      tooltipUnderLayers.forEach((layer, index) => {
        
        
        const n = total - index
        layer.style.left = "0"
        layer.style.bottom = "0"
        layer.style.zIndex = String(2 - n)
        layer.style.transform = underStackTransform(n)
        layer.style.opacity = "0.92"
      })
    }

    
    const canShowTooltipStack = () => {
      if (!optionHeld || !hoveredElement) return false
      const fiber = getFiber(hoveredElement)
      return Boolean(fiber && buildOwnerChain(fiber).length > 0)
    }

    const pushTooltipUnder = (text: string) => {
      if (!optionHeld || !text) return
      const chip = document.createElement("div")
      chip.setAttribute("aria-hidden", "true")
      chip.setAttribute("data-dev-inspector-tooltip-under", "")
      const reduceMotion = !stackMotionOk()
      chip.style.cssText =
        "position:absolute;left:0;bottom:0;display:flex;align-items:center;box-sizing:border-box;max-width:min(36rem,calc(100vw - 16px));overflow:hidden;white-space:nowrap;text-overflow:ellipsis;box-shadow:0 4px 12px rgb(0 0 0 / 30%);opacity:0;transform:translate(0,0);pointer-events:none;"
      chip.style.transition = reduceMotion
        ? "none"
        : "transform 180ms ease, opacity 180ms ease"
      paintTooltipChip(chip)
      chip.textContent = text
      tooltip.append(chip)
      tooltipUnderLayers.push(chip)
      
      requestAnimationFrame(() => {
        layoutTooltipStack()
      })
    }

    const popTooltipUnder = () => {
      const chip = tooltipUnderLayers.pop()
      if (!chip) return
      if (!stackMotionOk()) {
        chip.remove()
        layoutTooltipStack()
        return
      }
      chip.style.transform = "translate(0, 0)"
      chip.style.opacity = "0"
      window.setTimeout(() => {
        chip.remove()
        layoutTooltipStack()
      }, 180)
    }

    const setTooltipLabel = (text: string) => {
      tooltipLabel.textContent = text
    }

    const syncUsedIcon = (show: boolean) => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      tooltipIconWrap.style.transition = reduceMotion
        ? "none"
        : "width 160ms ease,margin-right 160ms ease"
      tooltipIconWrap.style.width = show ? "12px" : "0"
      tooltipIconWrap.style.marginRight = show ? "3px" : "0"
    }

    const syncTooltipChromePadding = (hasLeadingIcon: boolean) => {
      const { paddingX, paddingY } = settings.tooltipProps
      
      const padLeft = hasLeadingIcon ? Math.max(4, paddingX - 4) : paddingX
      tooltipFront.style.padding = `${paddingY}px ${paddingX}px ${paddingY}px ${padLeft}px`
    }

    const syncDualBadge = (_fiber: ReactFiber | null) => {
      
      tooltipDualBadge.style.display = "none"
      syncTooltipChromePadding(false)
    }

    
    const toPascalCaseName = (raw: string) =>
      raw
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")

    
    const titleFromSourcePath = (pageName: string | null) => {
      if (!pageName) return null
      const filePath = pageName.split(":")[0] ?? ""
      const segments = filePath.split("/").filter(Boolean)
      const file = segments[segments.length - 1] ?? ""
      const base = file.replace(/\.(tsx|ts|jsx|js|mdx)$/i, "")
      if (!base) return null

      if (base === "page" || base === "layout" || base === "template") {
        return toPascalCaseName(base)
      }
      if (base === "index" && segments.length >= 2) {
        const parent = segments[segments.length - 2]
        if (parent && !parent.startsWith("(") && !parent.startsWith("@")) {
          return toPascalCaseName(parent)
        }
      }

      return toPascalCaseName(base)
    }

    const readFiberDisplayName = (node: ReactFiber) => {
      if (isCompositeComponentFiber(node)) {
        const name = readComponentTypeName(node.type)
        if (name && !isFrameworkInspectorName(name)) return name
      }
      if (node._debugInfo?.length) {
        for (let index = node._debugInfo.length - 1; index >= 0; index -= 1) {
          const info = node._debugInfo[index]
          if (info.name && !isFrameworkInspectorName(info.name)) {
            return info.name
          }
        }
      }
      return null
    }

    
    const findNextNamedOwner = (from: ReactFiber): ReactFiber | null => {
      const seen = new Set<ReactFiber>([from])
      const queue: ReactFiber[] = []
      if (from._debugOwner) queue.push(from._debugOwner)
      if (from.return && from.return !== from._debugOwner) queue.push(from.return)

      let hops = 0
      while (queue.length > 0 && hops < 48) {
        hops += 1
        const current = queue.shift()!
        if (seen.has(current)) continue
        seen.add(current)

        if (readFiberDisplayName(current)) return current

        if (current._debugOwner && !seen.has(current._debugOwner)) {
          queue.push(current._debugOwner)
        }
        if (
          current.return &&
          !seen.has(current.return) &&
          current.return !== current._debugOwner
        ) {
          queue.push(current.return)
        }
      }
      return null
    }

    
    const resolveUsageSourceInParent = (
      child: ReactFiber,
      parent: ReactFiber
    ): SourceLocation | null => {
      const childDef = getInstantDefinedSource(child, projectRoot)

      const fromChild = sourceFromFiberDebugSource(
        child._debugSource,
        projectRoot
      )
      
      if (fromChild && isDistinctUsedSource(fromChild, childDef)) {
        return fromChild
      }

      for (const frame of getOwnStackFrames(child)) {
        const loc = sourceFromStackFrame(frame, projectRoot)
        if (loc && isDistinctUsedSource(loc, childDef)) {
          return loc
        }
      }

      
      return getInstantDefinedSource(parent, projectRoot)
    }

    
    const isRouteFileBoundary = (
      source: SourceLocation | null,
      name: string
    ) => {
      if (/^(Page|Layout|Template)$/i.test(name)) return true
      if (!source) return false
      const file =
        source.filePath.replace(/\\/g, "/").split("/").pop()?.split("?")[0] ??
        ""
      return /^(page|layout|template)\.(tsx|ts|jsx|js|mdx)$/i.test(file)
    }

    
    const getComponentCreationSource = (
      componentFiber: ReactFiber
    ): SourceLocation | null =>
      preferredSourceFromFrames(
        getOwnStackFrames(componentFiber),
        projectRoot,
        getComponentName(componentFiber)
      )

    const resolveClimbStepSync = (
      ownerFiber: ReactFiber,
      child: ReactFiber,
      debugInfo?: ServerDebugInfo
    ): Pick<
      OwnerChainStep,
      "source" | "definition" | "debugInfo" | "runtime"
    > => {
      if (debugInfo) {
        const pair = resolveDebugInfoPairSync(debugInfo, projectRoot)
        return {
          
          
          
          
          source:
            pair.source ??
            getComponentCreationSource(ownerFiber) ??
            getInstantUsedSource(ownerFiber, projectRoot) ??
            resolveUsageSourceInParent(child, ownerFiber),
          definition:
            pair.renderedBy ?? getInstantDefinedSource(ownerFiber, projectRoot),
          debugInfo,
          runtime: getComponentRuntime(ownerFiber, debugInfo),
        }
      }

      return {
        source:
          getComponentCreationSource(ownerFiber) ??
          getInstantUsedSource(ownerFiber, projectRoot) ??
          resolveUsageSourceInParent(child, ownerFiber),
        definition: getInstantDefinedSource(ownerFiber, projectRoot),
        runtime: getComponentRuntime(ownerFiber),
      }
    }

    
    const buildOwnerChain = (fiber: ReactFiber): OwnerChainStep[] => {
      const cached = ownerChainCache.get(fiber)
      if (cached) return cached

      const steps: OwnerChainStep[] = []
      const seen = new Set<ReactFiber>()
      const seenNames = new Set<string>()
      const isHostHover =
        isHostComponentFiber(fiber) || fiber.stateNode instanceof Element

      let child: ReactFiber
      let parent: ReactFiber | null = null

      if (isHostHover) {
        const owner = getDirectClimbOwner(fiber)
        if (!owner) return []
        
        
        
        
        
        if (
          !owner.isSelfDebugOwner &&
          !isDirectFiberChildOf(fiber, owner.fiber) &&
          !isOwnerAncestorOf(fiber, owner.fiber)
        ) {
          return []
        }

        const resolved = resolveClimbStepSync(
          owner.fiber,
          fiber,
          owner.debugInfo
        )
        steps.push({
          name: owner.name,
          source: resolved.source,
          definition: resolved.definition,
          parentFiber: owner.fiber,
          debugInfo: resolved.debugInfo,
          runtime: resolved.runtime,
        })
        seen.add(owner.fiber)
        seenNames.add(owner.name)

        if (
          isRouteFileBoundary(resolved.source, owner.name) ||
          isRouteFileBoundary(resolved.definition, owner.name)
        ) {
          ownerChainCache.set(fiber, steps)
          return steps
        }

        child = owner.fiber
        parent = findNextNamedOwner(owner.fiber)
        
        while (
          parent &&
          (parent === owner.fiber || readFiberDisplayName(parent) === owner.name)
        ) {
          parent = findNextNamedOwner(parent)
        }
      } else {
        const named = getNamedTarget(fiber)?.fiber ?? fiber
        parent = findNextNamedOwner(named)
        if (!parent) return []
        if (
          !isDirectFiberChildOf(named, parent) &&
          !isOwnerAncestorOf(named, parent)
        ) {
          return []
        }
        child = named
      }

      let hops = 0
      while (parent && hops < 32) {
        hops += 1
        if (seen.has(parent)) break
        seen.add(parent)

        if (
          !isDirectFiberChildOf(child, parent) &&
          !isOwnerAncestorOf(child, parent)
        ) {
          break
        }

        const name = readFiberDisplayName(parent)
        if (!name || isFrameworkInspectorName(name)) break

        
        
        
        
        if (seenNames.has(name) && seen.has(parent)) break

        const resolved = resolveClimbStepSync(parent, child)
        steps.push({
          name,
          source: resolved.source,
          definition: resolved.definition,
          parentFiber: parent,
          runtime: resolved.runtime,
        })
        seenNames.add(name)

        if (
          isRouteFileBoundary(resolved.source, name) ||
          isRouteFileBoundary(resolved.definition, name)
        ) {
          break
        }

        child = parent
        const next = findNextNamedOwner(parent)
        if (
          !next ||
          (!isDirectFiberChildOf(parent, next) && !isOwnerAncestorOf(parent, next))
        ) {
          break
        }
        parent = next
      }

      if (steps.length > 0) ownerChainCache.set(fiber, steps)
      return steps
    }

    const getActiveChainStep = (fiber: ReactFiber): OwnerChainStep | null => {
      if (!optionHeld) return null
      const chain = buildOwnerChain(fiber)
      if (chain.length === 0) return null
      const index = Math.min(
        Math.max(0, ownerChainDepth),
        chain.length - 1
      )
      return chain[index] ?? null
    }

    
    const getUsedContextName = (fiber: ReactFiber) => {
      const step = getActiveChainStep(fiber)
      if (step) return step.name

      const definedName = getComponentName(fiber)

      
      for (const start of [fiber._debugOwner ?? null, fiber.return ?? null]) {
        let current: ReactFiber | null = start
        let hops = 0
        while (current && hops < 16) {
          hops += 1
          const name = readFiberDisplayName(current)
          if (name && name !== definedName) return name
          current = current._debugOwner ?? current.return ?? null
        }
      }

      return null
    }

    
    const climbDisplaySource = (step: OwnerChainStep) =>
      getClimbStepDisplaySource(step)

    const getCachedPageName = (fiber: ReactFiber, kind: OpenKind) => {
      if (!settings.tooltipProps.showPageName) return null
      if (kind === "used") {
        const step = getActiveChainStep(fiber)
        const display = step ? climbDisplaySource(step) : null
        if (display) return formatPageLabel(display, projectRoot)

        let pageName = instantDefinedPathCache.get(
          step?.parentFiber ?? fiber
        ) ?? instantUsedPathCache.get(fiber) ?? null
        if (!pageName) {
          const instantSource =
            getInstantDefinedSource(
              step?.parentFiber ?? fiber,
              projectRoot
            ) ??
            getInstantUsedSource(step?.parentFiber ?? fiber, projectRoot)
          if (instantSource) {
            pageName = formatPageLabel(instantSource, projectRoot)
            instantUsedPathCache.set(fiber, pageName)
          }
        }
        return pageName
      }

      
      let pageName = instantHostPathCache.get(fiber) ?? null
      if (!pageName) {
        const instantSource = getHostAuthorSource(fiber, projectRoot)
        if (instantSource) {
          pageName = formatPageLabel(instantSource, projectRoot)
          instantHostPathCache.set(fiber, pageName)
        }
      }
      return pageName
    }

    const getTooltipTitle = (fiber: ReactFiber, kind: OpenKind) => {
      if (kind === "used") {
        return (
          getUsedContextName(fiber) ??
          titleFromSourcePath(getCachedPageName(fiber, "used")) ??
          getComponentName(fiber)
        )
      }
      return getDomHoverName(fiber)
    }

    
    const resolveOpenKind = (fiber: ReactFiber | null): OpenKind => {
      if (!fiber) return "defined"
      if (optionHeld && getActiveChainStep(fiber)) return "used"
      return "defined"
    }

    const paintTooltipForFiber = (fiber: ReactFiber) => {
      const kind = resolveOpenKind(fiber)
      const step = kind === "used" ? getActiveChainStep(fiber) : null
      const prev = infoClimbSelection
      let infoNeedsRefresh = false

      if (kind === "used" && step) {
        const nextSel = { depth: ownerChainDepth, step }
        infoNeedsRefresh =
          !prev ||
          prev.depth !== nextSel.depth ||
          prev.step.name !== step.name ||
          prev.step.parentFiber !== step.parentFiber
        infoClimbSelection = nextSel
      } else if (prev) {
        
        infoClimbSelection = null
        infoNeedsRefresh = true
      }

      const baseLabel =
        formatTooltipLabel({
          title: getTooltipTitle(fiber, kind),
          pageName: getCachedPageName(fiber, kind),
          tooltipProps: settings.tooltipProps,
          tagStyle: kind === "used" ? "component" : "dom",
        }) ||
        (kind === "used"
          ? formatComponentTag("Component")
          : formatDomTag("element"))

      setTooltipLabel(baseLabel)
      syncDualBadge(fiber)
      syncUsedIcon(kind === "used")
      if (lastTargetRect) positionTooltip(lastTargetRect)

      
      if (
        infoNeedsRefresh &&
        infoVisible &&
        infoTarget &&
        hoveredElement === infoTarget
      ) {
        void renderInfo(infoTarget, fiber)
      }
    }
    info.setAttribute("aria-hidden", "true")
    info.setAttribute("data-dev-inspector-tooltip", "")
    info.style.cssText =
      'position:fixed;z-index:2147483647;display:none;pointer-events:none;max-width:min(26rem,calc(100vw - 16px));box-sizing:border-box;background:var(--card,#18181b);border:1px solid var(--border,rgb(255 255 255 / 12%));color:var(--card-foreground,#e4e4e7);padding:12px 14px;border-radius:12px;font:12px/1.5 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 12px 32px rgb(0 0 0 / 45%);cursor:default;'
    
    
    
    
    const RESOLVE_MODE_KEY = "next-inspect-ui:resolve-uses-stamps"
    let resolveUsesStamps = false
    try {
      resolveUsesStamps =
        window.sessionStorage.getItem(RESOLVE_MODE_KEY) === "1"
    } catch {
      resolveUsesStamps = false
    }
    setStampsFeedResolution(resolveUsesStamps)

    const DEBUG_PANEL_KEY = "next-inspect-ui:debug-panel"
    let debugPanelOpen = true
    try {
      debugPanelOpen = window.sessionStorage.getItem(DEBUG_PANEL_KEY) !== "0"
    } catch {
      debugPanelOpen = true
    }

    logPanel.setAttribute("aria-hidden", "true")
    logPanel.setAttribute("data-dev-inspector-log", "")
    logPanel.style.cssText =
      'position:fixed;left:12px;bottom:12px;z-index:2147483647;display:none;pointer-events:auto;box-sizing:border-box;width:min(22rem,calc(100vw - 24px));max-height:100vh;flex-direction:column;gap:6px;padding:8px 10px;background:rgb(9 9 11 / 96%);border:1px solid rgb(148 163 184 / 18%);border-radius:8px;box-shadow:0 8px 24px rgb(0 0 0 / 45%);color:#94a3b8;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;'
    const logHeader = document.createElement("div")
    logHeader.style.cssText =
      "flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;"
    const logTitle = document.createElement("div")
    logTitle.textContent = "Debug"
    logTitle.style.cssText =
      "min-width:0;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;font-size:11px;opacity:0.85;"
    const hideLogBtn = document.createElement("button")
    hideLogBtn.type = "button"
    hideLogBtn.textContent = "Hide"
    hideLogBtn.setAttribute("aria-label", "Hide debug panel")
    hideLogBtn.style.cssText =
      "flex:none;appearance:none;border:1px solid rgb(34 197 94 / 45%);background:rgb(34 197 94 / 12%);color:#22c55e;border-radius:4px;padding:2px 8px;font:inherit;cursor:pointer;line-height:1.4;"
    
    const dragHandle = document.createElement("div")
    dragHandle.setAttribute("aria-label", "Drag debug panel")
    dragHandle.setAttribute("role", "button")
    dragHandle.style.cssText = [
      "flex:none",
      "width:12px",
      "height:16px",
      "cursor:grab",
      "touch-action:none",
      "opacity:0.5",
      "background-image:radial-gradient(currentColor 1px, transparent 1px)",
      "background-size:5px 5px",
      "background-position:1px 3px",
      "background-repeat:repeat",
      "color:#94a3b8",
    ].join(";")

    dragHandle.addEventListener("pointerdown", (event) => {
      event.preventDefault()
      event.stopPropagation()
      try {
        dragHandle.setPointerCapture(event.pointerId)
      } catch {
        
      }

      const start = logPanel.getBoundingClientRect()
      const startX = event.clientX
      const startY = event.clientY
      dragHandle.style.cursor = "grabbing"

      let latest: PanelRect = {
        left: start.left,
        top: start.top,
        width: start.width,
        height: start.height,
      }

      const onMove = (move: PointerEvent) => {
        
        
        const left = Math.min(
          Math.max(0, start.left + (move.clientX - startX)),
          Math.max(0, window.innerWidth - start.width)
        )
        const top = Math.min(
          Math.max(0, start.top + (move.clientY - startY)),
          Math.max(0, window.innerHeight - start.height)
        )
        latest = { ...latest, left, top }
        applyPanelRect(latest)
      }

      const onUp = () => {
        dragHandle.removeEventListener("pointermove", onMove)
        dragHandle.removeEventListener("pointerup", onUp)
        dragHandle.removeEventListener("pointercancel", onUp)
        dragHandle.style.cursor = "grab"
        persistPanelRect(latest)
      }

      dragHandle.addEventListener("pointermove", onMove)
      dragHandle.addEventListener("pointerup", onUp)
      dragHandle.addEventListener("pointercancel", onUp)
    })

    logHeader.append(dragHandle, logTitle, hideLogBtn)
    logEntries.style.cssText =
      "flex:1 1 auto;min-height:0;overflow-x:hidden;overflow-y:auto;display:flex;flex-direction:column;gap:2px;"
    logFooter.style.cssText =
      "flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:6px;border-top:1px solid rgb(34 197 94 / 25%);color:#22c55e;"
    const logHint = document.createElement("div")
    logHint.style.cssText =
      "min-width:0;flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
    const copyLogsBtn = document.createElement("button")
    copyLogsBtn.type = "button"
    copyLogsBtn.textContent = "Copy logs"
    copyLogsBtn.style.cssText =
      "flex:none;appearance:none;border:1px solid rgb(34 197 94 / 45%);background:rgb(34 197 94 / 12%);color:#22c55e;border-radius:4px;padding:2px 8px;font:inherit;cursor:pointer;line-height:1.4;"
    
    
    
    const openModeBtn = document.createElement("button")
    openModeBtn.type = "button"
    openModeBtn.style.cssText =
      "flex:none;appearance:none;border:1px solid rgb(148 163 184 / 40%);background:rgb(148 163 184 / 10%);border-radius:4px;padding:2px 8px;font:inherit;cursor:pointer;line-height:1.4;white-space:nowrap;"

    const paintOpenModeBtn = () => {
      openModeBtn.textContent = resolveUsesStamps
        ? "resolve: stamp"
        : "resolve: runtime"
      openModeBtn.style.color = resolveUsesStamps ? "#22c55e" : "#f97316"
      openModeBtn.style.borderColor = resolveUsesStamps
        ? "rgb(34 197 94 / 45%)"
        : "rgb(249 115 22 / 45%)"
      openModeBtn.style.background = resolveUsesStamps
        ? "rgb(34 197 94 / 12%)"
        : "rgb(249 115 22 / 12%)"
      openModeBtn.setAttribute("aria-pressed", String(resolveUsesStamps))
      openModeBtn.title = resolveUsesStamps
        ? "Hover and click use the build-time stamp — exact"
        : "Hover and click use the runtime path — what ships, wrong files included"
    }

    
    const syncOpenModeVisibility = () => {
      const stamped = documentHasStamps()
      openModeBtn.style.display = stamped ? "inline-flex" : "none"
      
      
      if (!stamped && resolveUsesStamps) {
        resolveUsesStamps = false
        setStampsFeedResolution(false)
        paintOpenModeBtn()
      }
    }

    paintOpenModeBtn()
    syncOpenModeVisibility()

    openModeBtn.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      resolveUsesStamps = !resolveUsesStamps
      setStampsFeedResolution(resolveUsesStamps)
      try {
        window.sessionStorage.setItem(
          RESOLVE_MODE_KEY,
          resolveUsesStamps ? "1" : "0"
        )
      } catch {
        
      }
      paintOpenModeBtn()
      logEvent(
        resolveUsesStamps
          ? "resolving from stamps (exact)"
          : "resolving from runtime (shipped behaviour)"
      )
    })

    
    
    const clearLogsBtn = document.createElement("button")
    clearLogsBtn.type = "button"
    clearLogsBtn.textContent = "Clear"
    clearLogsBtn.setAttribute("aria-label", "Clear debug logs")
    clearLogsBtn.style.cssText =
      "flex:none;appearance:none;border:1px solid rgb(148 163 184 / 40%);background:rgb(148 163 184 / 10%);color:#94a3b8;border-radius:4px;padding:2px 8px;font:inherit;cursor:pointer;line-height:1.4;"

    clearLogsBtn.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      logEntries.replaceChildren()
      logLines.length = 0
      verifyTally.match = 0
      verifyTally.mismatch = 0
      verifyTally.unverifiable = 0
      logEvent("logs cleared")
    })

    logFooter.append(logHint, openModeBtn, clearLogsBtn, copyLogsBtn)
    logPanel.append(logHeader, logEntries, logFooter)

    const debugToggleBtn = document.createElement("button")
    debugToggleBtn.type = "button"
    debugToggleBtn.textContent = "Debug"
    debugToggleBtn.setAttribute("aria-label", "Show debug panel")
    debugToggleBtn.setAttribute("aria-pressed", "false")
    debugToggleBtn.setAttribute("data-dev-inspector-debug-toggle", "")
    debugToggleBtn.style.cssText =
      'position:fixed;left:12px;bottom:12px;z-index:2147483647;display:none;pointer-events:auto;appearance:none;border:1px solid rgb(34 197 94 / 45%);background:rgb(0 0 0 / 55%);color:#22c55e;border-radius:999px;padding:6px 12px;font:12px/1.2 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;cursor:pointer;box-shadow:0 4px 16px rgb(0 0 0 / 35%);'

    const paintTooltipChrome = () => {
      applyOverlayStyles(overlay, tooltip, settings)
      
      tooltip.style.background = "transparent"
      tooltip.style.border = "none"
      tooltip.style.padding = "0"
      tooltip.style.boxShadow = "none"
      paintTooltipChip(tooltipFront)
      for (const layer of tooltipUnderLayers) paintTooltipChip(layer)
    }

    paintTooltipChrome()
    document.body.append(overlay, tooltip, info, logPanel, debugToggleBtn)

    
    
    
    
    

    const PANEL_RECT_KEY = "next-inspect-ui:debug-panel-rect"
    const PANEL_MIN_WIDTH = 240
    const PANEL_MIN_HEIGHT = 120

    type PanelRect = { left: number; top: number; width: number; height: number }

    const applyPanelRect = (rect: PanelRect) => {
      logPanel.style.left = `${rect.left}px`
      logPanel.style.top = `${rect.top}px`
      logPanel.style.width = `${rect.width}px`
      logPanel.style.height = `${rect.height}px`
      
      
      logPanel.style.bottom = "auto"
      logPanel.style.maxHeight = "none"
    }

    const storedPanelRect = (() => {
      try {
        const raw = window.sessionStorage.getItem(PANEL_RECT_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<PanelRect>
        if (
          typeof parsed.left !== "number" ||
          typeof parsed.top !== "number" ||
          typeof parsed.width !== "number" ||
          typeof parsed.height !== "number"
        ) {
          return null
        }
        return parsed as PanelRect
      } catch {
        return null
      }
    })()

    if (storedPanelRect) applyPanelRect(storedPanelRect)

    const persistPanelRect = (rect: PanelRect) => {
      try {
        window.sessionStorage.setItem(PANEL_RECT_KEY, JSON.stringify(rect))
      } catch {
        
      }
    }

    type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

    const HANDLE_THICKNESS = 8
    const HANDLE_STYLES: Record<ResizeEdge, string> = {
      n: `top:${-HANDLE_THICKNESS / 2}px;left:0;right:0;height:${HANDLE_THICKNESS}px;cursor:ns-resize;`,
      s: `bottom:${-HANDLE_THICKNESS / 2}px;left:0;right:0;height:${HANDLE_THICKNESS}px;cursor:ns-resize;`,
      w: `left:${-HANDLE_THICKNESS / 2}px;top:0;bottom:0;width:${HANDLE_THICKNESS}px;cursor:ew-resize;`,
      e: `right:${-HANDLE_THICKNESS / 2}px;top:0;bottom:0;width:${HANDLE_THICKNESS}px;cursor:ew-resize;`,
      nw: `top:${-HANDLE_THICKNESS / 2}px;left:${-HANDLE_THICKNESS / 2}px;width:${HANDLE_THICKNESS * 2}px;height:${HANDLE_THICKNESS * 2}px;cursor:nwse-resize;`,
      ne: `top:${-HANDLE_THICKNESS / 2}px;right:${-HANDLE_THICKNESS / 2}px;width:${HANDLE_THICKNESS * 2}px;height:${HANDLE_THICKNESS * 2}px;cursor:nesw-resize;`,
      sw: `bottom:${-HANDLE_THICKNESS / 2}px;left:${-HANDLE_THICKNESS / 2}px;width:${HANDLE_THICKNESS * 2}px;height:${HANDLE_THICKNESS * 2}px;cursor:nesw-resize;`,
      se: `bottom:${-HANDLE_THICKNESS / 2}px;right:${-HANDLE_THICKNESS / 2}px;width:${HANDLE_THICKNESS * 2}px;height:${HANDLE_THICKNESS * 2}px;cursor:nwse-resize;`,
    }

    for (const edge of Object.keys(HANDLE_STYLES) as ResizeEdge[]) {
      const handle = document.createElement("div")
      handle.dataset.devInspectorResize = edge
      handle.style.cssText = `position:absolute;z-index:1;touch-action:none;${HANDLE_STYLES[edge]}`

      handle.addEventListener("pointerdown", (event) => {
        event.preventDefault()
        event.stopPropagation()
        try {
          handle.setPointerCapture(event.pointerId)
        } catch {
          
          
        }

        const start = logPanel.getBoundingClientRect()
        const startX = event.clientX
        const startY = event.clientY
        let latest: PanelRect = {
          left: start.left,
          top: start.top,
          width: start.width,
          height: start.height,
        }

        const onMove = (move: PointerEvent) => {
          const dx = move.clientX - startX
          const dy = move.clientY - startY

          let { left, top } = start
          let { width, height } = start

          if (edge.includes("e")) {
            width = start.width + dx
          }
          if (edge.includes("w")) {
            
            
            width = start.width - dx
            left = start.left + dx
          }
          if (edge.includes("s")) {
            height = start.height + dy
          }
          if (edge.includes("n")) {
            height = start.height - dy
            top = start.top + dy
          }

          if (width < PANEL_MIN_WIDTH) {
            if (edge.includes("w")) left = start.left + start.width - PANEL_MIN_WIDTH
            width = PANEL_MIN_WIDTH
          }
          if (height < PANEL_MIN_HEIGHT) {
            if (edge.includes("n")) top = start.top + start.height - PANEL_MIN_HEIGHT
            height = PANEL_MIN_HEIGHT
          }

          
          left = Math.min(Math.max(0, left), window.innerWidth - PANEL_MIN_WIDTH)
          top = Math.min(Math.max(0, top), window.innerHeight - PANEL_MIN_HEIGHT)
          width = Math.min(width, window.innerWidth - left)
          height = Math.min(height, window.innerHeight - top)

          latest = { left, top, width, height }
          applyPanelRect(latest)
        }

        const onUp = () => {
          handle.removeEventListener("pointermove", onMove)
          handle.removeEventListener("pointerup", onUp)
          handle.removeEventListener("pointercancel", onUp)
          persistPanelRect(latest)
        }

        handle.addEventListener("pointermove", onMove)
        handle.addEventListener("pointerup", onUp)
        handle.addEventListener("pointercancel", onUp)
      })

      logPanel.appendChild(handle)
    }

    const syncDebugPanelVisibility = () => {
      if (!debug) {
        logPanel.style.display = "none"
        debugToggleBtn.style.display = "none"
        logPanel.setAttribute("aria-hidden", "true")
        return
      }
      if (debugPanelOpen) {
        logPanel.style.display = "flex"
        debugToggleBtn.style.display = "none"
        logPanel.setAttribute("aria-hidden", "false")
        debugToggleBtn.setAttribute("aria-pressed", "true")
      } else {
        logPanel.style.display = "none"
        debugToggleBtn.style.display = "inline-flex"
        logPanel.setAttribute("aria-hidden", "true")
        debugToggleBtn.setAttribute("aria-pressed", "false")
      }
    }

    const setDebugPanelOpen = (open: boolean) => {
      debugPanelOpen = open
      try {
        window.sessionStorage.setItem(DEBUG_PANEL_KEY, open ? "1" : "0")
      } catch {
        
      }
      syncDebugPanelVisibility()
    }

    let onSettingsChanged: (() => void) | null = null
    let paintChrome: (() => void) | null = null
    const unsubscribe = subscribeInspectorSettings(() => {
      settings = getInspectorSettings()
      paintChrome?.()
      onSettingsChanged?.()
    })

    const positionTooltip = (targetRect: {
      left: number
      top: number
      width: number
      height: number
    }) => {
      const { tooltipProps } = settings
      const pos = getTooltipPosition({
        target: targetRect,
        tooltipWidth: tooltipFront.offsetWidth,
        tooltipHeight: tooltipFront.offsetHeight,
        side: tooltipProps.side,
        align: tooltipProps.align,
        sideOffset: tooltipProps.sideOffset,
        alignOffset: tooltipProps.alignOffset,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      })
      tooltip.style.left = `${pos.left}px`
      tooltip.style.top = `${pos.top}px`
    }

    const positionInfo = (targetRect: {
      left: number
      top: number
      width: number
      height: number
    }) => {
      const margin = 8
      const width = info.offsetWidth
      const height = info.offsetHeight
      const left = Math.max(
        margin,
        Math.min(targetRect.left, window.innerWidth - width - margin)
      )
      const below = targetRect.top + targetRect.height + margin
      const top =
        below + height + margin > window.innerHeight && targetRect.top > height
          ? targetRect.top - height - margin
          : below
      info.style.left = `${left}px`
      info.style.top = `${top}px`
    }

    const hideInfo = () => {
      infoVisible = false
      infoTarget = null
      infoClimbSelection = null
      info.style.display = "none"
      if (isActive) document.body.style.cursor = "crosshair"
    }

    const reposition = () => {
      if (lastTargetRect) positionInfo(lastTargetRect)
    }

    
    const createClimbTreeSection = (
      hostTag: string,
      hostSource: SourceLocation | null,
      chain: OwnerChainStep[],
      activeDepth: number
    ) => {
      type TreeNode = {
        name: string
        isDom: boolean
        source: SourceLocation | null
        
        climbIndex: number
      }

      
      
      const nodes: TreeNode[] = [
        ...[...chain]
          .map((step, index) => ({
            name: step.name,
            isDom: false,
            source: step.definition ?? step.source,
            climbIndex: index,
          }))
          .reverse(),
        {
          name: hostTag,
          isDom: true,
          source: hostSource,
          climbIndex: -1,
        },
      ]

      const section = document.createElement("div")
      section.setAttribute("data-dev-inspector-owner-tree", "")
      section.style.cssText = "margin-top:10px;"

      const heading = document.createElement("div")
      heading.textContent = "Node tree"
      heading.style.cssText =
        "font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted-foreground,#8b949e);opacity:0.7;margin-bottom:6px;"
      section.appendChild(heading)

      const tree = document.createElement("div")
      tree.style.cssText =
        'display:flex;flex-direction:column;gap:0;font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;'

      
      const expanded = nodes.map(() => true)

      const paint = () => {
        tree.textContent = ""

        nodes.forEach((node, index) => {
          
          for (let a = 0; a < index; a += 1) {
            if (!expanded[a]) return
          }

          const hasChildren = index < nodes.length - 1
          
          const isActive = optionHeld
            ? node.climbIndex === activeDepth
            : node.climbIndex === -1

          const row = document.createElement("div")
          row.style.cssText = [
            "display:flex;align-items:center;gap:6px;min-width:0;padding:3px 2px;",
            isActive
              ? "background:rgb(56 189 248 / 12%);color:var(--foreground,#e4e4e7);"
              : "color:var(--muted-foreground,#8b949e);",
          ].join("")

          
          const gutter = document.createElement("div")
          gutter.style.cssText =
            "display:flex;align-items:center;flex:none;user-select:none;"

          const indent = document.createElement("span")
          indent.style.cssText =
            "display:inline-block;white-space:pre;width:" +
            `${index * 12}px;`

          const twisty = document.createElement("button")
          twisty.type = "button"
          twisty.setAttribute(
            "aria-label",
            hasChildren
              ? expanded[index]
                ? "Collapse"
                : "Expand"
              : "Leaf"
          )
          twisty.style.cssText =
            "appearance:none;border:0;background:transparent;padding:0;margin:0;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;color:inherit;cursor:default;opacity:0.65;font:inherit;line-height:1;"
          if (hasChildren) {
            twisty.style.cursor = "pointer"
            twisty.textContent = expanded[index] ? "▾" : "▸"
            twisty.onclick = (event) => {
              event.preventDefault()
              event.stopPropagation()
              expanded[index] = !expanded[index]
              paint()
              reposition()
            }
          } else {
            twisty.textContent = ""
            twisty.style.opacity = "0"
          }

          gutter.append(indent, twisty)

          const nameEl = document.createElement("span")
          nameEl.textContent = node.isDom
            ? formatDomTag(node.name)
            : formatComponentTag(node.name)
          nameEl.style.cssText = [
            "flex:none;font-weight:600;",
            isActive
              ? "color:var(--foreground,#e4e4e7);"
              : "color:var(--foreground,#e4e4e7);opacity:0.9;",
          ].join("")

          const pathEl = document.createElement("button")
          pathEl.type = "button"
          pathEl.style.cssText =
            "appearance:none;border:0;background:transparent;padding:0;margin:0 0 0 auto;min-width:0;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted-foreground,#8b949e);opacity:0.7;cursor:default;font:inherit;text-align:right;"

          if (node.source) {
            const label = formatPageLabel(node.source, projectRoot)
            pathEl.textContent = label
            pathEl.title = label
            pathEl.style.cursor = "pointer"
            pathEl.onclick = (event) => {
              event.preventDefault()
              event.stopPropagation()
              openInEditor(node.source!, settings.ide)
            }
            pathEl.onmouseenter = () => {
              pathEl.style.color = "var(--foreground,#e4e4e7)"
              pathEl.style.opacity = "1"
            }
            pathEl.onmouseleave = () => {
              pathEl.style.color = "var(--muted-foreground,#8b949e)"
              pathEl.style.opacity = "0.7"
            }
          } else {
            pathEl.textContent = "…"
            pathEl.style.opacity = "0.4"
          }

          row.append(gutter, nameEl, pathEl)
          tree.appendChild(row)
        })
      }

      paint()
      section.appendChild(tree)

      return {
        section,
        refinePaths: (refine: (step: OwnerChainStep) => Promise<void>) => {
          chain.forEach((step, index) => {
            void refine(step).then(() => {
              if (!infoVisible || !info.contains(tree)) return
              
              const nodeIndex = chain.length - 1 - index
              if (nodeIndex >= 0 && nodeIndex < nodes.length) {
                nodes[nodeIndex].source = step.definition ?? step.source
              }
              paint()
              reposition()
            })
          })
        },
        
        setHostSource: (source: SourceLocation | null) => {
          if (!infoVisible || !info.contains(tree)) return
          const hostNode = nodes[nodes.length - 1]
          if (!hostNode?.isDom) return
          hostNode.source = source
          paint()
          reposition()
        },
        
        setClimbStepSource: (
          climbIndex: number,
          source: SourceLocation | null
        ) => {
          if (!infoVisible || !info.contains(tree)) return
          const nodeIndex = chain.length - 1 - climbIndex
          if (nodeIndex < 0 || nodeIndex >= nodes.length) return
          nodes[nodeIndex].source = source
          paint()
          reposition()
        },
      }
    }

    const renderInfo = async (target: Element, fiber: ReactFiber) => {
      
      const liveStep = optionHeld ? getActiveChainStep(fiber) : null
      if (liveStep) {
        infoClimbSelection = { depth: ownerChainDepth, step: liveStep }
      } else {
        infoClimbSelection = null
      }

      const climbStep = infoClimbSelection?.step ?? null
      const climbDepth = infoClimbSelection?.depth ?? 0
      const hostTag = getDomHoverName(fiber) ?? "element"
      
      const chain = buildOwnerChain(fiber)

      info.textContent = ""

      const title = document.createElement("div")
      title.textContent = climbStep
        ? formatComponentTag(climbStep.name)
        : formatDomTag(hostTag)
      title.style.cssText =
        "font-weight:600;font-size:13px;margin-bottom:3px;color:var(--foreground,#ffffff);"
      info.appendChild(title)

      const sourceContainer = document.createElement("div")
      sourceContainer.style.cssText =
        "display:flex;flex-direction:column;gap:2px;"
      const loading = document.createElement("span")
      loading.textContent = "Resolving…"
      loading.style.cssText =
        "font-size:12px;color:var(--muted-foreground,#8b949e);opacity:0.6;font-weight:500;"
      sourceContainer.appendChild(loading)
      info.appendChild(sourceContainer)

      
      const treeHostSource = getHostAuthorSource(fiber, projectRoot)
      const climbTree =
        chain.length > 0
          ? createClimbTreeSection(
              hostTag,
              treeHostSource,
              chain,
              climbDepth
            )
          : null
      if (climbTree) info.appendChild(climbTree.section)

      info.appendChild(createStylesSection(target, reposition))

      info.style.display = "block"
      info.style.pointerEvents = "auto"
      reposition()

      
      climbTree?.refinePaths(async (step) => {
        if (step.debugInfo) {
          const pair = await resolveDebugInfoPair(
            step.debugInfo,
            projectRoot,
            sourceMapCache
          )
          if (pair.source) step.source = pair.source
          if (pair.renderedBy) step.definition = pair.renderedBy
          return
        }
        if (!step.definition) {
          const def = await getSource(step.parentFiber)
          if (def && !isBundledOrExternalPath(def.filePath)) {
            step.definition = def
          }
        }
        if (!step.source) {
          const usage = await getInstanceSource(step.parentFiber)
          if (usage && !isBundledOrExternalPath(usage.filePath)) {
            step.source = usage
          }
        }
      })

      const appendSourceRow = (label: string | null, source: SourceLocation) => {
        const row = document.createElement("div")
        row.style.cssText =
          "display:flex;align-items:baseline;gap:8px;font-size:12px;line-height:1.5;"

        if (label) {
          const tag = document.createElement("span")
          tag.textContent = label
          tag.style.cssText =
            "flex:none;min-width:88px;color:var(--muted-foreground,#8b949e);opacity:0.6;font-weight:500;"
          row.appendChild(tag)
        }

        const path = document.createElement("a")
        path.style.cssText =
          "display:inline-flex;align-items:center;gap:6px;color:var(--muted-foreground,#8b949e);cursor:pointer;font-weight:500;word-break:break-all;text-decoration:none;"
        const pathText = document.createElement("span")
        const relativePath = source.filePath.startsWith(projectRoot)
          ? source.filePath.slice(projectRoot.length + 1)
          : source.filePath
        pathText.textContent = `${relativePath}:${source.line}:${source.column}`
        const pathIcon = document.createElement("span")
        pathIcon.style.cssText =
          "display:inline-flex;flex:none;opacity:0.7;transform:translateX(0);transition:transform 160ms ease,opacity 160ms ease;"
        pathIcon.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>'
        path.append(pathText, pathIcon)
        path.onclick = () => openInEditor(source, settings.ide)
        path.onmouseenter = () => {
          path.style.color = "var(--foreground,#e4e4e7)"
          pathIcon.style.opacity = "1"
          pathIcon.style.transform = "translateX(3px)"
        }
        path.onmouseleave = () => {
          path.style.color = "var(--muted-foreground,#8b949e)"
          pathIcon.style.opacity = "0.7"
          pathIcon.style.transform = "translateX(0)"
        }
        row.appendChild(path)
        sourceContainer.appendChild(row)
      }

      try {
        
        const hostSource =
          (await resolveHostAuthorSource(
            fiber,
            projectRoot,
            sourceMapCache
          )) ?? getHostAuthorSource(fiber, projectRoot)

        if (!infoVisible || infoTarget !== target) return

        climbTree?.setHostSource(hostSource)

        if (climbStep) {
          const composite = climbStep.parentFiber
          let usageLoc = climbStep.source
          let definitionLoc = climbStep.definition

          if (climbStep.debugInfo) {
            const pair = await resolveDebugInfoPair(
              climbStep.debugInfo,
              projectRoot,
              sourceMapCache
            )
            usageLoc = pair.source ?? usageLoc
            definitionLoc = pair.renderedBy ?? definitionLoc
            climbStep.source = usageLoc
            climbStep.definition = definitionLoc
          } else {
            const [usage, definition] = await Promise.all([
              usageLoc
                ? Promise.resolve(usageLoc)
                : getInstanceSource(composite),
              definitionLoc
                ? Promise.resolve(definitionLoc)
                : getSource(composite),
            ])
            usageLoc =
              usage ??
              getInstantUsedSource(composite, projectRoot) ??
              usageLoc
            definitionLoc =
              definition ??
              getInstantDefinedSource(composite, projectRoot) ??
              definitionLoc
            climbStep.source = usageLoc
            climbStep.definition = definitionLoc
          }

          if (!infoVisible || infoTarget !== target) return

          
          const climbPath = climbDisplaySource(climbStep)
          if (climbPath) climbTree?.setClimbStepSource(climbDepth, climbPath)

          sourceContainer.textContent = ""
          rememberAvailability(composite, usageLoc, definitionLoc)

          
          if (climbPath) {
            appendSourceRow(null, climbPath)
          } else {
            const unavailable = document.createElement("span")
            unavailable.textContent = "Source unavailable"
            unavailable.style.cssText =
              "font-size:12px;color:var(--muted-foreground,#8b949e);opacity:0.6;"
            sourceContainer.appendChild(unavailable)
          }
        } else {
          sourceContainer.textContent = ""
          if (hostSource) {
            appendSourceRow(null, hostSource)
          } else {
            const unavailable = document.createElement("span")
            unavailable.textContent = "Source unavailable"
            unavailable.style.cssText =
              "font-size:12px;color:var(--muted-foreground,#8b949e);opacity:0.6;"
            sourceContainer.appendChild(unavailable)
          }
        }
        reposition()
      } catch {
        if (infoVisible && infoTarget === target) {
          sourceContainer.textContent = "Source unavailable"
        }
      }
    }

    const MAX_LOG_ENTRIES = 40

    let logOptionPress: (() => void) | null = null
    let walkOwnerChain: ((delta: number) => void) | null = null
    let shakeTooltip: (() => void) | null = null

    const syncOptionFromEvent = (
      event: KeyboardEvent | MouseEvent | PointerEvent
    ) => {
      const next = event.altKey
      if (next === optionHeld) return
      const previousLabel = tooltipLabel.textContent ?? ""
      optionHeld = next
      ownerChainDepth = 0
      bustOwnerChainCache()
      if (next) {
        const fiber = hoveredElement ? getFiber(hoveredElement) : null
        const chainLen = fiber ? buildOwnerChain(fiber).length : 0
        
        
        if (chainLen > 0 && previousLabel) {
          pushTooltipUnder(previousLabel)
        } else if (tooltip.style.display !== "none") {
          shakeTooltip?.()
          logEvent("⌥: HTML wrapper or no owner — can't climb")
        }
      } else {
        clearTooltipStack()
      }
      updateOpenHint()
      if (next) logOptionPress?.()
    }

    paintChrome = () => {
      paintTooltipChrome()
      const fiber = hoveredElement ? getFiber(hoveredElement) : null
      const kind = resolveOpenKind(fiber)
      syncDualBadge(fiber)
      syncUsedIcon(kind === "used")
    }

    const updateOpenHint = () => {
      const fiber = hoveredElement ? getFiber(hoveredElement) : null
      const chainLen = fiber ? buildOwnerChain(fiber).length : 0

      if (optionHeld) {
        logHint.textContent =
          chainLen > 0
            ? `usage · ⇧ climb · ${ownerChainDepth + 1}/${chainLen}`
            : `⌥ · can't climb`
      } else {
        logHint.textContent =
          chainLen > 0 ? `hold ⌥ for usage` : `hover · DOM`
      }
      paintChrome?.()
      
      if (hoveredElement && tooltip.style.display !== "none" && fiber) {
        paintTooltipForFiber(fiber)
        rememberHoverTarget(fiber)
      }
    }

    const formatLogTime = () => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, "0")
      const mm = String(now.getMinutes()).padStart(2, "0")
      const ss = String(now.getSeconds()).padStart(2, "0")
      const ms = String(now.getMilliseconds()).padStart(3, "0")
      return `${hh}:${mm}:${ss}.${ms}`
    }

    type LogTarget = { name: string; path: string }

    
    let lastHoverLog: LogTarget | null = null

    const getLogTarget = (fiber: ReactFiber): LogTarget => {
      const kind = resolveOpenKind(fiber)
      return {
        name: getTooltipTitle(fiber, kind) ?? "Component",
        path: getCachedPageName(fiber, kind) ?? "?",
      }
    }

    const logTargetsMatch = (a: LogTarget | null, b: LogTarget) =>
      Boolean(
        a &&
          b &&
          a.name === b.name &&
          a.path &&
          b.path &&
          a.path !== "?" &&
          b.path !== "?" &&
          a.path === b.path
      )

    const logLines: string[] = []

    copyLogsBtn.addEventListener("click", async (event) => {
      event.preventDefault()
      event.stopPropagation()
      try {
        await navigator.clipboard.writeText(logLines.join("\n"))
        copyLogsBtn.textContent = "Copied"
        window.setTimeout(() => {
          copyLogsBtn.textContent = "Copy logs"
        }, 1200)
      } catch {
        copyLogsBtn.textContent = "Copy failed"
        window.setTimeout(() => {
          copyLogsBtn.textContent = "Copy logs"
        }, 1200)
      }
    })

    hideLogBtn.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      setDebugPanelOpen(false)
      logEvent("debug panel hidden")
    })

    debugToggleBtn.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      setDebugPanelOpen(true)
      logEvent("debug panel shown")
    })

    
    const appendLogRow = (
      label: string,
      labelColor: string,
      value: string,
      valueColor: string
    ) => {
      const stamp = formatLogTime()

      const row = document.createElement("div")
      row.style.cssText =
        "display:flex;gap:10px;align-items:baseline;justify-content:space-between"

      const left = document.createElement("div")
      left.style.cssText =
        "flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"

      if (label) {
        const name = document.createElement("span")
        name.textContent = `${label} : `
        name.style.color = labelColor
        left.appendChild(name)
      }

      const body = document.createElement("span")
      body.textContent = value
      body.style.color = valueColor
      left.appendChild(body)

      const time = document.createElement("span")
      time.textContent = stamp
      time.style.cssText = "flex-shrink:0;color:#64748b;opacity:0.7"

      row.append(left, time)
      logEntries.appendChild(row)
      logLines.push(`${stamp}  ${label ? `${label} : ` : ""}${value}`)

      while (logEntries.childElementCount > MAX_LOG_ENTRIES) {
        logEntries.firstElementChild?.remove()
        logLines.shift()
      }
      logEntries.scrollTop = logEntries.scrollHeight
    }

    
    const appendLogSeparator = () => {
      const rule = document.createElement("div")
      rule.style.cssText =
        "margin:6px 0;border-top:1px solid rgba(148,163,184,0.18)"
      logEntries.appendChild(rule)
      while (logEntries.childElementCount > MAX_LOG_ENTRIES) {
        logEntries.firstElementChild?.remove()
      }
      logEntries.scrollTop = logEntries.scrollHeight
    }

    const logEvent = (message: string, tone: "ok" | "error" = "ok") => {
      if (!debug) return
      appendLogRow("", "", message, tone === "ok" ? "#94a3b8" : "#ef4444")
    }

    const logStage = (
      label: string,
      labelColor: string,
      value: string,
      valueColor: string
    ) => {
      if (!debug) return
      appendLogRow(label, labelColor, value, valueColor)
    }

    
    const verifyTally = { match: 0, mismatch: 0, unverifiable: 0 }

    const VERDICT_COLOR = {
      match: "#22c55e",
      mismatch: "#ef4444",
      unverifiable: "#94a3b8",
    } as const

    
    
    const verifyElement = async (element: Element) => {
      const fiber = getFiber(element)
      if (!fiber) return { status: "no-fiber" as const }

      const truth = stampedHostSource(fiber, projectRoot)
      const answer =
        (await resolveHostAuthorSource(
          fiber,
          projectRoot,
          sourceMapCache,
          false
        )) ?? getHostAuthorSource(fiber, projectRoot, false)

      if (!truth) {
        return {
          status: "unscored" as const,
          reason: "no host stamp",
          runtime: answer ? formatPageLabel(answer, projectRoot) : null,
        }
      }

      return {
        status: isSameSourceLine(truth, answer)
          ? ("match" as const)
          : ("mismatch" as const),
        expected: formatPageLabel(truth, projectRoot),
        runtime: answer ? formatPageLabel(answer, projectRoot) : null,
      }
    }

    const scoreClimb = (fiber: ReactFiber, step: OwnerChainStep | null) => {
      if (!verify || !step) return

      const truth = stampedOwnerSource(fiber, projectRoot)
      if (!truth) return

      const answer = getClimbStepDisplaySource(step)
      const ok = isSameSourceLine(truth, answer)

      
      
      
      
      
      
      const intentional =
        !ok && stampedHostSource(fiber, projectRoot) === null

      logStage(
        "climb check",
        "#94a3b8",
        answer
          ? `${formatPageLabel(answer, projectRoot)}${
              ok
                ? ""
                : `  ${intentional ? "·  skipped" : " ≠ "}  ${formatPageLabel(
                    truth,
                    projectRoot
                  )}`
            }`
          : `no answer  ≠  ${formatPageLabel(truth, projectRoot)}`,
        ok ? "#22c55e" : intentional ? "#a855f7" : "#ef4444"
      )

      if (intentional) {
        verifyTally.unverifiable += 1
        return
      }

      
      
      
      verifyTally[ok ? "match" : "mismatch"] += 1
      const scored = verifyTally.match + verifyTally.mismatch
      const rate = Math.round((verifyTally.match / scored) * 100)
      logStage(
        "match",
        ok ? "#22c55e" : "#ef4444",
        `${rate}%  (${verifyTally.match}/${scored}${
          verifyTally.unverifiable
            ? `, ${verifyTally.unverifiable} unscored`
            : ""
        })`,
        ok ? "#22c55e" : "#ef4444"
      )
    }

    const scoreHover = (fiber: ReactFiber, target: Element) => {
      if (!verify) return

      const truth = readGroundTruthStamp(fiber, projectRoot)
      
      
      const blindSync = getHostAuthorSource(fiber, projectRoot, false)

      const settle = (
        verdict: "match" | "mismatch" | "unverifiable",
        found: string
      ) => {
        verifyTally[verdict] += 1
        const scored = verifyTally.match + verifyTally.mismatch
        const rate =
          scored === 0 ? 100 : Math.round((verifyTally.match / scored) * 100)

        const MUTED = "#94a3b8"
        const verdictColor =
          verdict === "match"
            ? "#22c55e"
            : verdict === "mismatch"
              ? "#ef4444"
              : MUTED

        
        
        logStage("run time check", MUTED, found, MUTED)
        logStage(
          "stamp check",
          MUTED,
          truth ? formatPageLabel(truth, projectRoot) : "no host stamp",
          MUTED
        )
        logStage(
          "match",
          verdictColor,
          `${rate}%  (${verifyTally.match}/${scored}${
            verifyTally.unverifiable
              ? `, ${verifyTally.unverifiable} unscored`
              : ""
          })`,
          verdictColor
        )
        appendLogSeparator()

        
        if (hoveredElement !== target) return
        const color = VERDICT_COLOR[verdict]
        overlay.style.borderColor = color
        overlay.style.backgroundColor = `${color}22`
      }

      if (!truth) {
        
        
        
        
        
        void resolveHostAuthorSource(fiber, projectRoot, sourceMapCache, false)
          .then((refined) => {
            const found = refined ?? blindSync
            settle(
              "unverifiable",
              found ? formatPageLabel(found, projectRoot) : "no answer"
            )
            
            
            
            
            const owner = stampedOwnerSource(fiber, projectRoot)
            if (owner) {
              logStage(
                "  owner stamp",
                "#94a3b8",
                formatPageLabel(owner, projectRoot),
                "#94a3b8"
              )
            }
          })
          .catch(() => settle("unverifiable", "no answer"))
        return
      }

      if (isSameSourceLine(truth, blindSync)) {
        settle("match", `found instantly · ${formatPageLabel(truth, projectRoot)}`)
        return
      }

      
      
      
      
      void resolveHostAuthorSource(fiber, projectRoot, sourceMapCache, false)
        .then((refined) => {
          if (isSameSourceLine(truth, refined)) {
            settle(
              "match",
              `found after lookup · ${formatPageLabel(truth, projectRoot)}`
            )
            return
          }
          settle(
            "mismatch",
            refined ? formatPageLabel(refined, projectRoot) : "no answer"
          )
        })
        .catch(() => {
          settle("mismatch", "threw")
        })
    }

    const logHoverTarget = (fiber: ReactFiber) => {
      const target = getLogTarget(fiber)
      lastHoverLog = target
      const kind = resolveOpenKind(fiber)
      const tag =
        kind === "used"
          ? formatComponentTag(target.name)
          : formatDomTag(target.name)
      logEvent(`hover: ${tag} ; ${target.path}`)
    }

    const rememberHoverTarget = (fiber: ReactFiber) => {
      lastHoverLog = getLogTarget(fiber)
    }

    const refineClimbStep = async (step: OwnerChainStep) => {
      
      
      
      
      
      
      
      
      
      if (!step.debugInfo) {
        
        
        
        
        
        
        
        
        
        let carrier: ReactFiber | null = step.parentFiber
        let hops = 0

        while (carrier && hops < 8) {
          hops += 1
          const entries = carrier._debugInfo
          if (entries?.length) {
            for (let i = entries.length - 1; i >= 0; i -= 1) {
              const info = entries[i]
              if (!info?.name) continue
              
              
              
              
              
              
              if (info.name !== step.name) continue
              const pair = await resolveDebugInfoPair(
                info,
                projectRoot,
                sourceMapCache
              )
              if (
                pair.source &&
                !isBundledOrExternalPath(pair.source.filePath)
              ) {
                step.source = pair.source
                if (pair.renderedBy) step.definition = pair.renderedBy
                return
              }
            }
          }
          carrier = carrier._debugOwner ?? null
        }
      }

      if (step.debugInfo) {
        const pair = await resolveDebugInfoPair(
          step.debugInfo,
          projectRoot,
          sourceMapCache
        )
        if (pair.source) step.source = pair.source
        if (pair.renderedBy) step.definition = pair.renderedBy
        return
      }
      
      
      
      
      
      
      
      
      
      const ownCreation = await resolveFirstMappedFrame(
        getOwnStackFrames(step.parentFiber),
        projectRoot,
        sourceMapCache,
        getComponentName(step.parentFiber)
      )
      if (ownCreation && !isBundledOrExternalPath(ownCreation.filePath)) {
        step.source = ownCreation
        return
      }

      if (!step.source) {
        const stepUsage = await getInstanceSource(step.parentFiber)
        if (stepUsage && !isBundledOrExternalPath(stepUsage.filePath)) {
          step.source = stepUsage
        }
      }
      if (!step.definition) {
        const stepDef = await getSource(step.parentFiber)
        if (stepDef && !isBundledOrExternalPath(stepDef.filePath)) {
          step.definition = stepDef
        }
      }
    }

    logOptionPress = () => {
      if (!hoveredElement) return
      const fiber = getFiber(hoveredElement)
      if (!fiber) return
      const target = getLogTarget(fiber)
      lastHoverLog = target
      const chain = buildOwnerChain(fiber)
      const chainLabel =
        chain.length > 0
          ? chain.map((step) => step.name).join(" → ")
          : "—"
      logEvent(
        `⌥ hold: ${formatComponentTag(target.name)} ; ${target.path} · chain ${chain.length}: ${chainLabel}`
      )
      
      const step = chain[ownerChainDepth]
      if (!step) return
      const depthAtRequest = ownerChainDepth
      void refineClimbStep(step).then(() => {
        if (!optionHeld || ownerChainDepth !== depthAtRequest) return
        const display = climbDisplaySource(step)
        if (!display) return
        const path = formatPageLabel(display, projectRoot)
        lastHoverLog = { name: step.name, path }
        paintTooltipForFiber(fiber)
        logEvent(
          `⌥ path: ${formatComponentTag(step.name)} ; ${path} (rendered by)`
        )
        scoreClimb(fiber, step)
      })
    }

    walkOwnerChain = (delta: number) => {
      if (!canShowTooltipStack()) return
      const fiber = getFiber(hoveredElement!)
      if (!fiber) return
      const chain = buildOwnerChain(fiber)
      if (chain.length === 0) {
        shakeTooltip?.()
        logEvent("⇧: can't climb")
        return
      }

      
      if (delta <= 0) return

      const next = Math.min(chain.length - 1, ownerChainDepth + delta)
      if (next === ownerChainDepth) {
        shakeTooltip?.()
        logEvent("⇧: top of tree")
        return
      }

      const currentLabel = tooltipLabel.textContent
      if (currentLabel) pushTooltipUnder(currentLabel)

      ownerChainDepth = next
      paintTooltipForFiber(fiber)
      const step = chain[ownerChainDepth]
      const syncDisplay = climbDisplaySource(step)
      const syncPath = syncDisplay
        ? formatPageLabel(syncDisplay, projectRoot)
        : null
      
      lastHoverLog = { name: step.name, path: syncPath ?? "" }
      logEvent(
        `⇧ climb: ${formatComponentTag(step.name)} ; ${syncPath ?? "…"} · ${ownerChainDepth + 1}/${chain.length}`
      )
      updateOpenHint()

      
      const depthAtRequest = ownerChainDepth
      void refineClimbStep(step).then(() => {
        const display = climbDisplaySource(step)
        if (!optionHeld || ownerChainDepth !== depthAtRequest || !display) {
          return
        }
        if (isBundledOrExternalPath(display.filePath)) return
        const path = formatPageLabel(display, projectRoot)
        lastHoverLog = { name: step.name, path }
        paintTooltipForFiber(fiber)
        logEvent(`⇧ path: ${formatComponentTag(step.name)} ; ${path}`)
      })
    }

    if (debug) {
      syncDebugPanelVisibility()
      updateOpenHint()
      logEvent("debug panel ready")
    }

    
    let shakeAnimation: Animation | null = null
    const shakeKeyframes = (prefersReducedMotion: boolean): Keyframe[] =>
      prefersReducedMotion
        ? [{ opacity: "1" }, { opacity: "0.45" }, { opacity: "1" }]
        : [
            { transform: "translateX(0)" },
            { transform: "translateX(-4px)" },
            { transform: "translateX(4px)" },
            { transform: "translateX(-2px)" },
            { transform: "translateX(3px)" },
            { transform: "translateX(0)" },
          ]

    const shakeOverlay = () => {
      if (overlay.style.display === "none") return
      shakeAnimation?.cancel()
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      shakeAnimation = overlay.animate(shakeKeyframes(prefersReducedMotion), {
        duration: prefersReducedMotion ? 160 : 260,
        easing: "ease-out",
      })
    }

    shakeTooltip = () => {
      if (tooltip.style.display === "none") return
      shakeAnimation?.cancel()
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      shakeAnimation = tooltip.animate(shakeKeyframes(prefersReducedMotion), {
        duration: prefersReducedMotion ? 160 : 260,
        easing: "ease-out",
      })
    }

    const hide = () => {
      inspectGeneration += 1
      hoveredElement = null
      pendingClickElement = null
      lastTargetRect = null
      lastHoverLog = null
      ownerChainDepth = 0
      clearTooltipStack()
      pointerPinned = false
      treeNavStack = []
      overlay.style.display = "none"
      tooltip.style.display = "none"
      hideInfo()
      document.body.style.cursor = isActive ? "crosshair" : previousCursor
    }

    const deactivate = () => {
      isActive = false
      optionHeld = false
      ownerChainDepth = 0
      clearTooltipStack()
      hide()
      updateOpenHint()
    }

    const getSource = (fiber: ReactFiber) => {
      let sourcePromise = sourceCache.get(fiber)

      if (!sourcePromise) {
        sourcePromise = resolveSource(fiber, projectRoot, sourceMapCache)
        sourceCache.set(fiber, sourcePromise)
      }

      return sourcePromise
    }

    const getInstanceSource = (fiber: ReactFiber) => {
      let sourcePromise = instanceSourceCache.get(fiber)

      if (!sourcePromise) {
        sourcePromise = resolveInstanceSource(fiber, projectRoot, sourceMapCache)
        instanceSourceCache.set(fiber, sourcePromise)
      }

      return sourcePromise
    }

    const inspect = async (
      target: Element,
      fiber: ReactFiber,
      generation: number
    ) => {
      try {
        
        const [hostSource, definition, usage] = await Promise.all([
          resolveHostAuthorSource(fiber, projectRoot, sourceMapCache),
          getSource(fiber),
          getInstanceSource(fiber),
        ])

        if (generation !== inspectGeneration || hoveredElement !== target) {
          return
        }

        if (hostSource) {
          instantHostPathCache.set(
            fiber,
            formatPageLabel(hostSource, projectRoot)
          )
        } else {
          instantHostPathCache.delete(fiber)
        }
        if (definition) {
          instantDefinedPathCache.set(
            fiber,
            formatPageLabel(definition, projectRoot)
          )
        } else {
          instantDefinedPathCache.delete(fiber)
        }
        if (usage) {
          instantUsedPathCache.set(fiber, formatPageLabel(usage, projectRoot))
        } else {
          instantUsedPathCache.delete(fiber)
        }
        rememberAvailability(fiber, usage, definition)

        
        const chain = buildOwnerChain(fiber)
        await Promise.all(chain.map((step) => refineClimbStep(step)))

        if (generation !== inspectGeneration || hoveredElement !== target) {
          return
        }

        if (!hostSource && !definition && !usage && chain.every((s) => !s.source)) {
          setTooltipLabel("Source unavailable")
          syncDualBadge(fiber)
          if (lastTargetRect) positionTooltip(lastTargetRect)
          return
        }

        paintTooltipForFiber(fiber)
        rememberHoverTarget(fiber)
      } catch {
        if (generation === inspectGeneration && hoveredElement === target) {
          setTooltipLabel("Source unavailable")
          if (lastTargetRect) positionTooltip(lastTargetRect)
        }
      }
    }

    
    const highlightTarget = (target: Element, exact = false) => {
      const resolved = exact ? target : resolveInspectElement(target)
      if (isInspectorChrome(resolved)) return false

      const fiber = getFiber(resolved)
      if (!fiber) {
        hide()
        return false
      }

      const hasTargetChanged = hoveredElement !== resolved
      hoveredElement = resolved

      const rect = expandRectWithPadding(resolved.getBoundingClientRect(), {
        left: settings.devSpotlightProps.paddingX,
        right: settings.devSpotlightProps.paddingX,
        top: settings.devSpotlightProps.paddingY,
        bottom: settings.devSpotlightProps.paddingY,
      })
      lastTargetRect = rect
      const wasHidden = overlay.style.display === "none"
      const paint = getOverlayPaint(settings)

      
      
      
      if (wasHidden) {
        overlay.style.transition = "none"
        tooltip.style.transition = "none"
      }

      overlay.style.display = "block"
      overlay.style.left = `${rect.left}px`
      overlay.style.top = `${rect.top}px`
      overlay.style.width = `${rect.width}px`
      overlay.style.height = `${rect.height}px`

      tooltip.style.display = "flex"

      if (hasTargetChanged) {
        ownerChainDepth = 0
        bustOwnerChainCache()
        clearTooltipStack()
        infoClimbSelection = null
        
        paintTooltipForFiber(fiber)
        if (!verify) logHoverTarget(fiber)
        scoreHover(fiber, resolved)

        
        const generation = (inspectGeneration += 1)
        void inspect(resolved, fiber, generation)

        
        if (infoVisible) {
          infoTarget = resolved
          void renderInfo(resolved, fiber)
        }
      }

      positionTooltip(rect)

      if (infoVisible && !hasTargetChanged && lastTargetRect) {
        positionInfo(lastTargetRect)
      }

      
      if (wasHidden && settings.devSpotlightProps.animated) {
        void overlay.offsetWidth
        overlay.style.transition = paint.transition
        tooltip.style.transition = paint.tooltipTransition
      }

      return true
    }

    const SCROLL_MARGIN = 64

    const isElementInViewport = (element: Element) => {
      const rect = element.getBoundingClientRect()
      return (
        rect.bottom > SCROLL_MARGIN &&
        rect.right > SCROLL_MARGIN &&
        rect.top < window.innerHeight - SCROLL_MARGIN &&
        rect.left < window.innerWidth - SCROLL_MARGIN
      )
    }

    
    
    
    const revealAndHighlight = (element: Element, exact = false) => {
      if (!isElementInViewport(element)) {
        const html =
          element instanceof HTMLElement ? element : null
        const previousMargin = html?.style.scrollMargin ?? ""
        if (html) html.style.scrollMargin = `${SCROLL_MARGIN}px`
        element.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "instant",
        })
        if (html) html.style.scrollMargin = previousMargin
      }

      const ok = highlightTarget(element, exact)
      if (ok && hoveredElement) {
        const rect = hoveredElement.getBoundingClientRect()
        pinnedPointerX = rect.left + rect.width / 2
        pinnedPointerY = rect.top + rect.height / 2
      }
      return ok
    }

    onSettingsChanged = () => {
      if (hoveredElement) highlightTarget(hoveredElement)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isActive) return
      syncOptionFromEvent(event)

      
      
      if (infoVisible) return

      if (pointerPinned) {
        const dx = event.clientX - pinnedPointerX
        const dy = event.clientY - pinnedPointerY
        if (dx * dx + dy * dy < 16) return
        pointerPinned = false
        treeNavStack = []
      }

      pinnedPointerX = event.clientX
      pinnedPointerY = event.clientY

      const target = document.elementFromPoint(event.clientX, event.clientY)

      if (!target || isInspectorChrome(target)) return

      
      
      
      if (hoveredElement && lastTargetRect && isPointInRect(event.clientX, event.clientY, lastTargetRect)) {
        const resolved = resolveInspectElement(target)
        if (
          resolved !== hoveredElement &&
          !hoveredElement.contains(resolved)
        ) {
          return
        }
      }

      highlightTarget(target)
    }

    
    const openSource = async (fiber: ReactFiber) => {
      try {
        const kind = resolveOpenKind(fiber)
        const chainStep = kind === "used" ? getActiveChainStep(fiber) : null

        let openSourceLoc: SourceLocation | null = null
        let openName =
          getTooltipTitle(fiber, kind) ??
          getDomHoverName(fiber) ??
          getComponentName(fiber) ??
          "element"

        if (chainStep) {
          openName = chainStep.name

          if (chainStep.debugInfo) {
            const pair = await resolveDebugInfoPair(
              chainStep.debugInfo,
              projectRoot,
              sourceMapCache
            )
            
            
            chainStep.source = pair.source ?? chainStep.source
            chainStep.definition = pair.renderedBy ?? chainStep.definition
            openSourceLoc = getClimbOpenSource(chainStep)
          } else {
            if (!chainStep.definition) {
              chainStep.definition = await getSource(chainStep.parentFiber)
            }
            if (!chainStep.source) {
              chainStep.source = await getInstanceSource(chainStep.parentFiber)
            }
            openSourceLoc = getClimbOpenSource(chainStep)
          }

          if (
            openSourceLoc &&
            isBundledOrExternalPath(openSourceLoc.filePath)
          ) {
            openSourceLoc = null
          }
        } else {
          openSourceLoc =
            (await resolveHostAuthorSource(
              fiber,
              projectRoot,
              sourceMapCache
            )) ?? getHostAuthorSource(fiber, projectRoot)
        }

        if (openSourceLoc) {
          const opened: LogTarget = {
            name: openName,
            path: formatPageLabel(openSourceLoc, projectRoot),
          }
          const tag =
            kind === "used"
              ? formatComponentTag(opened.name)
              : formatDomTag(opened.name)
          logEvent(
            `open${resolveUsesStamps ? " (stamped)" : ""}: ${tag} ; ${opened.path}`,
            logTargetsMatch(lastHoverLog, opened) ? "ok" : "error"
          )
          openInEditor(openSourceLoc, settings.ide)
          if (kind === "used") paintTooltipForFiber(fiber)
        } else {
          
          
          
          const hostElement =
            fiber.stateNode instanceof Element ? fiber.stateNode : hoveredElement
          const nearest = hostElement
            ? await resolveNearestAncestorSource(
                hostElement,
                projectRoot,
                sourceMapCache
              )
            : null

          if (nearest) {
            const nearestTag = getDomHoverName(getFiber(nearest.element)) ?? "?"
            logEvent(
              `open (nearest ${formatDomTag(nearestTag)}): ${formatPageLabel(
                nearest.source,
                projectRoot
              )}`
            )
            openInEditor(nearest.source, settings.ide)
          } else {
            tooltip.style.display = "flex"
            setTooltipLabel(
              chainStep
                ? `No accurate source for ${formatComponentTag(chainStep.name)}`
                : "Could not resolve source"
            )
            logEvent(
              chainStep
                ? `open: ${formatComponentTag(chainStep.name)} ; unavailable`
                : "open: source unavailable",
              "error"
            )
          }
        }
      } catch {
        tooltip.style.display = "flex"
        setTooltipLabel("Could not resolve source")
        logEvent("open: source unavailable", "error")
      }
    }

    const warmOpenSource = (fiber: ReactFiber) => {
      void resolveHostAuthorSource(fiber, projectRoot, sourceMapCache)
      const step = optionHeld ? getActiveChainStep(fiber) : null
      if (step) void getInstanceSource(step.parentFiber)
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!isActive || infoVisible) return
      syncOptionFromEvent(event)
      const hit = document.elementFromPoint(event.clientX, event.clientY)
      if (hit && isInspectorChrome(hit)) return
      pendingClickElement = hoveredElement
      
      
      if (pendingClickElement) {
        const fiber = getFiber(pendingClickElement)
        if (fiber) warmOpenSource(fiber)
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (!isActive) return

      
      
      const clicked = document.elementFromPoint(event.clientX, event.clientY)
      if (clicked && isInspectorChrome(clicked)) return

      
      event.preventDefault()
      event.stopPropagation()

      
      
      if (infoVisible) return

      const target = pendingClickElement ?? hoveredElement ?? clicked
      pendingClickElement = null
      const fiber = target ? getFiber(target) : null
      if (!fiber || !target) return

      syncOptionFromEvent(event)
      void openSource(fiber)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesInspectorShortcut(event, settings.shortcut)) {
        event.preventDefault()
        isActive = !isActive

        if (isActive) {
          document.body.style.cursor = "crosshair"
          syncOptionFromEvent(event)
          updateOpenHint()
          syncOpenModeVisibility()
      logEvent("inspect mode on")
        } else {
          logEvent("inspect mode off")
          deactivate()
        }
        return
      }

      if (!isActive) return

      syncOptionFromEvent(event)

      if (event.key === "Escape") {
        logEvent("user pressed escape")
        deactivate()
        return
      }

      
      const isWalkUp =
        event.key === "Shift" ||
        event.code === "ShiftLeft" ||
        event.code === "ShiftRight"
      if (optionHeld && !event.metaKey && isWalkUp) {
        event.preventDefault()
        event.stopPropagation()
        if (event.repeat) return
        walkOwnerChain?.(1)
        return
      }

      
      if (event.key === "Enter") {
        if (!hoveredElement) return
        const fiber = getFiber(hoveredElement)
        if (!fiber) return
        event.preventDefault()
        event.stopPropagation()
        void openSource(fiber)
        return
      }

      
      
      if (event.code === "KeyI" || event.key === "i" || event.key === "I") {
        if (!hoveredElement) return
        event.preventDefault()

        if (infoVisible && infoTarget === hoveredElement) {
          logEvent("user closed info")
          hideInfo()
          return
        }

        const fiber = getFiber(hoveredElement)
        if (!fiber) return

        
        const liveStep = optionHeld ? getActiveChainStep(fiber) : null
        infoClimbSelection = liveStep
          ? { depth: ownerChainDepth, step: liveStep }
          : null

        infoVisible = true
        infoTarget = hoveredElement
        
        document.body.style.cursor = "crosshair"
        logEvent(
          infoClimbSelection
            ? `user opened info · climb ${formatComponentTag(infoClimbSelection.step.name)}`
            : "user opened info · dom"
        )
        void renderInfo(hoveredElement, fiber)
        return
      }

      
      
      const isMod = event.metaKey || event.ctrlKey

      
      if (event.altKey && !isMod) {
        const isPadGrow =
          event.code === "Equal" ||
          event.key === "=" ||
          event.key === "+"
        const isPadShrink =
          event.code === "Minus" ||
          event.key === "-" ||
          event.key === "_"

        if (isPadGrow || isPadShrink) {
          event.preventDefault()
          event.stopPropagation()

          const delta = isPadGrow ? 4 : -4
          const { paddingX, paddingY } = settings.devSpotlightProps
          const nextX = Math.min(
            PADDING_MAX,
            Math.max(PADDING_MIN, paddingX + delta)
          )
          const nextY = Math.min(
            PADDING_MAX,
            Math.max(PADDING_MIN, paddingY + delta)
          )

          setDevSpotlightProps({ paddingX: nextX, paddingY: nextY })
          settings = getInspectorSettings()
          logEvent(
            isPadGrow
              ? `user grew padding ${nextX} · ${nextY}`
              : `user shrank padding ${nextX} · ${nextY}`
          )

          if (hoveredElement) {
            highlightTarget(hoveredElement)
            tooltip.style.display = "flex"
            setTooltipLabel(`padding ${nextX} · ${nextY}`)
            if (lastTargetRect) positionTooltip(lastTargetRect)
          }
          return
        }
      }

      
      
      const isBracketLeft = event.key === "["
      const isBracketRight = event.key === "]"
      if ((isBracketLeft || isBracketRight) && !isMod && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()

        const treeAction = isBracketLeft ? "parent" : "child"
        if (!hoveredElement) {
          shakeOverlay()
          logEvent(`press ${treeAction} → overlay shook`)
          return
        }
        const from = hoveredElement
        let next: Element | null = null

        if (isBracketLeft) {
          next = findParentInspectable(from)
          if (next) treeNavStack.push(from)
        } else {
          while (treeNavStack.length > 0) {
            const candidate = treeNavStack[treeNavStack.length - 1]!
            if (
              candidate.isConnected &&
              from.contains(candidate) &&
              candidate !== from
            ) {
              treeNavStack.pop()
              next = candidate
              break
            }
            treeNavStack.pop()
          }
          if (!next) {
            
            let resolvedChild: Element | null = null
            findChildInspectableWhere(from, (candidate) => {
              const resolved = resolveInspectElement(candidate)
              if (resolved !== from && from.contains(resolved)) {
                resolvedChild = resolved
                return true
              }
              return false
            })
            next = resolvedChild ?? findChildInspectable(from)
          }
        }

        
        if (!next || next === from) {
          shakeOverlay()
          logEvent(`press ${treeAction} → overlay shook`)
          return
        }

        pointerPinned = true
        
        const ok = revealAndHighlight(next, true)
        if (ok && hoveredElement !== from) {
          logEvent(`press ${treeAction} → overlay moved ${treeAction}`)
        } else if (ok) {
          
          if (isBracketLeft && treeNavStack[treeNavStack.length - 1] === from) {
            treeNavStack.pop()
          }
          shakeOverlay()
          logEvent(`press ${treeAction} → overlay shook`)
        } else {
          
          if (isBracketLeft && treeNavStack[treeNavStack.length - 1] === from) {
            treeNavStack.pop()
          }
          shakeOverlay()
          logEvent(
            `press ${treeAction} → mismatch: next found but overlay didn't move`,
            "error"
          )
        }
        return
      }

      if (isMod) {
        const isPadReset =
          event.code === "Backslash" || event.key === "\\"

        
        if (isPadReset) {
          event.preventDefault()
          event.stopPropagation()

          const nextX = DEFAULT_DEV_SPOTLIGHT_PROPS.paddingX
          const nextY = DEFAULT_DEV_SPOTLIGHT_PROPS.paddingY
          setDevSpotlightProps({ paddingX: nextX, paddingY: nextY })
          settings = getInspectorSettings()
          logEvent(`user reset padding ${nextX} · ${nextY}`)

          if (hoveredElement) {
            highlightTarget(hoveredElement)
            tooltip.style.display = "flex"
            setTooltipLabel(`padding reset ${nextX} · ${nextY}`)
            if (lastTargetRect) positionTooltip(lastTargetRect)
          }
          return
        }
      }

      if (
        event.key !== "ArrowUp" &&
        event.key !== "ArrowDown" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight"
      ) {
        return
      }

      
      
      event.preventDefault()
      event.stopPropagation()

      const direction = event.key.replace("Arrow", "").toLowerCase()
      const isModArrow = event.metaKey || event.ctrlKey
      const pressLabel = isModArrow ? `⌘${direction}` : direction

      if (!hoveredElement) {
        shakeOverlay()
        logEvent(`press ${pressLabel} → overlay shook`)
        return
      }

      
      let next: Element | null = null
      const isPrev =
        event.key === "ArrowUp" || event.key === "ArrowLeft"
      const isNext =
        event.key === "ArrowDown" || event.key === "ArrowRight"

      if (isPrev) {
        next = isModArrow
          ? findEdgeSiblingInspectable(hoveredElement, "first")
          : findSiblingInspectable(hoveredElement, "prev")
      } else if (isNext) {
        next = isModArrow
          ? findEdgeSiblingInspectable(hoveredElement, "last")
          : findSiblingInspectable(hoveredElement, "next")
      }

      const from = hoveredElement
      
      if (!next || next === from) {
        shakeOverlay()
        logEvent(`press ${pressLabel} → overlay shook`)
        return
      }

      pointerPinned = true
      const ok = revealAndHighlight(next)
      if (ok && hoveredElement !== from) {
        
        treeNavStack = []
        logEvent(`press ${pressLabel} → overlay moved ${direction}`)
      } else if (ok) {
        shakeOverlay()
        logEvent(`press ${pressLabel} → overlay shook`)
      } else {
        
        shakeOverlay()
        logEvent(
          `press ${pressLabel} → mismatch: next found but overlay didn't move`,
          "error"
        )
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isActive) return
      syncOptionFromEvent(event)
    }

    
    
    
    
    const handleScroll = () => {
      if (!isActive) return

      if (infoVisible) {
        if (infoTarget) highlightTarget(infoTarget)
        return
      }

      if (pointerPinned && hoveredElement) {
        highlightTarget(hoveredElement)
        return
      }

      const target = document.elementFromPoint(pinnedPointerX, pinnedPointerY)
      if (target && !isInspectorChrome(target)) {
        highlightTarget(target)
      } else {
        hide()
      }
    }

    if (verify) {
      ;(window as unknown as Record<string, unknown>).__inspectUIVerify =
        verifyElement
    }

    document.addEventListener("pointermove", handlePointerMove, true)
    document.addEventListener("pointerdown", handlePointerDown, true)
    document.addEventListener("click", handleClick, true)
    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("keyup", handleKeyUp, true)
    window.addEventListener("blur", deactivate)
    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    })

    return () => {
      unsubscribe()
      document.removeEventListener("pointermove", handlePointerMove, true)
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("keyup", handleKeyUp, true)
      window.removeEventListener("blur", deactivate)
      window.removeEventListener("scroll", handleScroll, { capture: true })
      delete (window as unknown as Record<string, unknown>).__inspectUIVerify
      overlay.remove()
      tooltip.remove()
      info.remove()
      logPanel.remove()
      debugToggleBtn.remove()
      document.body.style.cursor = previousCursor
    }
  }, [projectRoot, debug])

  return null
}
