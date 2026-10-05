/** Browser-safe React development stack reader. Reads metadata without invoking application components. */
export type FiberStackFrame = {
  file: string
  methodName: string
  line1: number
  column1: number
  enclosingLine?: number
  enclosingColumn?: number
}

type CallSite = {
  getScriptNameOrSourceURL?(): string | null
  getFunctionName?(): string | null
  getMethodName?(): string | null
  getLineNumber?(): number | null
  getColumnNumber?(): number | null
  getEnclosingLineNumber?(): number | null
  getEnclosingColumnNumber?(): number | null
  toString(): string
}
type StackErrorConstructor = ErrorConstructor & {
  prepareStackTrace?: (error: Error, sites: CallSite[]) => unknown
}
const cache = new WeakMap<Error, FiberStackFrame[]>()
const internal = /(?:node_modules|react-dom|jsxDEV|fakeJSXCallSite|react-stack|react_stack_bottom_frame)/

export const readFiberStack = (stack: Error | string | undefined): FiberStackFrame[] => {
  if (!stack) return []
  if (typeof stack === "object") {
    const cached = cache.get(stack)
    if (cached) return cached
  }
  let structured: FiberStackFrame[] | undefined
  const constructor = Error as StackErrorConstructor
  const previous = constructor.prepareStackTrace
  let value: unknown
  try {
    // V8 provides enclosing function locations before .stack is materialized.
    // Other engines and already formatted Errors use the string parser below.
    if (typeof stack !== "string") constructor.prepareStackTrace = (error, sites) => {
      structured = []
      for (const site of sites) {
        const methodName = site.getFunctionName?.() ?? site.getMethodName?.() ?? "<unknown>"
        if (/react[-_]stack[-_]bottom[-_]frame/.test(methodName)) break
        const file = site.getScriptNameOrSourceURL?.()
        if (!file || internal.test(`${methodName} ${file}`)) continue
        structured.push({ file, methodName, line1: site.getLineNumber?.() ?? 1,
          column1: site.getColumnNumber?.() ?? 1,
          enclosingLine: site.getEnclosingLineNumber?.() ?? undefined,
          enclosingColumn: site.getEnclosingColumnNumber?.() ?? undefined })
      }
      return `${error.name}: ${error.message}\n${sites.map(site => `    at ${site.toString()}`).join("\n")}`
    }
    value = typeof stack === "string" ? stack : stack.stack
  } catch { return [] } finally { constructor.prepareStackTrace = previous }
  const frames = structured ?? parseFiberStack(typeof value === "string" ? value : "")
  if (typeof stack === "object") cache.set(stack, frames)
  return frames
}

export const parseFiberStack = (stack: string): FiberStackFrame[] => {
  const frames: FiberStackFrame[] = []
  for (const line of stack.split("\n")) {
    if (/react[-_]stack[-_]bottom[-_]frame/.test(line)) break
    if (internal.test(line)) continue
    // V8: at Component (url:line:column); Firefox/Safari: Component@url:line:column.
    const match = line.trim().match(/^(?:at\s+)?(?:(.*?)\s*\(|(.*?)@)?(.+?):(\d+):(\d+)\)?$/)
    if (!match) continue
    frames.push({ methodName: match[1] || match[2] || "<unknown>", file: match[3],
      line1: Number(match[4]), column1: Number(match[5]) })
  }
  return frames
}

export type StackFiber = {
  _debugStack?: Error | string
  _debugOwner?: StackFiber | null
  child?: StackFiber | null
  sibling?: StackFiber | null
  alternate?: StackFiber | null
}

/** A child created by this component carries a frame inside its function body. */
export const readDefinitionStack = (fiber: StackFiber): FiberStackFrame[] => {
  const pending = fiber.child ? [fiber.child] : []
  const seen = new Set<StackFiber>([fiber])
  while (pending.length) {
    const child = pending.pop()!
    if (seen.has(child)) continue
    seen.add(child)
    if (child._debugOwner === fiber || (fiber.alternate && child._debugOwner === fiber.alternate)) {
      const frames = readFiberStack(child._debugStack)
      if (frames.length) return [...frames].reverse().map(frame => ({ ...frame,
        line1: frame.enclosingLine ?? frame.line1, column1: frame.enclosingColumn ?? frame.column1 }))
    }
    if (child.sibling) pending.push(child.sibling)
    if (child.child) pending.push(child.child)
  }
  return []
}
