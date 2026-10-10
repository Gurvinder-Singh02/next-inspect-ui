"use client"

/** Return-root svg — same climb as `return (<div/>)`. */
export const SvgBars = (props: { "data-accuracy-target"?: string }) => (
  <svg
    width={140}
    height={40}
    role="img"
    aria-label="bars"
    className="overflow-visible"
    {...props}
  >
    <rect
      x={4}
      y={4}
      width={28}
      height={28}
      rx={6}
      className="fill-muted-foreground/30"
    />
  </svg>
)
