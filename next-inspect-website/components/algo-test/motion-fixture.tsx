"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { SuiteTarget } from "@/components/accuracy/suite-case"

/**
 * Motion fixtures.
 *
 * `motion.div` is a *component*, not a host, so the stamper gives it an owner
 * stamp rather than a host stamp — and the DOM node it produces is built inside
 * `motion`, exactly like a chart library's. This is the shape that first
 * surfaced the wrong-file bug: an SVG <rect> from `motion.rect` resolved to a
 * page's `const params = await searchParams` line.
 *
 * Everything here is written in this file, so every hover and climb should
 * resolve into it.
 */

const MOTION_BOX_IDS = ["box-0", "box-1", "box-2"] as const

export const MotionBoxes = () => (
  <div className="flex gap-3">
    {MOTION_BOX_IDS.map((id, index) => (
      <SuiteTarget key={id} id={id}>
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="size-12 rounded-lg bg-muted-foreground/20"
        />
      </SuiteTarget>
    ))}
  </div>
)

/** SVG primitives — the exact case that produced the original wrong file. */
export const MotionSvg = () => (
  <div className="inline-flex">
    <svg width={140} height={40} role="img" aria-label="animated bars">
      {[0, 1, 2, 3].map((index) => (
        <motion.rect
          key={index}
          x={index * 34}
          y={4}
          width={28}
          height={28}
          rx={6}
          className="fill-muted-foreground/30"
          initial={{ scaleY: 0.6 }}
          animate={{ scaleY: 1 }}
        />
      ))}
    </svg>
  </div>
)

/** A motion element nested inside plain host JSX. */
export const MotionNested = () => (
  <div className="rounded-lg border border-border p-4">
    <p className="mb-3 font-inter text-[14px] text-muted-foreground">
      A motion element inside ordinary markup.
    </p>
    <motion.span
      whileHover={{ scale: 1.05 }}
      className="inline-block rounded-md bg-muted px-3 py-1 font-mono text-[13px]"
    >
      hover me
    </motion.span>
  </div>
)

/** Mount and unmount — resolution must survive elements appearing later. */
export const MotionPresence = () => {
  const [shown, setShown] = useState(true)

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        className="rounded-md border border-border px-3 py-1.5 font-mono text-[13px]"
      >
        {shown ? "unmount" : "mount"}
      </button>

      <AnimatePresence>
        {shown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-border px-4 py-3 font-inter text-[14px]"
          >
            Mounted through AnimatePresence.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** A user component wrapping a motion element — two levels to climb. */
const Chip = ({ label }: { label: string }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="rounded-full border border-border px-3 py-1 font-mono text-[12px]"
  >
    {label}
  </motion.div>
)

export const MotionWrapped = () => (
  <div className="flex gap-2">
    <Chip label="alpha" />
    <Chip label="beta" />
  </div>
)
