import * as React from "react"
import { readFiberStack, type FiberStackFrame } from "./fiber-stack.ts"

type Component = ((...args: unknown[]) => unknown) & {
  prototype?: { isReactComponent?: unknown }
}
const frames = new WeakMap<Component, FiberStackFrame[]>()
let recovering = false

/** Last resort used by React DevTools: recover a component frame from a failed render.
 * Only runs when creation metadata is unavailable. State and console are restored
 * synchronously, and each component type is sampled at most once.
 */
export const recoverComponentFrame = (type: unknown): FiberStackFrame[] => {
  if (type && typeof type === "object") {
    const wrapper = type as { render?: unknown; type?: unknown }
    type = wrapper.render ?? wrapper.type
  }
  if (typeof type !== "function" || recovering) return []
  const component = type as Component
  const cached = frames.get(component)
  if (cached) return cached
  const internals = React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: {
      H: unknown
    }
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: {
      ReactCurrentDispatcher?: { current: unknown }
    }
  }
  const modern =
    internals.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
  const legacy =
    internals.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
      ?.ReactCurrentDispatcher
  const modernDispatcher = modern?.H
  const legacyDispatcher = legacy?.current
  const previousError = console.error,
    previousWarn = console.warn
  let result: FiberStackFrame[] = []
  recovering = true
  try {
    if (modern) modern.H = null
    if (legacy) legacy.current = null
    console.error = console.warn = () => {}
    if (component.prototype?.isReactComponent) {
      // React class constructors assign props; intercept that before rendering.
      function ThrowingInstance() {}
      Object.defineProperty(ThrowingInstance.prototype, "props", {
        set() {
          throw new Error("component frame")
        },
      })
      Reflect.construct(component, [], ThrowingInstance)
    } else {
      const value = Reflect.apply(component, undefined, [])
      // Async components can reject after this synchronous recovery ends.
      if (value && typeof (value as PromiseLike<unknown>).then === "function") {
        void Promise.resolve(value).catch(() => {})
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      const candidates = readFiberStack(error)
      const boundary = candidates.findIndex((frame) =>
        frame.methodName.includes("recoverComponentFrame")
      )
      const last = boundary > 0 ? candidates[boundary - 1] : undefined
      if (last) result = [last]
    }
  } finally {
    if (modern) modern.H = modernDispatcher
    if (legacy) legacy.current = legacyDispatcher
    console.error = previousError
    console.warn = previousWarn
    recovering = false
  }
  frames.set(component, result)
  return result
}
