import type { ReactFiber, SourceLocation } from "./engine.ts"

const revisionOf = (fiber: ReactFiber) => [
  fiber.type, fiber.tag, fiber.return, fiber._debugOwner, fiber._debugStack,
  fiber._debugInfo, fiber._debugSource?.fileName,
  fiber._debugSource?.lineNumber, fiber._debugSource?.columnNumber,
]

/** Cache source work for unchanged fibers, sharing pending requests and retrying failures. */
export const createFiberSourceCache = () => {
  const entries = new WeakMap<ReactFiber, { revision: unknown[]; promise: Promise<SourceLocation | null> }>()
  return (fiber: ReactFiber, resolve: () => Promise<SourceLocation | null>) => {
    const revision = revisionOf(fiber)
    const cached = entries.get(fiber)
    if (cached && revision.every((value, index) => value === cached.revision[index])) return cached.promise
    const promise = Promise.resolve().then(resolve)
    const entry = { revision, promise }
    entries.set(fiber, entry)
    const evict = () => { if (entries.get(fiber) === entry) entries.delete(fiber) }
    void promise.then(source => { if (!source) evict() }, evict)
    return promise
  }
}
