import {
  getInspectorSettings,
  INSPECTOR_IDES,
  toAbsolutePath,
  type InspectorIde,
} from "next-inspect-ui/lib";

import type { AccuracyNode, FoundNode } from "@/components/accuracy/types";

// Ensure Window.__inspectUI typing from the probe helper is in scope.
import "@/components/accuracy/inspect-probe";

const parseFileLine = (raw: string) => {
  const normalized = raw.replace(/\\/g, "/");
  // Labels are `path/to/file.tsx:line` (Inspect formatPageLabel). Take the
  // last numeric :segment only so paths like app/(dev)/… stay intact.
  const match = normalized.match(/^(.*):(\d+)$/);
  if (!match) return { file: normalized, line: null as number | null };
  return { file: match[1]!, line: Number(match[2]) };
};

const resolveProjectRoot = (fallback: string) => {
  if (typeof window !== "undefined" && window.__inspectUI?.projectRoot) {
    return window.__inspectUI.projectRoot;
  }
  return fallback;
};

const resolveIde = (ide?: InspectorIde): InspectorIde =>
  ide ?? getInspectorSettings()?.ide ?? "cursor";

/**
 * Same handoff Inspect UI uses — `window.location.href = cursor://file…`
 * (not `<a href>`, which mishandles editor protocol URLs in some browsers).
 */
export const openAccuracySource = ({
  projectRoot,
  file,
  line = 1,
  column = 1,
  ide,
}: {
  projectRoot: string;
  file: string;
  line?: number;
  column?: number;
  ide?: InspectorIde;
}) => {
  const root = resolveProjectRoot(projectRoot);
  if (!root || !file) return;

  const absolute = toAbsolutePath(file, root);
  window.location.href = INSPECTOR_IDES[resolveIde(ide)].url(absolute, line, column);
};

export const openExpectedNode = (projectRoot: string, node: AccuracyNode) => {
  openAccuracySource({
    projectRoot,
    file: node.file,
    line: node.line ?? 1,
  });
};

export const openFoundNode = (projectRoot: string, node: FoundNode) => {
  if (!node.source) return;
  const { file, line } = parseFileLine(node.source);
  openAccuracySource({
    projectRoot,
    file,
    line: line ?? 1,
  });
};
