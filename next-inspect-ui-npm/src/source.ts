export type SourceLocation = {
  filePath: string;
  line: number;
  column: number;
};

export type FiberDebugSource = {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
};

/**
 * Compiled / vendor paths — never show these in the tooltip. Prefer remapping
 * via source maps / `__nextjs_original-stack-frames` instead.
 */
export const isBundledOrExternalPath = (filePath: string) => {
  const file = filePath.replace(/\\/g, "/");
  return (
    file.includes("/node_modules/") ||
    file.includes("node_modules/") ||
    file.includes("/.next/") ||
    file.startsWith(".next/") ||
    file.includes("/_next/") ||
    file.includes("webpack-internal:") ||
    file.includes("webpack://") ||
    file.includes("turbopack://") ||
    file.includes("about://React/")
  );
};

export const toAbsolutePath = (filePath: string, projectRoot: string) => {
  if (filePath.startsWith("file://")) {
    return decodeURIComponent(new URL(filePath).pathname);
  }

  if (filePath.startsWith("/")) return filePath;

  return `${projectRoot.replace(/\/$/, "")}/${filePath.replace(/^\.\//, "")}`;
};

/** Absolute filesystem paths (not Vite/Next URL pathnames like `/src/App.tsx`). */
export const isFilesystemAbsolutePath = (filePath: string) => {
  const file = filePath.replace(/\\/g, "/")
  return (
    file.startsWith("/Users/") ||
    file.startsWith("/home/") ||
    file.startsWith("/private/") ||
    file.startsWith("/Volumes/") ||
    /^\/[a-zA-Z]:\//.test(file) ||
    /^[a-zA-Z]:\//.test(file)
  )
}

/**
 * Turn a sourcemap `sources[]` entry into a filesystem path.
 *
 * Vite emits basename-only sources (`App.tsx`) with the map living at
 * `/src/App.tsx.map`. Per the source-map spec those are relative to the map
 * URL directory — join with `projectRoot` alone would open `project/App.tsx`
 * instead of `project/src/App.tsx`.
 */
export const resolveSourceMapSourcePath = ({
  source,
  sourceRoot,
  sourceMapUrl,
  projectRoot,
}: {
  source: string
  sourceRoot?: string
  sourceMapUrl: URL
  projectRoot: string
}) => {
  const withRoot = sourceRoot
    ? `${sourceRoot.replace(/\/$/, "")}/${source.replace(/^\.\//, "")}`
    : source

  if (withRoot.startsWith("file://")) {
    return toAbsolutePath(withRoot, projectRoot)
  }

  if (
    withRoot.startsWith(projectRoot) ||
    isFilesystemAbsolutePath(withRoot)
  ) {
    return toAbsolutePath(withRoot, projectRoot)
  }

  const mapPathname = sourceMapUrl.pathname.endsWith(".map")
    ? sourceMapUrl.pathname.slice(0, -4)
    : sourceMapUrl.pathname
  const mapDir = mapPathname.replace(/[^/]+$/, "") || "/"

  let urlPathname: string
  try {
    if (withRoot.startsWith("http://") || withRoot.startsWith("https://")) {
      urlPathname = new URL(withRoot).pathname
    } else if (withRoot.startsWith("/")) {
      urlPathname = withRoot
    } else {
      urlPathname = new URL(withRoot, `http://vite.local${mapDir}`).pathname
    }
  } catch {
    return toAbsolutePath(withRoot, projectRoot)
  }

  const isHttpMap =
    sourceMapUrl.protocol === "http:" || sourceMapUrl.protocol === "https:"

  if (
    isHttpMap &&
    urlPathname.startsWith("/") &&
    isLikelySourceFile(urlPathname) &&
    !urlPathname.includes("/node_modules/") &&
    !urlPathname.includes("/_next/") &&
    !isFilesystemAbsolutePath(urlPathname)
  ) {
    return `${projectRoot.replace(/\/$/, "")}${urlPathname}`
  }

  return toAbsolutePath(urlPathname.startsWith("/") ? urlPathname : withRoot, projectRoot)
}

export const formatPageLabel = (
  source: SourceLocation,
  projectRoot: string,
) => {
  const relativePath = source.filePath.startsWith(projectRoot)
    ? source.filePath.slice(projectRoot.length + 1)
    : source.filePath;
  return `${relativePath}:${source.line}`;
};

export const isLikelySourceFile = (filePath: string) =>
  /\.(tsx|ts|jsx|js|mdx)$/.test(filePath.split("?")[0] ?? "");

/** Accept `_debugSource` only when it already points at real project source. */
export const sourceFromFiberDebugSource = (
  debugSource: FiberDebugSource | null | undefined,
  projectRoot: string,
): SourceLocation | null => {
  if (!debugSource?.fileName || isBundledOrExternalPath(debugSource.fileName)) {
    return null;
  }
  return {
    filePath: toAbsolutePath(debugSource.fileName, projectRoot),
    line: debugSource.lineNumber ?? 1,
    column: debugSource.columnNumber ?? 1,
  };
};

/** Distinct usage site = different file from the definition (line-only ≠ used-in). */
export const isDistinctUsedSource = (
  usage: SourceLocation | null | undefined,
  definition: SourceLocation | null | undefined,
) => Boolean(usage && definition && usage.filePath !== definition.filePath);

/**
 * Stop the owner chain once a step answers "where was this used" in project
 * source. Further owners are the functions that *contain* that JSX
 * (`SectionCards` above `<CardHeader>`), not additional call sites.
 *
 * Same-file wrappers (Chip defined next to its caller) keep climbing — usage
 * and definition share a file, so this returns false.
 *
 * `host` covers the sync gap where the component definition frame is not
 * available yet: a usage file that differs from the hovered host's file is
 * still a real call-site answer (shadcn `card.tsx` host used from
 * `section-cards.tsx`).
 */
export const isClimbUsageBoundary = ({
  usage,
  definition,
  host,
}: {
  usage: SourceLocation | null | undefined;
  definition: SourceLocation | null | undefined;
  host?: SourceLocation | null | undefined;
}) => {
  if (!usage || isBundledOrExternalPath(usage.filePath)) return false;
  if (definition && usage.filePath !== definition.filePath) return true;
  if (host && usage.filePath !== host.filePath) return true;
  return false;
};

export type NamedSourceFrame = {
  methodName: string;
  source: SourceLocation;
};

const frameMatchesComponent = (methodName: string, componentName: string) => {
  const method = methodName.trim();
  if (!method || method === "<unknown>") return false;
  return (
    method === componentName ||
    method.endsWith(`.${componentName}`) ||
    method.startsWith(`${componentName}.`)
  );
};

/**
 * Click-open must land on the host JSX / component frame — not a nested
 * helper that happens to appear first in `_debugStack` (e.g. `copyError`
 * at L662 instead of `TestCard` JSX at L671).
 */
export const pickPreferredStackSource = (
  frames: NamedSourceFrame[],
  componentName: string | null | undefined,
): SourceLocation | null => {
  if (frames.length === 0) return null;
  if (componentName) {
    const named = frames.find((frame) =>
      frameMatchesComponent(frame.methodName, componentName),
    );
    if (named) return named.source;
  }
  return frames[0]?.source ?? null;
};

/** Host `_debugSource` (exact clicked JSX) always beats stack fallbacks. */
export const pickOpenSource = (
  host: SourceLocation | null | undefined,
  stack: SourceLocation | null | undefined,
): SourceLocation | null => host ?? stack ?? null;

export type ClimbSourcePair = {
  source: SourceLocation | null
  definition: SourceLocation | null
}

/** Usage site first (⌥ / node tree); fall back to the definition frame. */
export const getClimbStepDisplaySource = (
  step: ClimbSourcePair,
): SourceLocation | null => step.source ?? step.definition

export const pickDefinedSource = ({
  host,
  componentDefinition,
  labelIsComponent,
}: {
  host: SourceLocation | null | undefined;
  componentDefinition: SourceLocation | null | undefined;
  labelIsComponent: boolean;
}): SourceLocation | null =>
  labelIsComponent
    ? (componentDefinition ?? host ?? null)
    : (host ?? componentDefinition ?? null);

export const underStackTransform = (depth: number) =>
  `translate(${29 * depth}px, calc(100% * ${depth} + ${5 * depth}px))`
