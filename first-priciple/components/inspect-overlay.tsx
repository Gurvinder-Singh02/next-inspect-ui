"use client"

import { useEffect, useRef, useState } from "react"

/** Minimal fiber shape — only what this teaching demo needs. */
type Fiber = {
  tag?: number
  type?: { name?: string; displayName?: string } | string
  return?: Fiber | null
  child?: Fiber | null
  sibling?: Fiber | null
  stateNode?: unknown
}

type Hit = {
  el: Element
  name: string
  fiber: Fiber
}

/** Find React's fiber stuck on a DOM node in development. */
const getFiber = (el: Element): Fiber | null => {
  const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"))
  if (!key) return null
  return (el as unknown as Record<string, Fiber>)[key] ?? null
}

/** Function / class / forwardRef / memo — the interesting components. */
const isComposite = (fiber: Fiber) => {
  const tag = fiber.tag
  return tag === 0 || tag === 1 || tag === 11 || tag === 14 || tag === 15
}

/** Next/App Router wrappers — skip so we land on your components. */
const isFrameworkName = (name: string) =>
  name === "SegmentViewNode" ||
  name === "InnerLayoutRouter" ||
  name === "RedirectBoundary" ||
  name === "RedirectErrorBoundary" ||
  name === "HTTPAccessFallbackBoundary" ||
  name === "HTTPAccessFallbackErrorBoundary" ||
  name === "LoadingBoundary" ||
  name === "ErrorBoundary" ||
  name === "ScrollAndMaybeFocusHandler" ||
  name === "InnerScrollAndFocusHandlerOld" ||
  name === "RenderFromTemplateContext" ||
  name === "AppRouter" ||
  name.endsWith("Boundary")

const readName = (fiber: Fiber): string | null => {
  const type = fiber.type
  if (!type || typeof type === "string") return null
  const name = type.displayName ?? type.name
  if (!name || isFrameworkName(name)) return null
  return name
}

/** Host DOM node under a composite (function components have no stateNode). */
const findHostElement = (fiber: Fiber, fallback: Element): Element => {
  const queue: Fiber[] = [fiber]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break
    if (current.tag === 5 && current.stateNode instanceof Element) {
      return current.stateNode
    }
    let child = current.child ?? null
    while (child) {
      queue.push(child)
      child = child.sibling ?? null
    }
  }
  return fallback
}

/**
 * Walk fiber.return from a DOM node's fiber until we find a named
 * composite component. This is the "no stamp" path next-inspect-ui uses
 * for names (production also filters Next framework wrappers, RSC, etc.).
 */
const resolve = (el: Element): Hit | null => {
  let fiber: Fiber | null = getFiber(el)
  while (fiber) {
    if (isComposite(fiber)) {
      const name = readName(fiber)
      if (name) {
        return {
          el: findHostElement(fiber, el),
          name,
          fiber,
        }
      }
    }
    fiber = fiber.return ?? null
  }
  return null
}

/** Climb to the next named composite above the current hit. */
const climb = (hit: Hit): Hit | null => {
  let fiber: Fiber | null = hit.fiber.return ?? null
  while (fiber) {
    if (isComposite(fiber)) {
      const name = readName(fiber)
      if (name) {
        return {
          el: findHostElement(fiber, hit.el),
          name,
          fiber,
        }
      }
    }
    fiber = fiber.return ?? null
  }
  return null
}

export const InspectOverlay = () => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const overlay = overlayRef.current
    const info = infoRef.current
    if (!overlay || !info) return

    let hoveredHit: Hit | null = null

    const hover = (hit: Hit) => {
      const rect = hit.el.getBoundingClientRect()
      overlay.style.display = "block"
      overlay.style.left = `${rect.left}px`
      overlay.style.top = `${rect.top}px`
      overlay.style.width = `${rect.width}px`
      overlay.style.height = `${rect.height}px`

      info.style.display = "block"
      info.style.left = `${rect.left}px`
      info.style.top = `${rect.bottom + 8}px`
      info.textContent = hit.name

      hoveredHit = hit
    }

    const hide = () => {
      overlay.style.display = "none"
      info.style.display = "none"
      hoveredHit = null
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!active) return
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (!target) return
      const hit = resolve(target)
      if (hit) hover(hit)
      else hide()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        e.key.toLowerCase() === "x"
      ) {
        e.preventDefault()
        hide()
        setActive((prev) => !prev)
      }

      if (!active) return

      if (e.key === "Escape") {
        setActive(false)
        hide()
      }

      if (e.key === "ArrowUp" && hoveredHit) {
        e.preventDefault()
        const parent = climb(hoveredHit)
        if (parent) hover(parent)
      }
    }

    document.addEventListener("pointermove", handlePointerMove)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [active])

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed z-50 pointer-events-none border-2 border-blue-500 bg-blue-500/10 rounded hidden"
      />
      <div
        ref={infoRef}
        className="fixed z-50 pointer-events-none bg-black text-white text-xs px-2 py-1 rounded hidden whitespace-nowrap"
      />
    </>
  )
}
