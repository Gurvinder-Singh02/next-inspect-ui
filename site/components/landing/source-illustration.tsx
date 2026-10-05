const steps = [
  ["Browser click", "Pick an element on the page"],
  ["DOM element", "Find the exact visible element"],
  ["React Fiber", "Follow its React reference"],
  ["Fiber debug metadata", "Read its source clues"],
  ["Source maps (when needed)", "Map built code to the original file"],
  ["file.tsx:42:8", "Resolve the file, line, and column"],
  ["Editor link / dev server", "Send the source location"],
  ["Cursor / VS Code", "Open the code in your editor"],
]

const DashedRule = ({ edge }: { edge: "top" | "bottom" }) => (
  <svg
    aria-hidden="true"
    className={`pointer-events-none absolute left-0 h-px w-full overflow-visible text-border ${edge === "top" ? "top-0" : "bottom-0"}`}
  >
    <line
      x1="0"
      y1="0"
      x2="100%"
      y2="0"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="8 10"
    />
  </svg>
)

export const SourceIllustration = () => (
  <figure className="relative bg-background px-5 py-8 font-mono sm:px-8">
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-border"
    >
      <rect
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="8 10"
      />
    </svg>
    <figcaption className="absolute -top-3 left-1/2 w-max max-w-[90%] -translate-x-1/2 bg-background px-3 text-center text-xs tracking-widest text-primary sm:text-sm">
      [ BROWSER → EDITOR ]
    </figcaption>
    <span
      aria-hidden="true"
      className="absolute -top-3 -left-1.5 bg-background text-muted-foreground"
    >
      +
    </span>
    <span
      aria-hidden="true"
      className="absolute -top-3 -right-1.5 bg-background text-muted-foreground"
    >
      +
    </span>
    <div className="relative mb-5 grid grid-cols-[2rem_1fr] gap-3 pb-4 text-xs text-muted-foreground sm:grid-cols-[2rem_1fr_1fr]">
      <DashedRule edge="bottom" />
      <span>#</span>
      <span>Stage</span>
      <span className="hidden sm:block">What happens</span>
    </div>
    <ol aria-label="Browser to editor flow" className="flex flex-col">
      {steps.map(([stage, description], index) => (
        <li key={stage}>
          <div className="grid grid-cols-[2rem_1fr] items-start gap-3 py-2 text-xs sm:grid-cols-[2rem_1fr_1fr] sm:text-sm">
            <span className="text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className={index === 5 ? "text-primary" : "text-foreground"}>
              {stage}
            </span>
            <span className="col-start-2 text-xs leading-relaxed text-muted-foreground sm:col-start-auto">
              {description}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              aria-hidden="true"
              className="ml-[2.75rem] py-1 text-muted-foreground"
            >
              ↓
            </div>
          )}
        </li>
      ))}
    </ol>
    <div className="relative mt-5 flex items-center justify-between gap-3 pt-4 text-xs text-muted-foreground">
      <DashedRule edge="top" />
      <span>One click. Exact source.</span>
      <span className="text-primary">08 steps</span>
    </div>
    <span
      aria-hidden="true"
      className="absolute -bottom-2.5 -left-1.5 bg-background text-muted-foreground"
    >
      +
    </span>
    <span
      aria-hidden="true"
      className="absolute -right-1.5 -bottom-2.5 bg-background text-muted-foreground"
    >
      +
    </span>
  </figure>
)
