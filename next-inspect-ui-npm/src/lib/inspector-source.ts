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

/**
 * The single exit point every strategy passes through.
 *
 * Two strategies that are both correct must not disagree textually, or the
 * verifier scores a right answer wrong. Collapses duplicate slashes, strips
 * `./` segments, and clamps line/column to the 1-based convention editors use —
 * Babel and source maps both count columns from 0.
 */
export const normalizeSourceLocation = (
  source: SourceLocation | null | undefined,
): SourceLocation | null => {
  if (!source?.filePath) return null

  const filePath = source.filePath
    .replace(/\\/g, "/")
    .replace(/\/\.\//g, "/")
    .replace(/([^:])\/{2,}/g, "$1/")

  return {
    filePath,
    line: Number.isFinite(source.line) ? Math.max(1, Math.trunc(source.line)) : 1,
    column: Number.isFinite(source.column)
      ? Math.max(1, Math.trunc(source.column))
      : 1,
  }
}

/** Same file and line — column differences are not a disagreement worth failing on. */
export const isSameSourceLine = (
  a: SourceLocation | null | undefined,
  b: SourceLocation | null | undefined,
) => {
  const left = normalizeSourceLocation(a)
  const right = normalizeSourceLocation(b)
  if (!left || !right) return false
  return left.filePath === right.filePath && left.line === right.line
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

/**
 * Climb step paths (⌥ / NODE TREE / info panel while climbed).
 * - `source` = JSX call site (legacy “rendered by” raw)
 * - `definition` = component definition frame
 */
export type ClimbSourcePair = {
  source: SourceLocation | null
  definition: SourceLocation | null
}

/**
 * NODE TREE climb row · top ⌥ tooltip · info “rendered by”.
 *
 * Usage site first. ⌥ answers "where was this used", which is a different
 * question from the hover ("where is this element written") — and preferring
 * the definition made the two collapse onto the same file whenever a component
 * renders its own host, so climbing appeared to do nothing.
 */
export const getClimbStepDisplaySource = (
  step: ClimbSourcePair,
): SourceLocation | null => step.source ?? step.definition

/**
 * Info “source” while climbed — host DOM author path (stacked tooltip / <div>).
 */
export const getClimbInfoHostSource = (
  hostSource: SourceLocation | null | undefined,
): SourceLocation | null => hostSource ?? null

/**
 * Click-open under ⌥ — same as climb display (definition preferred).
 */
export const getClimbOpenSource = (
  step: ClimbSourcePair,
): SourceLocation | null => getClimbStepDisplaySource(step)

/**
 * Keep label and open line aligned:
 * - Label is a named component (`DetailCard`) → prefer that component's
 *   definition frame, not a nested helper JSX (`ExpandSection` @ L35).
 * - Label is a host tag (`div` / `h2`) → prefer the clicked host JSX.
 */
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

/**
 * Under-tooltip stack offset while ⌥ walks the owner chain.
 * Places previous chips *below* the front tooltip.
 * depth 1 → translate(29px, calc(100% + 5px))
 */
export const underStackTransform = (depth: number) =>
  `translate(${29 * depth}px, calc(100% * ${depth} + ${5 * depth}px))`;

/**
 * Clamp owner-chain walk for ⌥+⇧ climb. `atBound` is true when ⇧ cannot
 * move further (top of tree) or the chain is empty.
 */
export const nextOwnerChainDepth = (
  current: number,
  delta: number,
  chainLength: number,
): { depth: number; atBound: boolean } => {
  if (chainLength <= 0) return { depth: 0, atBound: true };
  const next = Math.min(chainLength - 1, Math.max(0, current + delta));
  return { depth: next, atBound: next === current };
};
