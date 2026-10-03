import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From a browser element to React Fiber, source maps, and the exact line in your editor.",
  alternates: { canonical: "/how-it-works" },
}

const steps = [
  {
    title: "Find the element",
    text: "In inspect mode, hover a button, heading, or icon. The tool finds the DOM element under your pointer and draws a highlight around it. DOM means the elements your browser displays.",
  },
  {
    title: "Read React Fiber",
    text: "React attaches an internal Fiber reference to the element. Fiber holds information about what React rendered. Its links help the tool find the component that made the element and where that component was used.",
  },
  {
    title: "Read the source clues",
    text: "In development, React can provide a source location or stack trace through its _debugSource, _debugStack, and _debugInfo fields. A stack trace lists the code calls that led to the element. These are internal React fields, so what is available can vary.",
  },
  {
    title: "Find the original file",
    text: "Next.js turns TSX into JavaScript for the browser. A source map is a separate file that links that JavaScript back to the original TSX. The tool uses it when needed to find the file, line, and column. For server code, Next.js’s dev endpoint can help map the stack trace.",
  },
  {
    title: "Open your editor",
    text: "Click or press Enter to open the source. The tool builds an editor link with the full file path, line, and column. Your computer opens that link in Cursor, VS Code, or your chosen editor.",
  },
] as const

export default function HowItWorksPage() {
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1>How it works</h1>
        <p>Pick an element in your browser. Jump to the code that made it.</p>
      </header>

      <pre
        className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-5 text-sm leading-relaxed"
        aria-label="Path from a browser click to your editor"
      >
        {`Browser click
     ↓
DOM element
     ↓
React Fiber
     ↓
Fiber debug metadata
     ↓
Source maps (when needed)
     ↓
file.tsx:42:8
     ↓
Editor link
     ↓
Cursor / VS Code`}
      </pre>

      <ol className="flex list-decimal flex-col gap-6 pl-5">
        {steps.map((step) => (
          <li key={step.title} className="pl-1">
            <h2 className="mb-2 text-lg font-medium">{step.title}</h2>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>

      <section
        className="flex flex-col gap-3"
        aria-labelledby="inspect-controls"
      >
        <h2 id="inspect-controls" className="text-lg font-medium">
          Choose what to inspect
        </h2>
        <p>Press Alt + X to turn inspect mode on or off.</p>
        <p>
          Click to open the element’s source. For a shared Button, this can be
          the button implementation.
        </p>
        <p>
          Hold Option / Alt to climb to its component usage, such as &lt;Button
          /&gt; in your page.
        </p>
        <p>
          Press Space to toggle the tree popover. Component shows the full
          ancestor chain; Element shows nearby HTML elements. Left / Right
          switches tabs, and Up / Down selects rows. Press Escape to leave
          inspect mode.
        </p>
        <p>
          See the{" "}
          <Link
            href="/walkthrough"
            className="text-foreground underline underline-offset-4"
          >
            walkthrough
          </Link>{" "}
          or the full{" "}
          <Link
            href="/shortcuts"
            className="text-foreground underline underline-offset-4"
          >
            shortcut list
          </Link>
          .
        </p>
      </section>
    </>
  )
}
