/**
 * `withInspectUI(nextConfig)` — registers the build-time JSX stamper.
 *
 * Optional. Without it the inspector still works, falling back to runtime
 * inference from React's owner stacks and source maps. With it, hover and
 * click-to-open read a location the compiler wrote down, which is both exact
 * and synchronous (no source-map fetch in the hover path).
 *
 * Hard-gated to development. Stamps cannot reach a production build and there
 * is deliberately no override — this writes attributes into someone else's
 * HTML, and there is no legitimate reason to do that in production.
 */

import { createRequire } from "node:module"
import { join } from "node:path"
import { realpathSync } from "node:fs"

export type WithInspectUIOptions = {
  /**
   * Directory stamped paths are relative to. Must match `<InspectUI
   * projectRoot>` — mismatched roots make every stamp unjoinable, which is
   * indistinguishable from a broken resolver. Defaults to the resolved real
   * path of `process.cwd()`; symlinks are resolved so a pnpm workspace can't
   * produce two spellings of the same file.
   */
  root?: string
  /**
   * Globs to stamp, one rule registered per entry. Default: every JSX/TSX file
   * outside `node_modules`. Kept as separate globs rather than one brace
   * expansion because Turbopack's rule matcher does not document brace support.
   */
  include?: string | string[]
  /**
   * Extra path substrings to skip, on top of `node_modules`.
   *
   * Strings only — Turbopack passes loader options as JSON, so a RegExp would
   * arrive at the plugin as an empty object.
   */
  exclude?: string[]
}

const DEFAULT_INCLUDE = ["**/*.tsx", "**/*.jsx"]

/**
 * The project root, resolved through symlinks.
 *
 * Pass this to `<InspectUI projectRoot>` so the runtime joins stamped paths back
 * with exactly the string the stamper split them on. A pnpm workspace can reach
 * the same file by two spellings, and a root mismatch makes every stamp
 * unjoinable — which looks identical to a broken resolver.
 */
export const inspectUIProjectRoot = (): string => realpathSync(process.cwd())

/**
 * Resolved from the *consumer's* project rather than from this file, so it
 * works the same whether this module was loaded as ESM or CJS — `next.config`
 * is loaded differently depending on the project, and `import.meta` /
 * `__dirname` are each unavailable in one of those worlds.
 */
const resolveStampPluginPath = (): string => {
  const requireFromProject = createRequire(join(process.cwd(), "noop.js"))
  return requireFromProject.resolve("next-inspect-ui-stamper/babel-stamp")
}

const assertBabelAvailable = (requireFromProject: NodeRequire) => {
  for (const dependency of ["@babel/core", "babel-loader"]) {
    try {
      requireFromProject.resolve(dependency)
    } catch {
      throw new Error(
        `[next-inspect-ui-stamper] withInspectUI() needs \`${dependency}\`, which isn't installed.\n` +
          `  Install both as dev dependencies:\n\n` +
          `    npm i -D next-inspect-ui-stamper @babel/core babel-loader\n\n` +
          `  Or drop withInspectUI() from next.config — next-inspect-ui still ` +
          `resolves at runtime with no build step.`
      )
    }
  }
}

export const withInspectUI = <T extends Record<string, any>>(
  nextConfig: T = {} as T,
  options: WithInspectUIOptions = {}
): T => {
  // Not an error — `next build` legitimately calls this. Just a no-op.
  if (process.env.NODE_ENV === "production") return nextConfig

  const requireFromProject = createRequire(join(process.cwd(), "noop.js"))
  assertBabelAvailable(requireFromProject)

  const root = options.root ?? realpathSync(process.cwd())
  const include =
    options.include === undefined
      ? DEFAULT_INCLUDE
      : Array.isArray(options.include)
        ? options.include
        : [options.include]

  // `node_modules` is excluded at the plugin level rather than by narrowing the
  // glob: a rule glob that tries to express "not node_modules" is brittle, and
  // the plugin has to make the same call anyway when a file resolves outside
  // the configured root.
  const exclude = ["node_modules", ...(options.exclude ?? [])]

  const stampRule = {
    loaders: [
      {
        loader: requireFromProject.resolve("babel-loader"),
        options: {
          babelrc: false,
          configFile: false,
          compact: false,
          // Chained so Turbopack can still map its output back to the real
          // source. Without this, the attributes we inject shift columns and
          // the runtime fallback's accuracy would be degraded by our own
          // tooling — which would quietly corrupt what the verifier measures.
          sourceMaps: true,
          // Parse only. No presets: Babel accepts the TS/JSX syntax, injects
          // attributes, and reprints. Turbopack still does the real compile,
          // so the app is built by the same pipeline as everyone else's.
          parserOpts: { plugins: ["typescript", "jsx"] },
          plugins: [[resolveStampPluginPath(), { root, exclude }]],
        },
      },
    ],
  }

  const stampRules = Object.fromEntries(
    include.map((glob) => [glob, stampRule])
  )

  return {
    ...nextConfig,
    experimental: {
      ...(nextConfig.experimental ?? {}),
      // Next 16 detects a hand-configured `babel-loader` and warns on every
      // config load, because it ships its own for projects with a `.babelrc`.
      // Ours is additive and parse-only, so the built-in stays as-is and we
      // just acknowledge it. A consumer who set this themselves wins.
      turbopackUseBuiltinBabel:
        nextConfig.experimental?.turbopackUseBuiltinBabel ?? true,
    },
    turbopack: {
      ...(nextConfig.turbopack ?? {}),
      rules: {
        ...(nextConfig.turbopack?.rules ?? {}),
        ...stampRules,
      },
    },
  }
}

export default withInspectUI
