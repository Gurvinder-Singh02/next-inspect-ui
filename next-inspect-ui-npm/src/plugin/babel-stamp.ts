/**
 * Build-time JSX stamping — the ground truth the inspector reads on hover.
 *
 * React 19 removed `_debugSource` from fibers and dropped `__source` from the
 * `jsxDEV` signature, so the exact authoring location of a JSX element is not
 * recoverable at runtime. The compiler is the only thing that still knows it,
 * so we ask the compiler to write it down.
 *
 * Two stamps, because "which file is this DOM node written in" and "which file
 * is this component used in" are different questions and the inspector answers
 * both (hover vs ⌥ climb):
 *
 * - `data-inspect-host`  on lowercase JSX (`<div>`, `<button>`) — the DOM node's
 *   own authoring site.
 * - `data-inspect-owner` on component JSX (`<Button>`, `<Card.Header>`) — the
 *   call site. Components that forward props (`{...props}`, Base UI's
 *   `mergeProps`) carry this through onto the DOM node; components that don't
 *   forward simply drop it, which is fine — it just isn't available there.
 *
 * Two deliberate differences from `@react-dev-inspector/babel-plugin`, which
 * this visitor is otherwise modelled on:
 *
 * 1. Hosts and components are stamped under *different* attribute names, so the
 *    two questions above stay distinguishable in the DOM.
 * 2. They are inserted at opposite ends of the attribute list — see the note at
 *    the insertion site. A single strategy cannot serve both: a host must beat
 *    a caller's forwarded value, and an owner must yield to it.
 */

const HOST_ATTR = "data-inspect-host"
const OWNER_ATTR = "data-inspect-owner"

/**
 * Never render DOM, so a stamp is either meaningless or an outright error
 * (`Fragment` only accepts `key`/`children`). Matches the exclusions LocatorJS
 * settled on, which is the same list arrived at independently.
 */
const isUnstampableComponent = (name: string) =>
  name === "Fragment" ||
  name.endsWith(".Fragment") ||
  name === "Suspense" ||
  name.endsWith(".Suspense") ||
  /Provider$/.test(name)

/** `<div>` is a host; `<Button>` and `<Card.Header>` are components. */
const isHostName = (name: string) =>
  !name.includes(".") && !name.includes(":") && /^[a-z]/.test(name)

type JsxName =
  | { type: "JSXIdentifier"; name: string }
  | { type: "JSXMemberExpression"; object: JsxName; property: JsxName }
  | { type: "JSXNamespacedName"; namespace: JsxName; name: JsxName }

const readJsxName = (node: JsxName): string => {
  switch (node.type) {
    case "JSXIdentifier":
      return node.name
    case "JSXMemberExpression":
      return `${readJsxName(node.object)}.${readJsxName(node.property)}`
    case "JSXNamespacedName":
      return `${readJsxName(node.namespace)}:${readJsxName(node.name)}`
    default:
      return ""
  }
}

export type StampPluginOptions = {
  /**
   * Absolute directory that stamped paths are written relative to. The runtime
   * joins this back on, so it MUST be the same value passed to
   * `<InspectUI projectRoot>` — see `withInspectUI`, which wires both from one
   * constant. Defaults to `process.cwd()` only as a last resort; relying on it
   * is how the two ends drift apart.
   */
  root?: string
  /**
   * Path substrings whose files are left unstamped.
   *
   * Strings only. Turbopack requires loader options to be plain JSON, so a
   * RegExp arrives here as `{}` and any attempt to use it throws.
   */
  exclude?: string[]
}

const matchesAny = (filePath: string, patterns: string[]) =>
  patterns.some(
    (pattern) => typeof pattern === "string" && filePath.includes(pattern)
  )

/**
 * Babel plugin factory. Kept dependency-free — `types` arrives from Babel, and
 * the relative-path math is done by hand so this file can be bundled for Node
 * without pulling `@babel/types` into the consumer's install.
 */
export default function inspectStampPlugin(
  babel: { types: any },
  options: StampPluginOptions = {}
) {
  const { types: t } = babel
  const root = options.root ?? process.cwd()
  const exclude = options.exclude ?? []

  const relativeCache = new Map<string, string | null>()

  const toRelative = (filePath: string): string | null => {
    const cached = relativeCache.get(filePath)
    if (cached !== undefined) return cached

    const normalizedRoot = root.replace(/\\/g, "/").replace(/\/+$/, "")
    const normalizedFile = filePath.replace(/\\/g, "/")

    // Outside the configured root — the runtime could not join it back, so a
    // stamp would be worse than no stamp. The broken-path fixtures rely on
    // this returning null rather than emitting something unjoinable.
    const result = normalizedFile.startsWith(`${normalizedRoot}/`)
      ? normalizedFile.slice(normalizedRoot.length + 1)
      : null

    relativeCache.set(filePath, result)
    return result
  }

  return {
    name: "next-inspect-ui-stamp",
    visitor: {
      JSXOpeningElement(path: any, state: any) {
        const filePath: string | undefined = state?.file?.opts?.filename
        if (!filePath) return
        if (matchesAny(filePath, exclude)) return

        const name = readJsxName(path.node.name)
        if (!name || isUnstampableComponent(name)) return

        const loc = path.node.loc
        if (!loc?.start) return

        const relativePath = toRelative(filePath)
        if (relativePath === null) return

        const attribute = isHostName(name) ? HOST_ATTR : OWNER_ATTR

        // Idempotent: the loader can run twice on a file across HMR rounds, and
        // a second stamp would shadow the first in `getAttribute`.
        const alreadyStamped = path.node.attributes.some(
          (attr: any) =>
            attr.type === "JSXAttribute" && attr.name?.name === attribute
        )
        if (alreadyStamped) return

        // Babel columns are 0-based while lines are 1-based; editors want both
        // 1-based. Normalising here means every consumer of a stamp gets one
        // convention and `openInEditor` never has to guess.
        const value = `${relativePath}:${loc.start.line}:${loc.start.column + 1}`

        const stamp = t.jsxAttribute(
          t.jsxIdentifier(attribute),
          t.stringLiteral(value)
        )

        // Host and owner stamps need opposite insertion, which is why they are
        // separate attributes.
        //
        // Host: PUSH. `<button {...props} />` inside a wrapper must report the
        // wrapper's own file, so a trailing spread from the caller must not win.
        //
        // Owner: UNSHIFT. A wrapper that forwards props (`<Primitive {...props}
        // />`) carries the caller's owner stamp inside that spread, and the
        // caller's call site is what the climb wants. Pushing here overwrote it
        // with the wrapper's internal line, so climbing from a shadcn <button>
        // landed back in button.tsx instead of the page holding <Button>.
        if (isHostName(name)) {
          path.node.attributes.push(stamp)
        } else {
          path.node.attributes.unshift(stamp)
        }
      },
    },
  }
}

export { HOST_ATTR, OWNER_ATTR }
