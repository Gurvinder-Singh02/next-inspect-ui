import type { AccuracyNode, FoundNode } from "./types";

const parseSource = (source: string | null) => {
  if (!source) return { file: "", line: null as number | null };
  const normalized = source.replace(/\\/g, "/");
  const lastColon = normalized.lastIndexOf(":");
  if (lastColon <= 0) return { file: normalized, line: null };
  const line = Number(normalized.slice(lastColon + 1));
  if (!Number.isFinite(line)) return { file: normalized, line: null };
  return { file: normalized.slice(0, lastColon), line };
};

export const filesMatch = (foundFile: string, expectFile: string) => {
  const a = foundFile.replace(/\\/g, "/");
  const b = expectFile.replace(/\\/g, "/");
  return a === b || a.endsWith(`/${b}`) || a.endsWith(b);
};

export const nodeMatches = (found: FoundNode | undefined, expect: AccuracyNode) => {
  if (!found?.source) return false;
  if (found.name !== expect.name) return false;
  const { file, line } = parseSource(found.source);
  if (!filesMatch(file, expect.file)) return false;
  if (expect.line != null && line !== expect.line) return false;
  return true;
};

export type MatchReport = {
  expectedCount: number;
  foundCount: number;
  matched: number;
  rate: number;
  ok: boolean;
  rows: Array<{
    expect: AccuracyNode;
    found: FoundNode | undefined;
    match: boolean;
  }>;
};

export const scoreNodes = (expected: AccuracyNode[], found: FoundNode[] | null): MatchReport => {
  const list = found ?? [];
  const rows = expected.map((expect, index) => {
    const row = list[index];
    return {
      expect,
      found: row,
      match: nodeMatches(row, expect),
    };
  });
  const matched = rows.filter((r) => r.match).length;
  const expectedCount = expected.length;
  const foundCount = list.length;
  const rate = expectedCount === 0 ? 0 : Math.round((matched / expectedCount) * 100);
  const ok = matched === expectedCount && foundCount === expectedCount && expectedCount > 0;

  return { expectedCount, foundCount, matched, rate, ok, rows };
};

export const formatExpectNode = (node: AccuracyNode) => {
  const tag = /^[a-z]/.test(node.name) ? `<${node.name}>` : `<${node.name}/>`;
  const path = node.line != null ? `${node.file}:${node.line}` : node.file;
  return `${tag} · ${path}`;
};

export const formatFoundNode = (node: FoundNode) => {
  const tag = /^[a-z]/.test(node.name) ? `<${node.name}>` : `<${node.name}/>`;
  return `${tag} · ${node.source ?? "…"}`;
};
