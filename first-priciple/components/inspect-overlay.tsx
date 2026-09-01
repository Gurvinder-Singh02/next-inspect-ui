"use client"

import { useEffect, useRef, useState } from "react"

type Hit = {
  el: Element
  file: string
  line: number
  name: string
}

const resolve = (el: Element): Hit | null => {
  let current: Element | null = el
  while (current && current !== document.body) {
    const src = current.getAttribute("data-src")
    const name = current.getAttribute("data-name")
    if (src && name) {
      const [file, line] = src.split(":")
      return {
        el: current,
        file: file ?? src,
        line: parseInt(line ?? "1", 10),
        name,
      }
    }
    current = current.parentElement
  }
  return null
}

const climb = (hit: Hit): Hit | null => {
  let parent = hit.el.parentElement
  while (parent && parent !== document.body) {
    const nextHit = resolve(parent)
    if (nextHit && nextHit.el !== hit.el) {
      return nextHit
    }
    parent = parent.parentElement
  }
  return null
}

export const InspectOverlay = () => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [currentHit, setCurrentHit] = useState<Hit | null>(null)

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
      info.textContent = `${hit.name} (${hit.file}:${hit.line})`

      hoveredHit = hit
      setCurrentHit(hit)
    }

    const hide = () => {
      overlay.style.display = "none"
      info.style.display = "none"
      hoveredHit = null
      setCurrentHit(null)
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
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "I") {
        e.preventDefault()
        setActive((prev) => !prev)
        if (!active) hide()
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
