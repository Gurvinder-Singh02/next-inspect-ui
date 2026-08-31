import { isInspectorChrome } from "../lib/inspector-nav"
import { INSPECTOR_IDES, type InspectorIde } from "../lib/inspector-settings"
import { readHostStamp } from "../lib/inspector-stamp"
import {
  isBundledOrExternalPath,
  isLikelySourceFile,
  normalizeSourceLocation,
  pickDefinedSource,
  pickOpenSource,
  pickPreferredStackSource,
  sourceFromFiberDebugSource,
  toAbsolutePath,
  type FiberDebugSource,
  type NamedSourceFrame,
  type SourceLocation,
} from "../lib/inspector-source"

import {
  getComponentName,
  getDebugInfoFrames,
  getDebugSourceUntil,
  getFiber,
  getNamedTarget,
  getOwnStackFrames,
  getStackFrames,
  type ReactFiber,
  type ServerDebugInfo,
  type StackFrame,
} from "./fiber"

export type SourceMapData = {
  mappings: string
  sourceRoot?: string
  sources: string[]
}

export type SourceMapSection = {
  offset: {
    line: number
    column: number
  }
  map: SourceMapData
}

export type SourceMap = SourceMapData & {
  sections?: SourceMapSection[]
}

export type OriginalFrameResult =
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

export const findNearestAuthorCallSiteSync = (
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

export const findNearestAuthorCallSite = async (
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

export const finalizeHostAuthorSource = (
  fiber: ReactFiber,
  candidate: SourceLocation | null,
  projectRoot: string
): SourceLocation | null =>
  candidate ?? findNearestAuthorCallSiteSync(fiber, projectRoot)

export const readStampedHostSource = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => {
  const node = fiber.stateNode
  // Duck-type: Node tests and some hosts are not `instanceof Element`.
  if (
    typeof node !== "object" ||
    node === null ||
    typeof (node as Element).getAttribute !== "function"
  ) {
    return null
  }
  return normalizeSourceLocation(readHostStamp(node as Element, projectRoot))
}

export const getHostAuthorSource = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => {
  // Presence of data-inspect-host is the switch. No session flag.
  const stamped = readStampedHostSource(fiber, projectRoot)
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

export const decodeOriginalPosition = (
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

export const getSourceMapSection = (
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

export const resolveServerStackFrame = async (
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

export const resolveFiberDebugSource = async (
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

export const resolveStackFrame = async (
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

export const resolveHostAuthorSource = async (
  fiber: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>
): Promise<SourceLocation | null> => {
  const stamped = readStampedHostSource(fiber, projectRoot)
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
