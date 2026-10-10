/**
 * Server Components — no "use client" here on purpose.
 *
 * Their hosts arrive with RSC `_debugInfo` attached. That metadata locates the
 * component, and its `owner` field locates whatever rendered it, so preferring
 * it over a stack frame resolved every host to the page rather than to the
 * element's own line.
 */

export const ServerCard = ({
  title,
  ...props
}: {
  title: string
  "data-accuracy-target"?: string
}) => (
  <div className="border-border rounded-lg border p-4" {...props}>
    <h3 className="font-inter text-[15px] font-medium">{title}</h3>
    <p className="font-inter text-muted-foreground mt-1 text-[14px]">
      Rendered on the server. Every element here should resolve into this file.
    </p>
  </div>
)

export const NestedServer = () => (
  <section className="flex flex-col gap-3">
    <ServerCard title="First" />
    <ServerCard title="Second" />
  </section>
)

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Async RSC — resolution must survive the await boundary. */
export const AsyncServerCard = async () => {
  await wait(1)
  return (
    <div className="border-border rounded-lg border p-4">
      <h3 className="font-inter text-[15px] font-medium">After an await</h3>
      <p className="font-inter text-muted-foreground mt-1 text-[14px]">
        This subtree resolved after suspending.
      </p>
    </div>
  )
}
