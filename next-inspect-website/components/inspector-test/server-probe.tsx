/**
 * Minimal Server Component (no "use client") for RSC climb / source tests.
 */
export const ServerProbe = () => (
  <header className="flex items-center gap-2 border-b border-border px-4 py-3">
    <span className="font-mono text-[12px] text-foreground">ServerProbe</span>
    <span className="text-[12px] text-muted-foreground">
      hover me · hold ⌥ for RSC climb
    </span>
  </header>
)
