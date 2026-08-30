"use client"

/** HTML wrapper blocks ⌥ climb — shake, keep DOM tooltip. */
export const WrappedLeaf = () => (
  <div className="flex flex-col gap-2 rounded-md border border-border/70 bg-muted3/40 p-2.5">
    <span className="font-mono text-[10px] text-muted-foreground">
      WrappedLeaf (HTML wrapper)
    </span>
    <button
      type="button"
      className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-[12px] text-red-200"
    >
      Wrapped — ⌥ should shake
    </button>
  </div>
)
