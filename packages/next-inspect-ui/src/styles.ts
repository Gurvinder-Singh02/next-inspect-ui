import { getOverlayPaint, type InspectorSettings } from "./lib.ts"

const STYLE_ATTR = "data-dev-inspector-style"

export const INSPECTOR_STYLE_TEXT = `
[${STYLE_ATTR}] { display: none; }

[data-dev-inspector-overlay] {
  position: fixed;
  z-index: 2147483646;
  display: none;
  pointer-events: none;
  box-sizing: border-box;
  background-color: var(--inspect-fill);
  background-image: none;
  animation: none;
  border: var(--inspect-border);
  border-radius: var(--inspect-radius, 4px);
  transition: var(--inspect-transition, none);
}

[data-dev-inspector-tooltip] {
  position: fixed;
  z-index: 2147483647;
  display: none;
  pointer-events: none;
  max-width: min(36rem, calc(100vw - 16px));
  overflow: visible;
  box-sizing: border-box;
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
  font: 12px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  transition: var(--inspect-tooltip-transition, none);
}

[data-dev-inspector-tooltip-front],
[data-dev-inspector-tooltip-under] {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  max-width: min(36rem, calc(100vw - 16px));
  overflow: hidden;
  background: var(--inspect-tooltip-bg);
  border: 1px solid var(--inspect-tooltip-border);
  color: var(--inspect-tooltip-text);
  border-radius: var(--inspect-tooltip-radius);
  padding: var(--inspect-tooltip-padding);
  box-shadow: 0 4px 12px rgb(0 0 0 / 30%);
}

[data-dev-inspector-tooltip-front] {
  position: relative;
  z-index: 2;
}

[data-dev-inspector-tooltip-under] {
  position: absolute;
  left: 0;
  bottom: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  pointer-events: none;
  opacity: 0.92;
}

[data-dev-inspector-tooltip-icon] {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 0;
  margin-right: 0;
  transition: width 160ms ease, margin-right 160ms ease;
}

[data-dev-inspector-tooltip-icon][data-open="used"] {
  width: 12px;
  margin-right: 3px;
}

@media (prefers-reduced-motion: reduce) {
  [data-dev-inspector-tooltip-icon] {
    transition: none;
  }
}

[data-dev-inspector-tooltip-label] {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-dev-inspector-info] {
  position: fixed;
  z-index: 2147483647;
  display: none;
  pointer-events: none;
  max-width: min(26rem, calc(100vw - 16px));
  box-sizing: border-box;
  background: var(--card, #18181b);
  border: 1px solid var(--border, rgb(255 255 255 / 12%));
  color: var(--card-foreground, #e4e4e7);
  padding: 12px 14px;
  border-radius: 12px;
  font: 12px/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  box-shadow: 0 12px 32px rgb(0 0 0 / 45%);
  cursor: default;
}

[data-dev-inspector-info-title] {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 3px;
  color: var(--inspect-fg, var(--foreground, #e4e4e7));
}

[data-dev-inspector-source-box] {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

[data-dev-inspector-source-row] {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
  line-height: 1.5;
}

[data-dev-inspector-source-label],
[data-dev-inspector-source-pending],
[data-dev-inspector-source-empty] {
  color: var(--inspect-muted, var(--muted-foreground, #8b949e));
  opacity: 0.6;
  font-weight: 500;
  font-size: 12px;
}

[data-dev-inspector-source-label] {
  flex: none;
  min-width: 88px;
}

[data-dev-inspector-source-path] {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--inspect-muted, var(--muted-foreground, #8b949e));
  cursor: pointer;
  font-weight: 500;
  word-break: break-all;
  text-decoration: none;
}

[data-dev-inspector-source-path]:hover {
  color: var(--inspect-fg, var(--foreground, #e4e4e7));
}

[data-dev-inspector-source-icon] {
  display: inline-flex;
  flex: none;
  opacity: 0.7;
  transform: translateX(0);
  transition: transform 160ms ease, opacity 160ms ease;
}

[data-dev-inspector-source-path]:hover [data-dev-inspector-source-icon] {
  opacity: 1;
  transform: translateX(3px);
}

[data-dev-inspector-owner-tree] {
  margin-top: 10px;
}

[data-dev-inspector-tree-heading] {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--inspect-muted, var(--muted-foreground, #8b949e));
  opacity: 0.7;
  margin-bottom: 6px;
}

[data-dev-inspector-tree] {
  display: flex;
  flex-direction: column;
  font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

[data-dev-inspector-tree-row] {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 3px 2px;
  cursor: pointer;
  color: var(--inspect-muted, var(--muted-foreground, #8b949e));
}

[data-dev-inspector-tree-row][data-active] {
  background: rgb(56 189 248 / 12%);
  color: var(--inspect-fg, var(--foreground, #e4e4e7));
}

[data-dev-inspector-tree-gutter] {
  display: flex;
  align-items: center;
  flex: none;
  user-select: none;
}

[data-dev-inspector-tree-indent] {
  display: inline-block;
  white-space: pre;
  width: calc(var(--inspect-tree-depth, 0) * 12px);
}

[data-dev-inspector-tree-twisty] {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 0;
  margin: 0;
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  font: inherit;
  line-height: 1;
  opacity: 0;
}

[data-dev-inspector-tree-twisty][data-open] {
  cursor: pointer;
  opacity: 0.65;
}

[data-dev-inspector-tree-name] {
  flex: none;
  font-weight: 600;
  color: var(--inspect-fg, var(--foreground, #e4e4e7));
  opacity: 0.9;
}

[data-dev-inspector-tree-path] {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 0;
  margin: 0 0 0 auto;
  min-width: 0;
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--inspect-muted, var(--muted-foreground, #8b949e));
  opacity: 0.7;
  font: inherit;
  text-align: right;
}

[data-dev-inspector-tree-path][data-open] {
  cursor: pointer;
}

[data-dev-inspector-tree-path][data-empty] {
  opacity: 0.4;
}

[data-dev-inspector-styles] {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

[data-dev-inspector-style-tabs] {
  display: flex;
  gap: 6px;
}

[data-dev-inspector-style-tab] {
  all: unset;
  cursor: pointer;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  opacity: 0.55;
}

[data-dev-inspector-style-tab][data-active] {
  opacity: 1;
}

[data-dev-inspector-code] {
  margin-top: 0;
  overflow: auto;
  border-radius: 8px;
  background: #0b0b0c;
  padding: 10px 12px;
}

[data-dev-inspector-code] pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font: 11px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
}
`

export const ensureInspectorStyles = (doc = document) => {
  if (doc.querySelector(`style[${STYLE_ATTR}]`)) return
  const style = doc.createElement("style")
  style.setAttribute(STYLE_ATTR, "")
  style.textContent = INSPECTOR_STYLE_TEXT
  doc.head.append(style)
}

export const applyOverlayPaint = (
  overlay: HTMLElement,
  tooltip: HTMLElement,
  settings: InspectorSettings
) => {
  const paint = getOverlayPaint(settings)
  overlay.style.setProperty("--inspect-fill", paint.fill)
  overlay.style.setProperty("--inspect-border", paint.border)
  overlay.style.setProperty("--inspect-radius", paint.borderRadius)
  overlay.style.setProperty("--inspect-transition", paint.transition)
  tooltip.style.setProperty("--inspect-tooltip-bg", paint.tooltipBackground)
  tooltip.style.setProperty("--inspect-tooltip-border", paint.tooltipBorder)
  tooltip.style.setProperty("--inspect-tooltip-text", paint.tooltipText)
  tooltip.style.setProperty("--inspect-tooltip-padding", paint.tooltipPadding)
  tooltip.style.setProperty("--inspect-tooltip-radius", paint.tooltipBorderRadius)
  tooltip.style.setProperty("--inspect-tooltip-transition", paint.tooltipTransition)
}
