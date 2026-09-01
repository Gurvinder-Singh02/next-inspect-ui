"use client"

import { useEffect } from "react"

import {
  DEFAULT_DEV_SPOTLIGHT_PROPS,
  formatTooltipLabel,
  expandRectWithPadding,
  formatComponentTag,
  formatDomTag,
  getInspectorSettings,
  getOverlayPaint,
  getTooltipPosition,
  initInspectorSettings,
  matchesInspectorShortcut,
  PADDING_MAX,
  PADDING_MIN,
  setDevSpotlightProps,
  subscribeInspectorSettings,
} from "./lib.ts"
import {
  applyOverlayStyles,
  ARROW_UP_RIGHT_ICON,
  createStylesSection,
  findChildInspectable,
  findChildInspectableWhere,
  findEdgeSiblingInspectable,
  findParentInspectable,
  findSiblingInspectable,
  formatPageLabel,
  getClimbStepDisplaySource,
  getComponentName,
  getDirectClimbOwner,
  getDomHoverName,
  getFiber,
  getHostAuthorSource,
  getInstantDefinedSource,
  getInstantUsedSource,
  getNamedTarget,
  getOwnStackFrames,
  isBundledOrExternalPath,
  isClimbUsageBoundary,
  isCompositeComponentFiber,
  isDirectFiberChildOf,
  isDistinctUsedSource,
  isFrameworkInspectorName,
  isHostComponentFiber,
  isInspectorChrome,
  isOwnerAncestorOf,
  isPointInRect,
  openInEditor,
  preferredSourceFromFrames,
  readComponentTypeName,
  resolveDebugInfoPair,
  resolveDebugInfoPairSync,
  resolveFirstMappedFrame,
  resolveHostAuthorSource,
  resolveInspectElement,
  resolveInstanceSource,
  resolveNearestAncestorSource,
  resolveSource,
  sourceFromFiberDebugSource,
  sourceFromStackFrame,
  underStackTransform,
  type ReactFiber,
  type ServerDebugInfo,
  type SourceLocation,
  type SourceMap,
} from "./engine.ts"

type OpenKind = "used" | "defined"

type OwnerChainStep = {
  name: string
  source: SourceLocation | null
  definition: SourceLocation | null
  parentFiber: ReactFiber
  debugInfo?: ServerDebugInfo
}

export const InspectUI = ({ projectRoot }: { projectRoot: string }) => {
  useEffect(() => {
    initInspectorSettings()

    const sourceMapCache = new Map<string, Promise<SourceMap>>()
    const sourceCache = new WeakMap<
      ReactFiber,
      Promise<SourceLocation | null>
    >()
    const instanceSourceCache = new WeakMap<
      ReactFiber,
      Promise<SourceLocation | null>
    >()

    const instantDefinedPathCache = new WeakMap<ReactFiber, string>()
    const instantUsedPathCache = new WeakMap<ReactFiber, string>()
    const overlay = document.createElement("div")
    const tooltip = document.createElement("div")
    const info = document.createElement("div")
    const previousCursor = document.body.style.cursor
    let hoveredElement: Element | null = null

    let pendingClickElement: Element | null = null
    let infoVisible = false
    let infoTarget: Element | null = null
    let isActive = false
    let pointerPinned = false
    let pinnedPointerX = 0
    let pinnedPointerY = 0

    let treeNavStack: Element[] = []

    let optionHeld = false

    let ownerChainDepth = 0
    let ownerChainCache = new WeakMap<ReactFiber, OwnerChainStep[]>()
    const bustOwnerChainCache = () => {
      ownerChainCache = new WeakMap()
    }

    const instantHostPathCache = new WeakMap<ReactFiber, string>()

    type ClimbSelection = { depth: number; step: OwnerChainStep }
    type InfoTreeNode = {
      name: string
      isDom: boolean
      source: SourceLocation | null
      climbIndex: number
    }
    let infoClimbSelection: ClimbSelection | null = null
    let infoTreeMove: ((delta: number) => InfoTreeNode | null) | null = null
    let infoTreeChain: OwnerChainStep[] = []
    let infoTitleEl: HTMLDivElement | null = null
    let infoSourceBox: HTMLDivElement | null = null

    let inspectGeneration = 0
    let settings = getInspectorSettings()
    let lastTargetRect: {
      left: number
      top: number
      width: number
      height: number
    } | null = null

    overlay.setAttribute("aria-hidden", "true")
    overlay.setAttribute("data-dev-inspector-overlay", "")
    tooltip.setAttribute("aria-hidden", "true")
    tooltip.setAttribute("data-dev-inspector-tooltip", "")
    overlay.style.cssText =
      "position:fixed;z-index:2147483646;display:none;pointer-events:none;box-sizing:border-box;border-radius:4px;"

    tooltip.style.cssText =
      'position:fixed;z-index:2147483647;display:none;pointer-events:none;max-width:min(36rem,calc(100vw - 16px));overflow:visible;box-sizing:border-box;font:12px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;'
    const tooltipFront = document.createElement("div")
    tooltipFront.setAttribute("data-dev-inspector-tooltip-front", "")
    tooltipFront.style.cssText =
      "position:relative;z-index:2;display:flex;align-items:center;box-sizing:border-box;max-width:min(36rem,calc(100vw - 16px));overflow:hidden;box-shadow:0 4px 12px rgb(0 0 0 / 30%);"

    const tooltipIconWrap = document.createElement("span")
    tooltipIconWrap.setAttribute("aria-hidden", "true")
    tooltipIconWrap.style.cssText =
      "display:inline-flex;flex:none;align-items:center;justify-content:center;overflow:hidden;width:0;margin-right:0;transition:width 160ms ease,margin-right 160ms ease;"
    tooltipIconWrap.innerHTML = ARROW_UP_RIGHT_ICON
    const tooltipLabel = document.createElement("span")
    tooltipLabel.style.cssText =
      "min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
    tooltipFront.append(tooltipIconWrap, tooltipLabel)
    tooltip.append(tooltipFront)

    const tooltipUnderLayers: HTMLDivElement[] = []

    const paintTooltipChip = (chip: HTMLElement) => {
      const paint = getOverlayPaint(settings)
      chip.style.background = paint.tooltipBackground
      chip.style.border = `1px solid ${paint.tooltipBorder}`
      chip.style.color = paint.tooltipText
      chip.style.borderRadius = paint.tooltipBorderRadius
      chip.style.padding = paint.tooltipPadding
    }

    const stackMotionOk = () =>
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const clearTooltipStack = () => {
      for (const layer of tooltipUnderLayers) layer.remove()
      tooltipUnderLayers.length = 0

      tooltip
        .querySelectorAll("[data-dev-inspector-tooltip-under]")
        .forEach((el) => el.remove())
    }

    const layoutTooltipStack = () => {
      const total = tooltipUnderLayers.length
      tooltipUnderLayers.forEach((layer, index) => {

        const n = total - index
        layer.style.left = "0"
        layer.style.bottom = "0"
        layer.style.zIndex = String(2 - n)
        layer.style.transform = underStackTransform(n)
        layer.style.opacity = "0.92"
      })
    }

    const pushTooltipUnder = (text: string) => {
      if (!optionHeld || !text) return
      const chip = document.createElement("div")
      chip.setAttribute("aria-hidden", "true")
      chip.setAttribute("data-dev-inspector-tooltip-under", "")
      const reduceMotion = !stackMotionOk()
      chip.style.cssText =
        "position:absolute;left:0;bottom:0;display:flex;align-items:center;box-sizing:border-box;max-width:min(36rem,calc(100vw - 16px));overflow:hidden;white-space:nowrap;text-overflow:ellipsis;box-shadow:0 4px 12px rgb(0 0 0 / 30%);opacity:0;transform:translate(0,0);pointer-events:none;"
      chip.style.transition = reduceMotion
        ? "none"
        : "transform 180ms ease, opacity 180ms ease"
      paintTooltipChip(chip)
      chip.textContent = text
      tooltip.append(chip)
      tooltipUnderLayers.push(chip)

      requestAnimationFrame(() => {
        layoutTooltipStack()
      })
    }

    const popTooltipUnder = () => {
      const chip = tooltipUnderLayers.pop()
      if (!chip) return
      if (!stackMotionOk()) {
        chip.remove()
        layoutTooltipStack()
        return
      }
      chip.style.transform = "translate(0, 0)"
      chip.style.opacity = "0"
      window.setTimeout(() => {
        chip.remove()
        layoutTooltipStack()
      }, 180)
    }

    const setTooltipLabel = (text: string) => {
      tooltipLabel.textContent = text
    }

    const syncUsedIcon = (show: boolean) => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      tooltipIconWrap.style.transition = reduceMotion
        ? "none"
        : "width 160ms ease,margin-right 160ms ease"
      tooltipIconWrap.style.width = show ? "12px" : "0"
      tooltipIconWrap.style.marginRight = show ? "3px" : "0"
    }

    const toPascalCaseName = (raw: string) =>
      raw
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")

    const titleFromSourcePath = (pageName: string | null) => {
      if (!pageName) return null
      const filePath = pageName.split(":")[0] ?? ""
      const segments = filePath.split("/").filter(Boolean)
      const file = segments[segments.length - 1] ?? ""
      const base = file.replace(/\.(tsx|ts|jsx|js|mdx)$/i, "")
      if (!base) return null

      if (base === "page" || base === "layout" || base === "template") {
        return toPascalCaseName(base)
      }
      if (base === "index" && segments.length >= 2) {
        const parent = segments[segments.length - 2]
        if (parent && !parent.startsWith("(") && !parent.startsWith("@")) {
          return toPascalCaseName(parent)
        }
      }

      return toPascalCaseName(base)
    }

    const readFiberDisplayName = (node: ReactFiber) => {
      if (isCompositeComponentFiber(node)) {
        const name = readComponentTypeName(node.type)
        if (name && !isFrameworkInspectorName(name)) return name
      }
      if (node._debugInfo?.length) {
        for (let index = node._debugInfo.length - 1; index >= 0; index -= 1) {
          const info = node._debugInfo[index]
          if (info.name && !isFrameworkInspectorName(info.name)) {
            return info.name
          }
        }
      }
      return null
    }

    const findNextNamedOwner = (from: ReactFiber): ReactFiber | null => {
      const seen = new Set<ReactFiber>([from])
      const queue: ReactFiber[] = []
      if (from._debugOwner) queue.push(from._debugOwner)
      if (from.return && from.return !== from._debugOwner) queue.push(from.return)

      let hops = 0
      while (queue.length > 0 && hops < 48) {
        hops += 1
        const current = queue.shift()!
        if (seen.has(current)) continue
        seen.add(current)

        if (readFiberDisplayName(current)) return current

        if (current._debugOwner && !seen.has(current._debugOwner)) {
          queue.push(current._debugOwner)
        }
        if (
          current.return &&
          !seen.has(current.return) &&
          current.return !== current._debugOwner
        ) {
          queue.push(current.return)
        }
      }
      return null
    }

    const resolveUsageSourceInParent = (
      child: ReactFiber,
      parent: ReactFiber
    ): SourceLocation | null => {
      const childDef = getInstantDefinedSource(child, projectRoot)

      const fromChild = sourceFromFiberDebugSource(
        child._debugSource,
        projectRoot
      )

      if (fromChild && isDistinctUsedSource(fromChild, childDef)) {
        return fromChild
      }

      for (const frame of getOwnStackFrames(child)) {
        const loc = sourceFromStackFrame(frame, projectRoot)
        if (loc && isDistinctUsedSource(loc, childDef)) {
          return loc
        }
      }

      return getInstantDefinedSource(parent, projectRoot)
    }

    const isRouteFileBoundary = (
      source: SourceLocation | null,
      name: string
    ) => {
      if (/^(Page|Layout|Template)$/i.test(name)) return true
      if (!source) return false
      const file =
        source.filePath.replace(/\\/g, "/").split("/").pop()?.split("?")[0] ??
        ""
      return /^(page|layout|template)\.(tsx|ts|jsx|js|mdx)$/i.test(file)
    }

    const getComponentCreationSource = (
      componentFiber: ReactFiber
    ): SourceLocation | null =>
      preferredSourceFromFrames(
        getOwnStackFrames(componentFiber),
        projectRoot,
        getComponentName(componentFiber)
      )

    const pickClimbUsageSource = (
      ownerFiber: ReactFiber,
      child: ReactFiber,
      definition: SourceLocation | null,
      preferred?: SourceLocation | null
    ): SourceLocation | null => {
      const used =
        preferred ??
        getInstantUsedSource(ownerFiber, projectRoot) ??
        resolveUsageSourceInParent(child, ownerFiber)
      const created = getComponentCreationSource(ownerFiber)

      // Creation frames are often the definition file. Prefer a distinct call
      // site so ⌥ / NODE TREE answer "where was this used", not "where is it
      // defined" — and so the usage-boundary can stop before the enclosing
      // parent (SectionCards above CardHeader).
      if (isDistinctUsedSource(used, definition)) return used
      if (isDistinctUsedSource(created, definition)) return created
      return used ?? created
    }

    const resolveClimbStepSync = (
      ownerFiber: ReactFiber,
      child: ReactFiber,
      debugInfo?: ServerDebugInfo
    ): Pick<OwnerChainStep, "source" | "definition" | "debugInfo"> => {
      if (debugInfo) {
        const pair = resolveDebugInfoPairSync(debugInfo, projectRoot)
        const definition =
          pair.renderedBy ?? getInstantDefinedSource(ownerFiber, projectRoot)
        return {
          source: pickClimbUsageSource(
            ownerFiber,
            child,
            definition,
            pair.source
          ),
          definition,
          debugInfo,
        }
      }

      const definition = getInstantDefinedSource(ownerFiber, projectRoot)
      return {
        source: pickClimbUsageSource(ownerFiber, child, definition),
        definition,
      }
    }

    const buildOwnerChain = (fiber: ReactFiber): OwnerChainStep[] => {
      const cached = ownerChainCache.get(fiber)
      if (cached) return cached

      const steps: OwnerChainStep[] = []
      const seen = new Set<ReactFiber>()
      const seenNames = new Set<string>()
      const isHostHover =
        isHostComponentFiber(fiber) || fiber.stateNode instanceof Element

      let child: ReactFiber
      let parent: ReactFiber | null = null

      if (isHostHover) {
        // HTML host → climb one step only when this host is the component
        // return root (`return (`). Nested HTML under another host does not
        // climb — getDirectClimbOwner returns null for those. `motion.*` is
        // treated as the host it produces, so a return-root `motion.div`
        // climbs to the user component and a nested one does not.
        const owner = getDirectClimbOwner(fiber)
        if (!owner) return []

        if (
          !owner.isSelfDebugOwner &&
          !isDirectFiberChildOf(fiber, owner.fiber) &&
          !isOwnerAncestorOf(fiber, owner.fiber)
        ) {
          return []
        }

        const resolved = resolveClimbStepSync(
          owner.fiber,
          fiber,
          owner.debugInfo
        )
        steps.push({
          name: owner.name,
          source: resolved.source,
          definition: resolved.definition,
          parentFiber: owner.fiber,
          debugInfo: resolved.debugInfo,
        })
        ownerChainCache.set(fiber, steps)
        return steps
      } else {
        const named = getNamedTarget(fiber)?.fiber ?? fiber
        parent = findNextNamedOwner(named)
        if (!parent) return []
        if (
          !isDirectFiberChildOf(named, parent) &&
          !isOwnerAncestorOf(named, parent)
        ) {
          return []
        }
        child = named
      }

      let hops = 0
      while (parent && hops < 32) {
        hops += 1
        if (seen.has(parent)) break
        seen.add(parent)

        if (
          !isDirectFiberChildOf(child, parent) &&
          !isOwnerAncestorOf(child, parent)
        ) {
          break
        }

        const name = readFiberDisplayName(parent)
        if (!name || isFrameworkInspectorName(name)) break

        if (seenNames.has(name) && seen.has(parent)) break

        const resolved = resolveClimbStepSync(parent, child)
        steps.push({
          name,
          source: resolved.source,
          definition: resolved.definition,
          parentFiber: parent,
        })
        seenNames.add(name)

        if (
          isRouteFileBoundary(resolved.source, name) ||
          isRouteFileBoundary(resolved.definition, name) ||
          isClimbUsageBoundary({
            usage: resolved.source,
            definition: resolved.definition,
          })
        ) {
          break
        }

        child = parent
        const next = findNextNamedOwner(parent)
        if (
          !next ||
          (!isDirectFiberChildOf(parent, next) && !isOwnerAncestorOf(parent, next))
        ) {
          break
        }
        parent = next
      }

      if (steps.length > 0) ownerChainCache.set(fiber, steps)
      return steps
    }

    const getActiveChainStep = (fiber: ReactFiber): OwnerChainStep | null => {
      if (!optionHeld) return null
      const chain = buildOwnerChain(fiber)
      if (chain.length === 0) return null
      const index = Math.min(
        Math.max(0, ownerChainDepth),
        chain.length - 1
      )
      return chain[index] ?? null
    }

    const getUsedContextName = (fiber: ReactFiber) => {
      const step = getActiveChainStep(fiber)
      if (step) return step.name

      const definedName = getComponentName(fiber)

      for (const start of [fiber._debugOwner ?? null, fiber.return ?? null]) {
        let current: ReactFiber | null = start
        let hops = 0
        while (current && hops < 16) {
          hops += 1
          const name = readFiberDisplayName(current)
          if (name && name !== definedName) return name
          current = current._debugOwner ?? current.return ?? null
        }
      }

      return null
    }

    const climbDisplaySource = (step: OwnerChainStep) =>
      getClimbStepDisplaySource(step)

    const getCachedPageName = (fiber: ReactFiber, kind: OpenKind) => {
      if (!settings.tooltipProps.showPageName) return null
      if (kind === "used") {
        const step = getActiveChainStep(fiber)
        const display = step ? climbDisplaySource(step) : null
        if (display) return formatPageLabel(display, projectRoot)

        let pageName = instantDefinedPathCache.get(
          step?.parentFiber ?? fiber
        ) ?? instantUsedPathCache.get(fiber) ?? null
        if (!pageName) {
          const instantSource =
            getInstantDefinedSource(
              step?.parentFiber ?? fiber,
              projectRoot
            ) ??
            getInstantUsedSource(step?.parentFiber ?? fiber, projectRoot)
          if (instantSource) {
            pageName = formatPageLabel(instantSource, projectRoot)
            instantUsedPathCache.set(fiber, pageName)
          }
        }
        return pageName
      }

      let pageName = instantHostPathCache.get(fiber) ?? null
      if (!pageName) {
        const instantSource = getHostAuthorSource(fiber, projectRoot)
        if (instantSource) {
          pageName = formatPageLabel(instantSource, projectRoot)
          instantHostPathCache.set(fiber, pageName)
        }
      }
      return pageName
    }

    const getTooltipTitle = (fiber: ReactFiber, kind: OpenKind) => {
      if (kind === "used") {
        return (
          getUsedContextName(fiber) ??
          titleFromSourcePath(getCachedPageName(fiber, "used")) ??
          getComponentName(fiber)
        )
      }
      return getDomHoverName(fiber)
    }

    const resolveOpenKind = (fiber: ReactFiber | null): OpenKind => {
      if (!fiber) return "defined"
      if (infoVisible && infoClimbSelection) return "used"
      if (optionHeld && getActiveChainStep(fiber)) return "used"
      return "defined"
    }

    const paintTooltipForFiber = (fiber: ReactFiber) => {
      const kind = resolveOpenKind(fiber)
      const step =
        kind === "used"
          ? (infoVisible && infoClimbSelection
              ? infoClimbSelection.step
              : getActiveChainStep(fiber))
          : null
      const prev = infoClimbSelection
      let infoNeedsRefresh = false

      if (kind === "used" && step) {
        const nextSel = { depth: ownerChainDepth, step }
        infoNeedsRefresh =
          !prev ||
          prev.depth !== nextSel.depth ||
          prev.step.name !== step.name ||
          prev.step.parentFiber !== step.parentFiber
        infoClimbSelection = nextSel
      } else if (prev && !infoVisible) {

        infoClimbSelection = null
        infoNeedsRefresh = true
      }

      const baseLabel =
        formatTooltipLabel({
          title: getTooltipTitle(fiber, kind),
          pageName: getCachedPageName(fiber, kind),
          tooltipProps: settings.tooltipProps,
          tagStyle: kind === "used" ? "component" : "dom",
        }) ||
        (kind === "used"
          ? formatComponentTag("Component")
          : formatDomTag("element"))

      setTooltipLabel(baseLabel)
      syncUsedIcon(kind === "used")
      if (lastTargetRect) positionTooltip(lastTargetRect)

      if (
        infoNeedsRefresh &&
        infoVisible &&
        infoTarget &&
        hoveredElement === infoTarget
      ) {
        void renderInfo(infoTarget, fiber)
      }
    }
    info.setAttribute("aria-hidden", "true")
    info.setAttribute("data-dev-inspector-tooltip", "")
    info.style.cssText =
      'position:fixed;z-index:2147483647;display:none;pointer-events:none;max-width:min(26rem,calc(100vw - 16px));box-sizing:border-box;background:var(--card,#18181b);border:1px solid var(--border,rgb(255 255 255 / 12%));color:var(--card-foreground,#e4e4e7);padding:12px 14px;border-radius:12px;font:12px/1.5 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 12px 32px rgb(0 0 0 / 45%);cursor:default;'
    const paintTooltipChrome = () => {
      applyOverlayStyles(overlay, tooltip, settings)

      tooltip.style.background = "transparent"
      tooltip.style.border = "none"
      tooltip.style.padding = "0"
      tooltip.style.boxShadow = "none"
      paintTooltipChip(tooltipFront)
      for (const layer of tooltipUnderLayers) paintTooltipChip(layer)
    }

    paintTooltipChrome()
    document.body.append(overlay, tooltip, info)

    let onSettingsChanged: (() => void) | null = null
    let paintChrome: (() => void) | null = null
    const unsubscribe = subscribeInspectorSettings(() => {
      settings = getInspectorSettings()
      paintChrome?.()
      onSettingsChanged?.()
    })

    const positionTooltip = (targetRect: {
      left: number
      top: number
      width: number
      height: number
    }) => {
      const { tooltipProps } = settings
      const pos = getTooltipPosition({
        target: targetRect,
        tooltipWidth: tooltipFront.offsetWidth,
        tooltipHeight: tooltipFront.offsetHeight,
        side: tooltipProps.side,
        align: tooltipProps.align,
        sideOffset: tooltipProps.sideOffset,
        alignOffset: tooltipProps.alignOffset,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      })
      tooltip.style.left = `${pos.left}px`
      tooltip.style.top = `${pos.top}px`
    }

    const positionInfo = (targetRect: {
      left: number
      top: number
      width: number
      height: number
    }) => {
      const margin = 8
      const width = info.offsetWidth
      const height = info.offsetHeight
      const left = Math.max(
        margin,
        Math.min(targetRect.left, window.innerWidth - width - margin)
      )
      const below = targetRect.top + targetRect.height + margin
      const top =
        below + height + margin > window.innerHeight && targetRect.top > height
          ? targetRect.top - height - margin
          : below
      info.style.left = `${left}px`
      info.style.top = `${top}px`
    }

    const hideInfo = () => {
      infoVisible = false
      infoTarget = null
      infoClimbSelection = null
      infoTreeMove = null
      infoTreeChain = []
      infoTitleEl = null
      infoSourceBox = null
      info.style.display = "none"
      if (isActive) document.body.style.cursor = "crosshair"
    }

    const reposition = () => {
      if (lastTargetRect) positionInfo(lastTargetRect)
    }

    const paintInfoSourceLink = (source: SourceLocation | null) => {
      if (!infoSourceBox) return
      infoSourceBox.textContent = ""
      if (!source) {
        const unavailable = document.createElement("span")
        unavailable.textContent = "Source unavailable"
        unavailable.style.cssText =
          "font-size:12px;color:var(--muted-foreground,#8b949e);opacity:0.6;"
        infoSourceBox.appendChild(unavailable)
        return
      }

      const row = document.createElement("div")
      row.style.cssText =
        "display:flex;align-items:baseline;gap:8px;font-size:12px;line-height:1.5;"
      const path = document.createElement("a")
      path.style.cssText =
        "display:inline-flex;align-items:center;gap:6px;color:var(--muted-foreground,#8b949e);cursor:pointer;font-weight:500;word-break:break-all;text-decoration:none;"
      const pathText = document.createElement("span")
      const relativePath = source.filePath.startsWith(projectRoot)
        ? source.filePath.slice(projectRoot.length + 1)
        : source.filePath
      pathText.textContent = `${relativePath}:${source.line}:${source.column}`
      const pathIcon = document.createElement("span")
      pathIcon.style.cssText =
        "display:inline-flex;flex:none;opacity:0.7;transform:translateX(0);transition:transform 160ms ease,opacity 160ms ease;"
      pathIcon.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>'
      path.append(pathText, pathIcon)
      path.onclick = () => openInEditor(source, settings.ide)
      path.onmouseenter = () => {
        path.style.color = "var(--foreground,#e4e4e7)"
        pathIcon.style.opacity = "1"
        pathIcon.style.transform = "translateX(3px)"
      }
      path.onmouseleave = () => {
        path.style.color = "var(--muted-foreground,#8b949e)"
        pathIcon.style.opacity = "0.7"
        pathIcon.style.transform = "translateX(0)"
      }
      row.appendChild(path)
      infoSourceBox.appendChild(row)
    }

    const syncInfoTreeSelection = (node: InfoTreeNode) => {
      if (infoTitleEl) {
        infoTitleEl.textContent = node.isDom
          ? formatDomTag(node.name)
          : formatComponentTag(node.name)
      }
      paintInfoSourceLink(node.source)

      if (node.isDom) {
        infoClimbSelection = null
      } else {
        const step = infoTreeChain[node.climbIndex]
        if (step) {
          ownerChainDepth = node.climbIndex
          infoClimbSelection = { depth: node.climbIndex, step }
        }
      }

      const pageName = node.source
        ? formatPageLabel(node.source, projectRoot)
        : null
      const baseLabel =
        formatTooltipLabel({
          title: node.name,
          pageName,
          tooltipProps: settings.tooltipProps,
          tagStyle: node.isDom ? "dom" : "component",
        }) ||
        (node.isDom
          ? formatDomTag(node.name)
          : formatComponentTag(node.name))
      setTooltipLabel(baseLabel)
      syncUsedIcon(!node.isDom)
      if (lastTargetRect) {
        positionTooltip(lastTargetRect)
        positionInfo(lastTargetRect)
      }
    }

    const createClimbTreeSection = (
      hostTag: string,
      hostSource: SourceLocation | null,
      chain: OwnerChainStep[],
      initialClimbIndex: number
    ) => {
      const nodes: InfoTreeNode[] = [
        ...[...chain]
          .map((step, index) => ({
            name: step.name,
            isDom: false,
            // Usage site first — same as ⌥ tooltip / getClimbStepDisplaySource.
            source: getClimbStepDisplaySource(step),
            climbIndex: index,
          }))
          .reverse(),
        {
          name: hostTag,
          isDom: true,
          source: hostSource,
          climbIndex: -1,
        },
      ]

      const section = document.createElement("div")
      section.setAttribute("data-dev-inspector-owner-tree", "")
      section.style.cssText = "margin-top:10px;"

      const heading = document.createElement("div")
      heading.textContent = "Node tree"
      heading.style.cssText =
        "font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted-foreground,#8b949e);opacity:0.7;margin-bottom:6px;"
      section.appendChild(heading)

      const tree = document.createElement("div")
      tree.setAttribute("role", "tree")
      tree.setAttribute("aria-label", "Node tree")
      tree.style.cssText =
        'display:flex;flex-direction:column;gap:0;font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;'

      const expanded = nodes.map(() => true)
      const selection = { climbIndex: initialClimbIndex }

      const visibleNodeIndices = () => {
        const indices: number[] = []
        for (let index = 0; index < nodes.length; index += 1) {
          let shown = true
          for (let ancestor = 0; ancestor < index; ancestor += 1) {
            if (!expanded[ancestor]) {
              shown = false
              break
            }
          }
          if (shown) indices.push(index)
        }
        return indices
      }

      const paint = () => {
        tree.textContent = ""

        nodes.forEach((node, index) => {

          for (let a = 0; a < index; a += 1) {
            if (!expanded[a]) return
          }

          const hasChildren = index < nodes.length - 1

          const isActive = node.climbIndex === selection.climbIndex

          const row = document.createElement("div")
          row.setAttribute("role", "treeitem")
          row.setAttribute("aria-selected", isActive ? "true" : "false")
          row.setAttribute("aria-level", String(index + 1))
          row.style.cssText = [
            "display:flex;align-items:center;gap:6px;min-width:0;padding:3px 2px;cursor:pointer;",
            isActive
              ? "background:rgb(56 189 248 / 12%);color:var(--foreground,#e4e4e7);"
              : "color:var(--muted-foreground,#8b949e);",
          ].join("")

          const gutter = document.createElement("div")
          gutter.style.cssText =
            "display:flex;align-items:center;flex:none;user-select:none;"

          const indent = document.createElement("span")
          indent.style.cssText =
            "display:inline-block;white-space:pre;width:" +
            `${index * 12}px;`

          const twisty = document.createElement("button")
          twisty.type = "button"
          twisty.setAttribute(
            "aria-label",
            hasChildren
              ? expanded[index]
                ? "Collapse"
                : "Expand"
              : "Leaf"
          )
          twisty.style.cssText =
            "appearance:none;border:0;background:transparent;padding:0;margin:0;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;color:inherit;cursor:default;opacity:0.65;font:inherit;line-height:1;"
          if (hasChildren) {
            twisty.style.cursor = "pointer"
            twisty.textContent = expanded[index] ? "▾" : "▸"
            twisty.onclick = (event) => {
              event.preventDefault()
              event.stopPropagation()
              expanded[index] = !expanded[index]
              paint()
              reposition()
            }
          } else {
            twisty.textContent = ""
            twisty.style.opacity = "0"
          }

          gutter.append(indent, twisty)

          const nameEl = document.createElement("span")
          nameEl.textContent = node.isDom
            ? formatDomTag(node.name)
            : formatComponentTag(node.name)
          nameEl.style.cssText = [
            "flex:none;font-weight:600;",
            isActive
              ? "color:var(--foreground,#e4e4e7);"
              : "color:var(--foreground,#e4e4e7);opacity:0.9;",
          ].join("")

          const pathEl = document.createElement("button")
          pathEl.type = "button"
          pathEl.style.cssText =
            "appearance:none;border:0;background:transparent;padding:0;margin:0 0 0 auto;min-width:0;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted-foreground,#8b949e);opacity:0.7;cursor:default;font:inherit;text-align:right;"

          if (node.source) {
            const label = formatPageLabel(node.source, projectRoot)
            pathEl.textContent = label
            pathEl.title = label
            pathEl.style.cursor = "pointer"
            pathEl.onclick = (event) => {
              event.preventDefault()
              event.stopPropagation()
              openInEditor(node.source!, settings.ide)
            }
            pathEl.onmouseenter = () => {
              pathEl.style.color = "var(--foreground,#e4e4e7)"
              pathEl.style.opacity = "1"
            }
            pathEl.onmouseleave = () => {
              pathEl.style.color = "var(--muted-foreground,#8b949e)"
              pathEl.style.opacity = "0.7"
            }
          } else {
            pathEl.textContent = "…"
            pathEl.style.opacity = "0.4"
          }

          row.append(gutter, nameEl, pathEl)
          row.onclick = (event) => {
            if (pathEl.contains(event.target as Node)) return
            event.preventDefault()
            selection.climbIndex = node.climbIndex
            paint()
            syncInfoTreeSelection(node)
          }
          tree.appendChild(row)
        })
      }

      paint()
      section.appendChild(tree)

      return {
        section,
        moveSelection: (delta: number): InfoTreeNode | null => {
          const visible = visibleNodeIndices()
          if (visible.length === 0) return null
          const current = visible.findIndex(
            (index) => nodes[index]?.climbIndex === selection.climbIndex
          )
          const from = current === -1 ? visible.length - 1 : current
          const next = from + delta
          if (next < 0 || next >= visible.length) return null
          const nodeIndex = visible[next]
          if (nodeIndex === undefined) return null
          const node = nodes[nodeIndex]
          if (!node) return null
          selection.climbIndex = node.climbIndex
          paint()
          syncInfoTreeSelection(node)
          return node
        },
        refinePaths: (refine: (step: OwnerChainStep) => Promise<void>) => {
          chain.forEach((step, index) => {
            void refine(step).then(() => {
              if (!infoVisible || !info.contains(tree)) return

              const nodeIndex = chain.length - 1 - index
              if (nodeIndex >= 0 && nodeIndex < nodes.length) {
                nodes[nodeIndex].source = getClimbStepDisplaySource(step)
                if (nodes[nodeIndex].climbIndex === selection.climbIndex) {
                  syncInfoTreeSelection(nodes[nodeIndex])
                }
              }
              paint()
              reposition()
            })
          })
        },

        setHostSource: (source: SourceLocation | null) => {
          if (!infoVisible || !info.contains(tree)) return
          const hostNode = nodes[nodes.length - 1]
          if (!hostNode?.isDom) return
          hostNode.source = source
          paint()
          if (hostNode.climbIndex === selection.climbIndex) {
            syncInfoTreeSelection(hostNode)
          }
          reposition()
        },

        setClimbStepSource: (
          climbIndex: number,
          source: SourceLocation | null
        ) => {
          if (!infoVisible || !info.contains(tree)) return
          const nodeIndex = chain.length - 1 - climbIndex
          if (nodeIndex < 0 || nodeIndex >= nodes.length) return
          nodes[nodeIndex].source = source
          paint()
          const node = nodes[nodeIndex]
          if (node && node.climbIndex === selection.climbIndex) {
            syncInfoTreeSelection(node)
          }
          reposition()
        },
      }
    }

    const renderInfo = async (target: Element, fiber: ReactFiber) => {

      const liveStep = optionHeld ? getActiveChainStep(fiber) : null
      if (liveStep) {
        infoClimbSelection = { depth: ownerChainDepth, step: liveStep }
      } else {
        infoClimbSelection = null
      }

      const climbStep = infoClimbSelection?.step ?? null
      const climbDepth = infoClimbSelection?.depth ?? 0
      const hostTag = getDomHoverName(fiber) ?? "element"

      const chain = buildOwnerChain(fiber)

      info.textContent = ""

      const title = document.createElement("div")
      title.textContent = climbStep
        ? formatComponentTag(climbStep.name)
        : formatDomTag(hostTag)
      title.style.cssText =
        "font-weight:600;font-size:13px;margin-bottom:3px;color:var(--foreground,#ffffff);"
      info.appendChild(title)
      infoTitleEl = title

      const sourceContainer = document.createElement("div")
      sourceContainer.style.cssText =
        "display:flex;flex-direction:column;gap:2px;"
      const loading = document.createElement("span")
      loading.textContent = "Resolving…"
      loading.style.cssText =
        "font-size:12px;color:var(--muted-foreground,#8b949e);opacity:0.6;font-weight:500;"
      sourceContainer.appendChild(loading)
      info.appendChild(sourceContainer)
      infoSourceBox = sourceContainer

      const treeHostSource = getHostAuthorSource(fiber, projectRoot)
      infoTreeChain = chain
      const climbTree =
        chain.length > 0
          ? createClimbTreeSection(
              hostTag,
              treeHostSource,
              chain,
              climbStep ? climbDepth : -1
            )
          : null
      infoTreeMove = climbTree?.moveSelection ?? null
      if (climbTree) info.appendChild(climbTree.section)

      info.appendChild(createStylesSection(target, reposition))

      info.style.display = "block"
      info.style.pointerEvents = "auto"
      reposition()

      climbTree?.refinePaths(async (step) => {
        if (step.debugInfo) {
          const pair = await resolveDebugInfoPair(
            step.debugInfo,
            projectRoot,
            sourceMapCache
          )
          if (pair.source) step.source = pair.source
          if (pair.renderedBy) step.definition = pair.renderedBy
          return
        }
        if (!step.definition) {
          const def = await getSource(step.parentFiber)
          if (def && !isBundledOrExternalPath(def.filePath)) {
            step.definition = def
          }
        }
        if (!step.source) {
          const usage = await getInstanceSource(step.parentFiber)
          if (usage && !isBundledOrExternalPath(usage.filePath)) {
            step.source = usage
          }
        }
      })

      const appendSourceRow = (label: string | null, source: SourceLocation) => {
        const row = document.createElement("div")
        row.style.cssText =
          "display:flex;align-items:baseline;gap:8px;font-size:12px;line-height:1.5;"

        if (label) {
          const tag = document.createElement("span")
          tag.textContent = label
          tag.style.cssText =
            "flex:none;min-width:88px;color:var(--muted-foreground,#8b949e);opacity:0.6;font-weight:500;"
          row.appendChild(tag)
        }

        const path = document.createElement("a")
        path.style.cssText =
          "display:inline-flex;align-items:center;gap:6px;color:var(--muted-foreground,#8b949e);cursor:pointer;font-weight:500;word-break:break-all;text-decoration:none;"
        const pathText = document.createElement("span")
        const relativePath = source.filePath.startsWith(projectRoot)
          ? source.filePath.slice(projectRoot.length + 1)
          : source.filePath
        pathText.textContent = `${relativePath}:${source.line}:${source.column}`
        const pathIcon = document.createElement("span")
        pathIcon.style.cssText =
          "display:inline-flex;flex:none;opacity:0.7;transform:translateX(0);transition:transform 160ms ease,opacity 160ms ease;"
        pathIcon.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>'
        path.append(pathText, pathIcon)
        path.onclick = () => openInEditor(source, settings.ide)
        path.onmouseenter = () => {
          path.style.color = "var(--foreground,#e4e4e7)"
          pathIcon.style.opacity = "1"
          pathIcon.style.transform = "translateX(3px)"
        }
        path.onmouseleave = () => {
          path.style.color = "var(--muted-foreground,#8b949e)"
          pathIcon.style.opacity = "0.7"
          pathIcon.style.transform = "translateX(0)"
        }
        row.appendChild(path)
        sourceContainer.appendChild(row)
      }

      try {

        const hostSource =
          (await resolveHostAuthorSource(
            fiber,
            projectRoot,
            sourceMapCache
          )) ?? getHostAuthorSource(fiber, projectRoot)

        if (!infoVisible || infoTarget !== target) return

        climbTree?.setHostSource(hostSource)

        if (climbStep) {
          const composite = climbStep.parentFiber
          let usageLoc = climbStep.source
          let definitionLoc = climbStep.definition

          if (climbStep.debugInfo) {
            const pair = await resolveDebugInfoPair(
              climbStep.debugInfo,
              projectRoot,
              sourceMapCache
            )
            usageLoc = pair.source ?? usageLoc
            definitionLoc = pair.renderedBy ?? definitionLoc
            climbStep.source = usageLoc
            climbStep.definition = definitionLoc
          } else {
            const [usage, definition] = await Promise.all([
              usageLoc
                ? Promise.resolve(usageLoc)
                : getInstanceSource(composite),
              definitionLoc
                ? Promise.resolve(definitionLoc)
                : getSource(composite),
            ])
            usageLoc =
              usage ??
              getInstantUsedSource(composite, projectRoot) ??
              usageLoc
            definitionLoc =
              definition ??
              getInstantDefinedSource(composite, projectRoot) ??
              definitionLoc
            climbStep.source = usageLoc
            climbStep.definition = definitionLoc
          }

          if (!infoVisible || infoTarget !== target) return

          const climbPath = climbDisplaySource(climbStep)
          if (climbPath) climbTree?.setClimbStepSource(climbDepth, climbPath)

          sourceContainer.textContent = ""

          if (climbPath) {
            appendSourceRow(null, climbPath)
          } else {
            const unavailable = document.createElement("span")
            unavailable.textContent = "Source unavailable"
            unavailable.style.cssText =
              "font-size:12px;color:var(--muted-foreground,#8b949e);opacity:0.6;"
            sourceContainer.appendChild(unavailable)
          }
        } else {
          sourceContainer.textContent = ""
          if (hostSource) {
            appendSourceRow(null, hostSource)
          } else {
            const unavailable = document.createElement("span")
            unavailable.textContent = "Source unavailable"
            unavailable.style.cssText =
              "font-size:12px;color:var(--muted-foreground,#8b949e);opacity:0.6;"
            sourceContainer.appendChild(unavailable)
          }
        }
        reposition()
      } catch {
        if (infoVisible && infoTarget === target) {
          sourceContainer.textContent = "Source unavailable"
        }
      }
    }

    const refineClimbStep = async (step: OwnerChainStep) => {
      // Keep a distinct usage site — don't let async stack refine replace
      // the caller's file with the component definition.
      if (
        step.source &&
        !isBundledOrExternalPath(step.source.filePath) &&
        isClimbUsageBoundary({
          usage: step.source,
          definition: step.definition,
        })
      ) {
        return
      }

      if (!step.debugInfo) {

        let carrier: ReactFiber | null = step.parentFiber
        let hops = 0

        while (carrier && hops < 8) {
          hops += 1
          const entries = carrier._debugInfo
          if (entries?.length) {
            for (let i = entries.length - 1; i >= 0; i -= 1) {
              const info = entries[i]
              if (!info?.name) continue

              if (info.name !== step.name) continue
              const pair = await resolveDebugInfoPair(
                info,
                projectRoot,
                sourceMapCache
              )
              if (
                pair.source &&
                !isBundledOrExternalPath(pair.source.filePath)
              ) {
                step.source = pair.source
                if (pair.renderedBy) step.definition = pair.renderedBy
                return
              }
            }
          }
          carrier = carrier._debugOwner ?? null
        }
      }

      if (step.debugInfo) {
        const pair = await resolveDebugInfoPair(
          step.debugInfo,
          projectRoot,
          sourceMapCache
        )
        if (pair.source) step.source = pair.source
        if (pair.renderedBy) step.definition = pair.renderedBy
        return
      }

      const ownCreation = await resolveFirstMappedFrame(
        getOwnStackFrames(step.parentFiber),
        projectRoot,
        sourceMapCache,
        getComponentName(step.parentFiber)
      )
      if (ownCreation && !isBundledOrExternalPath(ownCreation.filePath)) {
        step.source = ownCreation
        return
      }

      if (!step.source) {
        const stepUsage = await getInstanceSource(step.parentFiber)
        if (stepUsage && !isBundledOrExternalPath(stepUsage.filePath)) {
          step.source = stepUsage
        }
      }
      if (!step.definition) {
        const stepDef = await getSource(step.parentFiber)
        if (stepDef && !isBundledOrExternalPath(stepDef.filePath)) {
          step.definition = stepDef
        }
      }
    }

    let logOptionPress: (() => void) | null = null
    let walkOwnerChain: ((delta: number) => void) | null = null
    let moveToParentInspectable: (() => boolean) | null = null
    let climbUpPastHosts: (() => boolean) | null = null
    let shakeTooltip: (() => void) | null = null

    const syncOptionFromEvent = (
      event: KeyboardEvent | MouseEvent | PointerEvent
    ) => {
      const next = event.altKey
      if (next === optionHeld) return
      const previousLabel = tooltipLabel.textContent ?? ""
      optionHeld = next
      ownerChainDepth = 0
      bustOwnerChainCache()
      if (next) {
        const fiber = hoveredElement ? getFiber(hoveredElement) : null
        const chainLen = fiber ? buildOwnerChain(fiber).length : 0
        if (chainLen > 0 && previousLabel) {
          pushTooltipUnder(previousLabel)
        } else if (tooltip.style.display !== "none") {
          shakeTooltip?.()
        }
      } else {
        clearTooltipStack()
      }
      updateOpenHint()
      if (next) logOptionPress?.()
    }

    paintChrome = () => {
      paintTooltipChrome()
      const fiber = hoveredElement ? getFiber(hoveredElement) : null
      const kind = resolveOpenKind(fiber)
      syncUsedIcon(kind === "used")
    }

    const updateOpenHint = () => {
      const fiber = hoveredElement ? getFiber(hoveredElement) : null
      paintChrome?.()
      if (hoveredElement && tooltip.style.display !== "none" && fiber) {
        paintTooltipForFiber(fiber)
      }
    }

    logOptionPress = () => {
      if (!hoveredElement) return
      const fiber = getFiber(hoveredElement)
      if (!fiber) return
      const chain = buildOwnerChain(fiber)
      const step = chain[ownerChainDepth]
      if (!step) return
      const depthAtRequest = ownerChainDepth
      void refineClimbStep(step).then(() => {
        if (!optionHeld || ownerChainDepth !== depthAtRequest) return
        const display = climbDisplaySource(step)
        if (!display) return
        paintTooltipForFiber(fiber)
      })
    }

    walkOwnerChain = (delta: number) => {
      if (!optionHeld || !hoveredElement || delta <= 0) return
      const fiber = getFiber(hoveredElement)
      if (fiber) {
        const chain = buildOwnerChain(fiber)
        if (chain.length > 0) {
          const next = Math.min(chain.length - 1, ownerChainDepth + delta)
          if (next !== ownerChainDepth) {
            const currentLabel = tooltipLabel.textContent
            if (currentLabel) pushTooltipUnder(currentLabel)

            ownerChainDepth = next
            paintTooltipForFiber(fiber)
            const step = chain[ownerChainDepth]
            updateOpenHint()
            const depthAtRequest = ownerChainDepth
            void refineClimbStep(step).then(() => {
              const display = climbDisplaySource(step)
              if (
                !optionHeld ||
                ownerChainDepth !== depthAtRequest ||
                !display
              ) {
                return
              }
              if (isBundledOrExternalPath(display.filePath)) return
              paintTooltipForFiber(fiber)
            })
            return
          }
        }
      }
      climbUpPastHosts?.()
    }

    let shakeAnimation: Animation | null = null
    const shakeKeyframes = (prefersReducedMotion: boolean): Keyframe[] =>
      prefersReducedMotion
        ? [{ opacity: "1" }, { opacity: "0.45" }, { opacity: "1" }]
        : [
            { transform: "translateX(0)" },
            { transform: "translateX(-4px)" },
            { transform: "translateX(4px)" },
            { transform: "translateX(-2px)" },
            { transform: "translateX(3px)" },
            { transform: "translateX(0)" },
          ]

    const shakeOverlay = () => {
      if (overlay.style.display === "none") return
      shakeAnimation?.cancel()
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      shakeAnimation = overlay.animate(shakeKeyframes(prefersReducedMotion), {
        duration: prefersReducedMotion ? 160 : 260,
        easing: "ease-out",
      })
    }

    shakeTooltip = () => {
      if (tooltip.style.display === "none") return
      shakeAnimation?.cancel()
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      shakeAnimation = tooltip.animate(shakeKeyframes(prefersReducedMotion), {
        duration: prefersReducedMotion ? 160 : 260,
        easing: "ease-out",
      })
    }

    const hide = () => {
      inspectGeneration += 1
      hoveredElement = null
      pendingClickElement = null
      lastTargetRect = null
      ownerChainDepth = 0
      clearTooltipStack()
      pointerPinned = false
      treeNavStack = []
      overlay.style.display = "none"
      tooltip.style.display = "none"
      hideInfo()
      document.body.style.cursor = isActive ? "crosshair" : previousCursor
    }

    const deactivate = () => {
      isActive = false
      optionHeld = false
      ownerChainDepth = 0
      clearTooltipStack()
      hide()
      updateOpenHint()
    }

    const getSource = (fiber: ReactFiber) => {
      let sourcePromise = sourceCache.get(fiber)

      if (!sourcePromise) {
        sourcePromise = resolveSource(fiber, projectRoot, sourceMapCache)
        sourceCache.set(fiber, sourcePromise)
      }

      return sourcePromise
    }

    const getInstanceSource = (fiber: ReactFiber) => {
      let sourcePromise = instanceSourceCache.get(fiber)

      if (!sourcePromise) {
        sourcePromise = resolveInstanceSource(fiber, projectRoot, sourceMapCache)
        instanceSourceCache.set(fiber, sourcePromise)
      }

      return sourcePromise
    }

    const inspect = async (
      target: Element,
      fiber: ReactFiber,
      generation: number
    ) => {
      try {

        const [hostSource, definition, usage] = await Promise.all([
          resolveHostAuthorSource(fiber, projectRoot, sourceMapCache),
          getSource(fiber),
          getInstanceSource(fiber),
        ])

        if (generation !== inspectGeneration || hoveredElement !== target) {
          return
        }

        if (hostSource) {
          instantHostPathCache.set(
            fiber,
            formatPageLabel(hostSource, projectRoot)
          )
        } else {
          instantHostPathCache.delete(fiber)
        }
        if (definition) {
          instantDefinedPathCache.set(
            fiber,
            formatPageLabel(definition, projectRoot)
          )
        } else {
          instantDefinedPathCache.delete(fiber)
        }
        if (usage) {
          instantUsedPathCache.set(fiber, formatPageLabel(usage, projectRoot))
        } else {
          instantUsedPathCache.delete(fiber)
        }
        const chain = buildOwnerChain(fiber)
        await Promise.all(chain.map((step) => refineClimbStep(step)))

        if (generation !== inspectGeneration || hoveredElement !== target) {
          return
        }

        if (!hostSource && !definition && !usage && chain.every((s) => !s.source)) {
          setTooltipLabel("Source unavailable")
          if (lastTargetRect) positionTooltip(lastTargetRect)
          return
        }

        paintTooltipForFiber(fiber)
      } catch {
        if (generation === inspectGeneration && hoveredElement === target) {
          setTooltipLabel("Source unavailable")
          if (lastTargetRect) positionTooltip(lastTargetRect)
        }
      }
    }

    const highlightTarget = (target: Element, exact = false) => {
      const resolved = exact ? target : resolveInspectElement(target)
      if (isInspectorChrome(resolved)) return false

      const fiber = getFiber(resolved)
      if (!fiber) {
        hide()
        return false
      }

      const hasTargetChanged = hoveredElement !== resolved
      hoveredElement = resolved

      const rect = expandRectWithPadding(resolved.getBoundingClientRect(), {
        left: settings.devSpotlightProps.paddingX,
        right: settings.devSpotlightProps.paddingX,
        top: settings.devSpotlightProps.paddingY,
        bottom: settings.devSpotlightProps.paddingY,
      })
      lastTargetRect = rect
      const wasHidden = overlay.style.display === "none"
      const paint = getOverlayPaint(settings)

      if (wasHidden) {
        overlay.style.transition = "none"
        tooltip.style.transition = "none"
      }

      overlay.style.display = "block"
      overlay.style.left = `${rect.left}px`
      overlay.style.top = `${rect.top}px`
      overlay.style.width = `${rect.width}px`
      overlay.style.height = `${rect.height}px`

      tooltip.style.display = "flex"

      if (hasTargetChanged) {
        ownerChainDepth = 0
        bustOwnerChainCache()
        clearTooltipStack()
        infoClimbSelection = null

        paintTooltipForFiber(fiber)

        const generation = (inspectGeneration += 1)
        void inspect(resolved, fiber, generation)

        if (infoVisible) {
          infoTarget = resolved
          void renderInfo(resolved, fiber)
        }
      }

      positionTooltip(rect)

      if (infoVisible && !hasTargetChanged && lastTargetRect) {
        positionInfo(lastTargetRect)
      }

      if (wasHidden && settings.devSpotlightProps.animated) {
        void overlay.offsetWidth
        overlay.style.transition = paint.transition
        tooltip.style.transition = paint.tooltipTransition
      }

      return true
    }

    const SCROLL_MARGIN = 64

    const isElementInViewport = (element: Element) => {
      const rect = element.getBoundingClientRect()
      return (
        rect.bottom > SCROLL_MARGIN &&
        rect.right > SCROLL_MARGIN &&
        rect.top < window.innerHeight - SCROLL_MARGIN &&
        rect.left < window.innerWidth - SCROLL_MARGIN
      )
    }

    const revealAndHighlight = (element: Element, exact = false) => {
      if (!isElementInViewport(element)) {
        const html =
          element instanceof HTMLElement ? element : null
        const previousMargin = html?.style.scrollMargin ?? ""
        if (html) html.style.scrollMargin = `${SCROLL_MARGIN}px`
        element.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "instant",
        })
        if (html) html.style.scrollMargin = previousMargin
      }

      const ok = highlightTarget(element, exact)
      if (ok && hoveredElement) {
        const rect = hoveredElement.getBoundingClientRect()
        pinnedPointerX = rect.left + rect.width / 2
        pinnedPointerY = rect.top + rect.height / 2
      }
      return ok
    }

    moveToParentInspectable = () => {
      if (!hoveredElement) {
        shakeOverlay()
        return false
      }
      const from = hoveredElement
      const next = findParentInspectable(from)
      if (!next || next === from) {
        shakeOverlay()
        return false
      }
      treeNavStack.push(from)
      pointerPinned = true
      const ok = revealAndHighlight(next, true)
      if (!ok || hoveredElement === from) {
        if (treeNavStack[treeNavStack.length - 1] === from) {
          treeNavStack.pop()
        }
        shakeOverlay()
        return false
      }
      return true
    }

    climbUpPastHosts = () => {
      for (let hop = 0; hop < 32; hop += 1) {
        if (!moveToParentInspectable?.()) return false
        if (infoVisible) {
          if (infoTreeMove?.(-1)) return true
          continue
        }
        const fiber = hoveredElement ? getFiber(hoveredElement) : null
        if (fiber && buildOwnerChain(fiber).length > 0) return true
      }
      shakeOverlay()
      return false
    }

    onSettingsChanged = () => {
      if (hoveredElement) highlightTarget(hoveredElement)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isActive) return
      syncOptionFromEvent(event)

      if (infoVisible) return

      if (pointerPinned) {
        const dx = event.clientX - pinnedPointerX
        const dy = event.clientY - pinnedPointerY
        if (dx * dx + dy * dy < 16) return
        pointerPinned = false
        treeNavStack = []
      }

      pinnedPointerX = event.clientX
      pinnedPointerY = event.clientY

      const target = document.elementFromPoint(event.clientX, event.clientY)

      if (!target || isInspectorChrome(target)) return

      if (hoveredElement && lastTargetRect && isPointInRect(event.clientX, event.clientY, lastTargetRect)) {
        const resolved = resolveInspectElement(target)
        if (
          resolved !== hoveredElement &&
          !hoveredElement.contains(resolved)
        ) {
          return
        }
      }

      highlightTarget(target)
    }

    const openSource = async (fiber: ReactFiber) => {
      try {
        const kind = resolveOpenKind(fiber)
        const chainStep =
          infoVisible && infoClimbSelection
            ? infoClimbSelection.step
            : kind === "used"
              ? getActiveChainStep(fiber)
              : null

        let openSourceLoc: SourceLocation | null = null
        let openName =
          getTooltipTitle(fiber, kind) ??
          getDomHoverName(fiber) ??
          getComponentName(fiber) ??
          "element"

        if (chainStep) {
          openName = chainStep.name

          if (chainStep.debugInfo) {
            const pair = await resolveDebugInfoPair(
              chainStep.debugInfo,
              projectRoot,
              sourceMapCache
            )

            chainStep.source = pair.source ?? chainStep.source
            chainStep.definition = pair.renderedBy ?? chainStep.definition
            openSourceLoc = getClimbStepDisplaySource(chainStep)
          } else {
            if (!chainStep.definition) {
              chainStep.definition = await getSource(chainStep.parentFiber)
            }
            if (!chainStep.source) {
              chainStep.source = await getInstanceSource(chainStep.parentFiber)
            }
            openSourceLoc = getClimbStepDisplaySource(chainStep)
          }

          if (
            openSourceLoc &&
            isBundledOrExternalPath(openSourceLoc.filePath)
          ) {
            openSourceLoc = null
          }
        } else {
          openSourceLoc =
            (await resolveHostAuthorSource(
              fiber,
              projectRoot,
              sourceMapCache
            )) ?? getHostAuthorSource(fiber, projectRoot)
        }

        if (openSourceLoc) {
          openInEditor(openSourceLoc, settings.ide)
          if (kind === "used" && !infoVisible) paintTooltipForFiber(fiber)
        } else {

          const hostElement =
            fiber.stateNode instanceof Element ? fiber.stateNode : hoveredElement
          const nearest = hostElement
            ? await resolveNearestAncestorSource(
                hostElement,
                projectRoot,
                sourceMapCache
              )
            : null

          if (nearest) {
            openInEditor(nearest.source, settings.ide)
          } else {
            tooltip.style.display = "flex"
            setTooltipLabel(
              chainStep
                ? `No accurate source for ${formatComponentTag(chainStep.name)}`
                : "Could not resolve source"
            )
          }
        }
      } catch {
        tooltip.style.display = "flex"
        setTooltipLabel("Could not resolve source")
      }
    }

    const warmOpenSource = (fiber: ReactFiber) => {
      void resolveHostAuthorSource(fiber, projectRoot, sourceMapCache)
      const step = optionHeld ? getActiveChainStep(fiber) : null
      if (step) void getInstanceSource(step.parentFiber)
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!isActive || infoVisible) return
      syncOptionFromEvent(event)
      const hit = document.elementFromPoint(event.clientX, event.clientY)
      if (hit && isInspectorChrome(hit)) return
      pendingClickElement = hoveredElement

      if (pendingClickElement) {
        const fiber = getFiber(pendingClickElement)
        if (fiber) warmOpenSource(fiber)
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (!isActive) return

      const clicked = document.elementFromPoint(event.clientX, event.clientY)
      if (clicked && isInspectorChrome(clicked)) return

      event.preventDefault()
      event.stopPropagation()

      if (infoVisible) return

      const target = pendingClickElement ?? hoveredElement ?? clicked
      pendingClickElement = null
      const fiber = target ? getFiber(target) : null
      if (!fiber || !target) return

      syncOptionFromEvent(event)
      void openSource(fiber)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesInspectorShortcut(event, settings.shortcut)) {
        event.preventDefault()
        isActive = !isActive

        if (isActive) {
          document.body.style.cursor = "crosshair"
          syncOptionFromEvent(event)
          updateOpenHint()
        } else {
          deactivate()
        }
        return
      }

      if (!isActive) return

      syncOptionFromEvent(event)

      if (event.key === "Escape") {
        deactivate()
        return
      }

      const isWalkUp =
        event.key === "Shift" ||
        event.code === "ShiftLeft" ||
        event.code === "ShiftRight"
      if (optionHeld && !event.metaKey && isWalkUp) {
        event.preventDefault()
        event.stopPropagation()
        if (event.repeat) return
        walkOwnerChain?.(1)
        return
      }

      if (event.key === "Enter") {
        if (!hoveredElement) return
        const fiber = getFiber(hoveredElement)
        if (!fiber) return
        event.preventDefault()
        event.stopPropagation()
        void openSource(fiber)
        return
      }

      if (event.code === "KeyI" || event.key === "i" || event.key === "I") {
        if (!hoveredElement) return
        event.preventDefault()

        if (infoVisible && infoTarget === hoveredElement) {
          hideInfo()
          return
        }

        const fiber = getFiber(hoveredElement)
        if (!fiber) return

        const liveStep = optionHeld ? getActiveChainStep(fiber) : null
        infoClimbSelection = liveStep
          ? { depth: ownerChainDepth, step: liveStep }
          : null

        infoVisible = true
        infoTarget = hoveredElement

        document.body.style.cursor = "crosshair"

        void renderInfo(hoveredElement, fiber)
        return
      }

      const isMod = event.metaKey || event.ctrlKey

      if (event.altKey && !isMod) {
        const isPadGrow =
          event.code === "Equal" ||
          event.key === "=" ||
          event.key === "+"
        const isPadShrink =
          event.code === "Minus" ||
          event.key === "-" ||
          event.key === "_"

        if (isPadGrow || isPadShrink) {
          event.preventDefault()
          event.stopPropagation()

          const delta = isPadGrow ? 4 : -4
          const { paddingX, paddingY } = settings.devSpotlightProps
          const nextX = Math.min(
            PADDING_MAX,
            Math.max(PADDING_MIN, paddingX + delta)
          )
          const nextY = Math.min(
            PADDING_MAX,
            Math.max(PADDING_MIN, paddingY + delta)
          )

          setDevSpotlightProps({ paddingX: nextX, paddingY: nextY })
          settings = getInspectorSettings()

          if (hoveredElement) {
            highlightTarget(hoveredElement)
            tooltip.style.display = "flex"
            setTooltipLabel(`padding ${nextX} · ${nextY}`)
            if (lastTargetRect) positionTooltip(lastTargetRect)
          }
          return
        }
      }

      const isBracketLeft = event.key === "["
      const isBracketRight = event.key === "]"
      if ((isBracketLeft || isBracketRight) && !isMod && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()

        if (!hoveredElement) {
          shakeOverlay()

          return
        }
        const from = hoveredElement
        let next: Element | null = null

        if (isBracketLeft) {
          moveToParentInspectable?.()
          return
        } else {
          while (treeNavStack.length > 0) {
            const candidate = treeNavStack[treeNavStack.length - 1]!
            if (
              candidate.isConnected &&
              from.contains(candidate) &&
              candidate !== from
            ) {
              treeNavStack.pop()
              next = candidate
              break
            }
            treeNavStack.pop()
          }
          if (!next) {

            let resolvedChild: Element | null = null
            findChildInspectableWhere(from, (candidate) => {
              const resolved = resolveInspectElement(candidate)
              if (resolved !== from && from.contains(resolved)) {
                resolvedChild = resolved
                return true
              }
              return false
            })
            next = resolvedChild ?? findChildInspectable(from)
          }
        }

        if (!next || next === from) {
          shakeOverlay()

          return
        }

        pointerPinned = true

        const ok = revealAndHighlight(next, true)
        if (!ok || hoveredElement === from) {
          if (isBracketLeft && treeNavStack[treeNavStack.length - 1] === from) {
            treeNavStack.pop()
          }
          shakeOverlay()
        }
        return
      }

      if (isMod) {
        const isPadReset =
          event.code === "Backslash" || event.key === "\\"

        if (isPadReset) {
          event.preventDefault()
          event.stopPropagation()

          const nextX = DEFAULT_DEV_SPOTLIGHT_PROPS.paddingX
          const nextY = DEFAULT_DEV_SPOTLIGHT_PROPS.paddingY
          setDevSpotlightProps({ paddingX: nextX, paddingY: nextY })
          settings = getInspectorSettings()

          if (hoveredElement) {
            highlightTarget(hoveredElement)
            tooltip.style.display = "flex"
            setTooltipLabel(`padding reset ${nextX} · ${nextY}`)
            if (lastTargetRect) positionTooltip(lastTargetRect)
          }
          return
        }
      }

      if (
        event.key !== "ArrowUp" &&
        event.key !== "ArrowDown" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight"
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const isModArrow = event.metaKey || event.ctrlKey

      if (
        infoVisible &&
        !isModArrow &&
        (event.key === "ArrowUp" || event.key === "ArrowDown")
      ) {
        const node = infoTreeMove?.(
          event.key === "ArrowUp" ? -1 : 1
        )
        if (!node) {
          if (event.key === "ArrowUp") {
            climbUpPastHosts?.()
          } else {
            shakeOverlay()
          }
        }
        return
      }

      if (!hoveredElement) {
        shakeOverlay()

        return
      }

      let next: Element | null = null
      const isPrev =
        event.key === "ArrowUp" || event.key === "ArrowLeft"
      const isNext =
        event.key === "ArrowDown" || event.key === "ArrowRight"

      if (isPrev) {
        next = isModArrow
          ? findEdgeSiblingInspectable(hoveredElement, "first")
          : findSiblingInspectable(hoveredElement, "prev")
      } else if (isNext) {
        next = isModArrow
          ? findEdgeSiblingInspectable(hoveredElement, "last")
          : findSiblingInspectable(hoveredElement, "next")
      }

      const from = hoveredElement

      if (!next || next === from) {
        shakeOverlay()

        return
      }

      pointerPinned = true
      const ok = revealAndHighlight(next)
      if (ok && hoveredElement !== from) {
        treeNavStack = []
      } else {
        shakeOverlay()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isActive) return
      syncOptionFromEvent(event)
    }

    const handleScroll = () => {
      if (!isActive) return

      if (infoVisible) {
        if (infoTarget) highlightTarget(infoTarget)
        return
      }

      if (pointerPinned && hoveredElement) {
        highlightTarget(hoveredElement)
        return
      }

      const target = document.elementFromPoint(pinnedPointerX, pinnedPointerY)
      if (target && !isInspectorChrome(target)) {
        highlightTarget(target)
      } else {
        hide()
      }
    }

    document.addEventListener("pointermove", handlePointerMove, true)
    document.addEventListener("pointerdown", handlePointerDown, true)
    document.addEventListener("click", handleClick, true)
    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("keyup", handleKeyUp, true)
    window.addEventListener("blur", deactivate)
    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    })

    /**
     * Same resolve path hover + info use: resolveInspectElement → fiber →
     * resolveHostAuthorSource + buildOwnerChain (+ refine). Exposed so the
     * accuracy suite (and other tests) can call it without scraping the DOM.
     *
     *   await window.__inspectUI.inspect(element)
     *   await window.__inspectUI.inspect("#my-button")
     *   await window.__inspectUI.inspect("[data-accuracy-target=default]")
     */
    const inspectProbe = async (input: Element | string) => {
      const hit =
        typeof input === "string" ? document.querySelector(input) : input
      if (!(hit instanceof Element)) return null

      const resolved = resolveInspectElement(hit)
      if (isInspectorChrome(resolved)) return null

      const fiber = getFiber(resolved)
      if (!fiber) return null

      const hostSource =
        (await resolveHostAuthorSource(
          fiber,
          projectRoot,
          sourceMapCache
        )) ?? getHostAuthorSource(fiber, projectRoot)

      const chain = buildOwnerChain(fiber)
      await Promise.all(chain.map((step) => refineClimbStep(step)))

      const hostTag =
        getDomHoverName(fiber) ?? resolved.tagName.toLowerCase()

      const labelOf = (source: SourceLocation | null) =>
        source ? formatPageLabel(source, projectRoot) : null

      const nodes = [
        ...[...chain]
          .map((step) => ({
            name: step.name,
            source: labelOf(getClimbStepDisplaySource(step)),
          }))
          .reverse(),
        {
          name: hostTag,
          source: labelOf(hostSource),
        },
      ]

      return {
        element: resolved,
        host: {
          name: hostTag,
          source: labelOf(hostSource),
          filePath: hostSource?.filePath ?? null,
          line: hostSource?.line ?? null,
          column: hostSource?.column ?? null,
        },
        nodes,
      }
    }

    const probeKey = "__inspectUI" as const
    ;(
      window as Window & {
        __inspectUI?: {
          projectRoot: string
          inspect: typeof inspectProbe
        }
      }
    )[probeKey] = {
      projectRoot,
      inspect: inspectProbe,
    }

    return () => {
      unsubscribe()
      document.removeEventListener("pointermove", handlePointerMove, true)
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("keyup", handleKeyUp, true)
      window.removeEventListener("blur", deactivate)
      window.removeEventListener("scroll", handleScroll, { capture: true })
      delete (
        window as Window & {
          __inspectUI?: unknown
        }
      )[probeKey]
      overlay.remove()
      tooltip.remove()
      info.remove()
      document.body.style.cursor = previousCursor
    }
  }, [projectRoot])

  return null
}

