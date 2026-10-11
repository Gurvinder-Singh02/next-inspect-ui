"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"

/**
 * Motion fixtures.
 *
 * `motion.div` is a *component*, not a host, and the DOM node it produces is
 * built inside `motion`, exactly like a chart library. This is the shape that
 * first surfaced the wrong-file bug: an SVG <rect> from `motion.rect` resolved
 * to a page's `const params = await searchParams` line.
 *
 * Everything here is written in this file, so every hover and climb should
 * resolve into it.
 */

const motionBoxClass = "size-12 rounded-lg bg-muted-foreground/20"

/** Return-root motion.div — same climb as `return (<div/>)`. */
const MotionSimple = (props: { "data-accuracy-target"?: string }) => (
  <motion.div
    initial={{ opacity: 0.4 }}
    animate={{ opacity: 1 }}
    className={motionBoxClass}
    {...props}
  />
)

/** Bare MotionSimple next to nested div→div→motion.div. */
export const MotionSimplePair = () => (
  <div className="flex items-start gap-6">
    <MotionSimple data-accuracy-target="bare" />
    <div className="border-border rounded-lg border p-2">
      <div className="p-2">
        <motion.div
          data-accuracy-target="nested"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          className={motionBoxClass}
        />
      </div>
    </div>
  </div>
)

const MOTION_BOX_IDS = ["box-0", "box-1", "box-2"] as const

export const MotionBoxes = () => (
  <div className="flex gap-3">
    {MOTION_BOX_IDS.map((id, index) => (
      <motion.div
        key={id}
        data-accuracy-target={id}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 }}
        className="bg-muted-foreground/20 size-12 rounded-lg"
      />
    ))}
  </div>
)

/** SVG primitives — the exact case that produced the original wrong file. */
export const MotionSvg = () => (
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
)

/** A motion element nested inside plain host JSX. */
const MotionNested = () => (
  <div className="border-border rounded-lg border p-4">
    <p className="font-inter text-muted-foreground mb-3 text-[14px]">
      A motion element inside ordinary markup.
    </p>
    <motion.span
      whileHover={{ scale: 1.05 }}
      className="bg-muted inline-block rounded-md px-3 py-1 font-mono text-[13px]"
    >
      hover me
    </motion.span>
  </div>
)

/** Mount and unmount — resolution must survive elements appearing later. */
const MotionPresence = () => {
  const [shown, setShown] = useState(true)

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        className="border-border rounded-md border px-3 py-1.5 font-mono text-[13px]"
      >
        {shown ? "unmount" : "mount"}
      </button>

      <AnimatePresence>
        {shown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-border font-inter rounded-lg border px-4 py-3 text-[14px]"
          >
            Mounted through AnimatePresence.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** A user component whose return root is motion.div. */
const Chip = ({
  label,
  ...props
}: {
  label: string
  "data-accuracy-target"?: string
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="border-border rounded-full border px-3 py-1 font-mono text-[12px]"
    {...props}
  >
    {label}
  </motion.div>
)

export const MotionWrapped = () => (
  <div className="flex gap-2">
    <Chip label="alpha" data-accuracy-target="alpha" />
    <Chip label="beta" data-accuracy-target="beta" />
  </div>
)
