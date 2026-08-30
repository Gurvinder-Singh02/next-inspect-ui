import { ServerProbe } from "./server-probe"

/**
 * Server Component live check (no "use client").
 * Hover `<header>` → ⌥ → `<ServerProbe/>` with rendered by / source.
 */
export const ServerCompFixture = () => (
  <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
    <div className="flex flex-col gap-1">
      <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
        Server Component fixture
      </h2>
      <p className="text-[13px] text-muted-foreground">
        <code className="font-mono text-[12px] text-foreground">ServerProbe</code>{" "}
        is an RSC. Hover the header → hold{" "}
        <kbd className="font-mono text-[11px]">⌥</kbd> →{" "}
        <span className="font-mono text-[12px] text-foreground">
          {"<ServerProbe/>"}
        </span>{" "}
        with a real path (not{" "}
        <span className="font-mono text-[12px] text-foreground">?</span>
        ). Press <kbd className="font-mono text-[11px]">I</kbd> for{" "}
        <span className="font-mono text-[12px] text-foreground">rendered by</span>{" "}
        + <span className="font-mono text-[12px] text-foreground">source</span>.
        Click opens rendered by.
      </p>
    </div>
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <ServerProbe />
    </div>
  </section>
)
