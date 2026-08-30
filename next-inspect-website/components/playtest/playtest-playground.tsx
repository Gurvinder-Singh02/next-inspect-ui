"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export const PlaytestPlayground = () => {
  const [count, setCount] = useState(0)
  const [name, setName] = useState("")
  const [hovered, setHovered] = useState<"a" | "b" | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <section
        className="flex flex-col gap-3 rounded-xl border border-border p-5"
        data-testid="counter-section"
      >
        <h2 className="font-inter text-[15px] font-medium tracking-tight">
          1 · Click
        </h2>
        <p className="font-inter text-[14px] text-muted-foreground">
          Playwright clicks the button and asserts the count updates.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            data-testid="counter-btn"
            onClick={() => setCount((value) => value + 1)}
          >
            Increment
          </Button>
          <span
            data-testid="counter-value"
            className="font-mono text-[14px] tabular-nums"
          >
            count: {count}
          </span>
        </div>
      </section>

      <section
        className="flex flex-col gap-3 rounded-xl border border-border p-5"
        data-testid="input-section"
      >
        <h2 className="font-inter text-[15px] font-medium tracking-tight">
          2 · Type
        </h2>
        <p className="font-inter text-[14px] text-muted-foreground">
          Playwright fills the input and checks the greeting text.
        </p>
        <Input
          data-testid="name-input"
          name="playtest-name"
          autoComplete="off"
          spellCheck={false}
          placeholder="Type a name…"
          value={name}
          onChange={(event) => setName(event.target.value.trimStart())}
          className="max-w-xs text-base"
        />
        <p
          data-testid="greeting"
          className="font-inter text-[14px] text-muted-foreground"
        >
          {name.trim() ? `Hello, ${name.trim()}` : "Waiting for a name…"}
        </p>
      </section>

      <section
        className="flex flex-col gap-3 rounded-xl border border-border p-5"
        data-testid="hover-section"
      >
        <h2 className="font-inter text-[15px] font-medium tracking-tight">
          3 · Hover
        </h2>
        <p className="font-inter text-[14px] text-muted-foreground">
          Playwright hovers a box and asserts which target is active — the same
          idea as checking tooltip placement after a move.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            data-testid="hover-target-a"
            data-active={hovered === "a" ? "true" : "false"}
            onMouseEnter={() => setHovered("a")}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "min-h-11 min-w-28 rounded-lg border border-border px-4 py-3 font-mono text-[13px] transition-colors",
              hovered === "a" && "border-primary bg-primary/10 text-foreground"
            )}
          >
            Target A
          </button>
          <button
            type="button"
            data-testid="hover-target-b"
            data-active={hovered === "b" ? "true" : "false"}
            onMouseEnter={() => setHovered("b")}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "min-h-11 min-w-28 rounded-lg border border-border px-4 py-3 font-mono text-[13px] transition-colors",
              hovered === "b" && "border-primary bg-primary/10 text-foreground"
            )}
          >
            Target B
          </button>
        </div>
        <p
          data-testid="hover-status"
          className="font-mono text-[13px] text-muted-foreground"
        >
          hovered: {hovered ?? "none"}
        </p>
      </section>
    </div>
  )
}
