import type { FoundNode } from "./types";

const stripTag = (raw: string) =>
  raw.replace(/^</, "").replace(/\/>$/, "").replace(/>$/, "").trim();

/**
 * Read the Inspect UI info panel NODE TREE.
 * Public overlay only — no debug verify / probe APIs.
 */
export const readOwnerTreeFromOverlay = (): FoundNode[] | null => {
  const section = document.querySelector("[data-dev-inspector-owner-tree]");
  if (!section) return null;

  // section > heading + treeRoot; rows live in the last child.
  const treeRoot = section.querySelector(":scope > div:last-child");
  if (!treeRoot) return null;

  const found: FoundNode[] = [];
  for (const row of Array.from(treeRoot.children)) {
    if (!(row instanceof HTMLElement)) continue;

    let name: string | null = null;
    for (const span of row.querySelectorAll("span")) {
      const text = (span.textContent || "").trim();
      if (text.startsWith("<") && text.includes(">")) {
        name = stripTag(text);
        break;
      }
    }

    const pathBtn = Array.from(row.querySelectorAll("button")).find((button) => {
      const label = (button.getAttribute("title") || button.textContent || "").trim();
      return (
        label.includes(".tsx") ||
        label.includes(".ts") ||
        label.includes(".jsx") ||
        label.includes(".js") ||
        label === "…"
      );
    });

    const sourceRaw =
      pathBtn?.getAttribute("title")?.trim() || (pathBtn?.textContent || "").trim() || null;
    const source = sourceRaw === "…" ? null : sourceRaw;

    if (name) found.push({ name, source });
  }

  return found.length > 0 ? found : null;
};

const elementUnderOverlay = (): Element | null => {
  const overlay = document.querySelector("[data-dev-inspector-overlay]") as HTMLElement | null;
  if (!overlay) return null;
  if (getComputedStyle(overlay).display === "none") return null;

  const rect = overlay.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;

  return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
};

/** Which accuracy case (if any) is under the Inspect overlay spotlight. */
export const caseIdUnderOverlay = (): string | null => {
  const el = elementUnderOverlay();
  const root = el?.closest("[data-accuracy-case]") as HTMLElement | null;
  return root?.getAttribute("data-accuracy-case") ?? null;
};

/** Which multi-fixture target (if any) is under the Inspect overlay spotlight. */
export const targetIdUnderOverlay = (): string | null => {
  const el = elementUnderOverlay();
  const target = el?.closest("[data-accuracy-target]") as HTMLElement | null;
  return target?.getAttribute("data-accuracy-target") ?? null;
};

/** Format map duration for the status bar — e.g. `0.04ms`. */
export const formatMapMs = (ms: number) => {
  if (!Number.isFinite(ms) || ms < 0) return null;
  if (ms < 10) return `${ms.toFixed(2)}ms`;
  if (ms < 100) return `${ms.toFixed(1)}ms`;
  return `${Math.round(ms)}ms`;
};
