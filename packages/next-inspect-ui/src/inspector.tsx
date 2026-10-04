"use client"

import { useEffect } from "react"

import { DEFAULT_DEV_SPOTLIGHT_PROPS, formatTooltipLabel, formatComponentTag, formatDomTag, getInspectorSettings, initInspectorSettings, matchesInspectorShortcut, PADDING_MAX, PADDING_MIN, setDevSpotlightProps, setInspectorSettings, subscribeInspectorSettings, type InspectUIProps } from "./lib/index.ts"
import { applyOverlayStyles, getPopoverComponentAncestors, findChildInspectable, findChildInspectableWhere, findEdgeSiblingInspectable, findParentInspectable, findSiblingInspectable, formatPageLabel, getClimbStepDisplaySource, getComponentName, getDirectClimbOwner, getDomHoverName, getFiber, getHostAuthorSource, getInstantDefinedSource, getInstantUsedSource, getNamedTarget, getOwnStackFrames, isBundledOrExternalPath, isClimbUsageBoundary, isCompositeComponentFiber, isDirectFiberChildOf, isDistinctUsedSource, isFrameworkInspectorName, isHostComponentFiber, isInspectorChrome, isPointInRect, openInEditor, preferredSourceFromFrames, readFiberComponentName, resolveDebugInfoPair, resolveDebugInfoPairSync, resolveFirstMappedFrame, resolveHostAuthorSource, resolveInspectElement, resolveInstanceSource, resolveNearestAncestorSource, resolveSource, sourceFromFiberDebugSource, sourceFromStackFrame, type ReactFiber, type ServerDebugInfo, type SourceLocation, type SourceMap } from "./lib/engine.ts"
import { getElementTreeRows, getElementMarkup, getElementText } from "./lib/popover.ts"
import { createOpenSourceIcon } from "./lib/icons.ts"
import overlayCss from "./styles/overlay.css"
import {
  ensureInspectorStyles,
  markInspectNode,
  paintTreePath,
  paintTreeRow,
  setInspectMotion,
} from "./styles/styles.ts"
import { createInspectTooltip, expandRectWithPadding, getInfoPanelPosition } from "./lib/tooltip.ts"

let nextPopoverId = 0

type OpenKind = "used" | "defined"

type OwnerChainStep = {
  name: string
  source: SourceLocation | null
  definition: SourceLocation | null
  parentFiber: ReactFiber
  debugInfo?: ServerDebugInfo
}

export const InspectUI = ({
  projectRoot = "",
  shortcut,
  ide,
  tooltipProps,
  devSpotlightProps,
  popoverProps,
}: InspectUIProps) => {
  const tooltipKey = JSON.stringify(tooltipProps ?? null)
  const defaultTab = popoverProps?.defaultTab ?? "component"
  const spotlightKey = JSON.stringify(devSpotlightProps ?? null)

  useEffect(() => {
    initInspectorSettings()
    if (shortcut || ide || tooltipProps || devSpotlightProps) {
      setInspectorSettings({
        ...(shortcut ? { shortcut } : {}),
        ...(ide ? { ide } : {}),
        tooltipProps,
        devSpotlightProps,
      })
    }
    ensureInspectorStyles(overlayCss)

    const sourceMapCache = new Map<string, Promise<SourceMap>>()
    const sourceCache = new WeakMap<ReactFiber, Promise<SourceLocation | null>>()

    const instanceSourceCache = new WeakMap<ReactFiber, Promise<SourceLocation | null>>()

    const instantDefinedPathCache = new WeakMap<ReactFiber, string>()
    const instantUsedPathCache = new WeakMap<ReactFiber, string>()
    const overlay = document.createElement("div")
    const inspectTooltip = createInspectTooltip()
    const tooltip = inspectTooltip.root
    const ghostOverlay = document.createElement("div")
    markInspectNode(ghostOverlay, "data-dev-inspector-ghost-overlay")
    ghostOverlay.classList.add("next-inspect-ui-overlay")
    ghostOverlay.style.display = "none"
    const info = document.createElement("div")
    const popoverId = `next-inspect-ui-popover-${++nextPopoverId}`
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
    const bustOwnerChainCache = () => { ownerChainCache = new WeakMap() }

    const instantHostPathCache = new WeakMap<ReactFiber, string>()

    type ClimbSelection = { depth: number; step: OwnerChainStep }
    type InfoTreeNode = {
      name: string
      isDom: boolean
      source: SourceLocation | null
      climbIndex: number
      depth: number
      element?: Element
      closingTag?: string
      relation?: string
      pendingSource?: Promise<SourceLocation | null>
    }
    let infoTab: "component" | "element" = defaultTab
    let infoTabChange: ((tab: "component" | "element", focus?: boolean) => void) | null = null
    let infoSelectedNode: InfoTreeNode | null = null
    let infoPinnedNode: InfoTreeNode | null = null
    let infoPreviousFocus: HTMLElement | null = null
    let infoRenderGeneration = 0
    let infoClimbSelection: ClimbSelection | null = null
    let infoTreeMove: ((delta: number) => InfoTreeNode | null) | null = null
    let infoTreeChain: OwnerChainStep[] = []
    let infoTitleEl: HTMLDivElement | null = null
    let infoSourceBox: HTMLDivElement | null = null

    let inspectGeneration = 0
    let settings = getInspectorSettings()
    let lastTargetRect: { left: number; top: number; width: number; height: number } | null = null

    const mk = <T extends HTMLElement = HTMLElement>(
      tag: string,
      name?: string,
      text?: string
    ) => {
      const n = document.createElement(tag) as T
      if (name) markInspectNode(n, name)
      if (text != null) n.textContent = text
      return n
    }
    const relSourcePath = (source: SourceLocation) =>
      projectRoot && source.filePath.startsWith(projectRoot)
        ? source.filePath.slice(projectRoot.length + 1)
        : source.filePath
    const paintSourceBox = (
      box: HTMLElement,
      source: SourceLocation | null,
      label?: string | null
    ) => {
      box.textContent = ""
      if (!source) {
        box.append(mk("span", "data-dev-inspector-source-empty", "Source unavailable"))
        return
      }
      const row = mk("div", "data-dev-inspector-source-row")
      if (label) row.append(mk("span", "data-dev-inspector-source-label", label))
      const path = mk<HTMLButtonElement>("button", "data-dev-inspector-source-path")
      path.type = "button"
      const pathIcon = mk("span", "data-dev-inspector-source-icon")
      pathIcon.append(createOpenSourceIcon())
      const sourceLabel = formatPageLabel(source, projectRoot)
      path.append(mk("span", undefined, settings.tooltipProps.showFullUrl ? sourceLabel : sourceLabel.split(/[\\/]/).pop()!), pathIcon)
      path.onclick = () => openInEditor(source, settings.ide)
      row.append(path)
      box.append(row)
    }

    overlay.setAttribute("aria-hidden", "true")
    markInspectNode(overlay, "data-dev-inspector-overlay")

    const clearTooltipStack = () => inspectTooltip.clearStack()
    const setTooltipLabel = (text: string) => inspectTooltip.setLabel(text)
    const syncUsedIcon = (show: boolean) => inspectTooltip.showUsedIcon(show)
    const positionTooltip = (targetRect: { left: number; top: number; width: number; height: number }) => {
      inspectTooltip.place(targetRect, settings.tooltipProps)
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
        const name = readFiberComponentName(node)
        if (name && !isFrameworkInspectorName(name)) return name
      }
      for (const info of [...(node._debugInfo ?? [])].reverse()) {
        if (info.name && !isFrameworkInspectorName(info.name)) return info.name
      }
      return null
    }
    const findNextNamedOwner = (from: ReactFiber): ReactFiber | null => {
      const seen = new Set<ReactFiber>([from]), queue: ReactFiber[] = []
      if (from._debugOwner) queue.push(from._debugOwner)
      if (from.return && from.return !== from._debugOwner) queue.push(from.return)
      for (let hops = 0; queue.length > 0 && hops < 48; hops += 1) {
        const current = queue.shift()!
        if (seen.has(current)) continue
        seen.add(current)
        if (readFiberDisplayName(current)) return current
        if (current._debugOwner && !seen.has(current._debugOwner)) queue.push(current._debugOwner)
        if (current.return && !seen.has(current.return) && current.return !== current._debugOwner) queue.push(current.return)
      }
      return null
    }

    const resolveUsageSourceInParent = (child: ReactFiber, parent: ReactFiber): SourceLocation | null => {
      const childDef = getInstantDefinedSource(child, projectRoot)
      const fromChild = sourceFromFiberDebugSource(child._debugSource, projectRoot)
      if (fromChild && isDistinctUsedSource(fromChild, childDef)) return fromChild
      for (const frame of getOwnStackFrames(child)) {
        const loc = sourceFromStackFrame(frame, projectRoot)
        if (loc && isDistinctUsedSource(loc, childDef)) return loc
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

    const debugInfoMatchesName = (info: ServerDebugInfo, name: string) =>
      info.name === name || info.owner?.name === name

    const appendRscOwnerSteps = (
      steps: OwnerChainStep[],
      from: ReactFiber,
      parentFiber: ReactFiber,
      seenNames: Set<string>
    ) => {
      let node: ReactFiber | null = from
      for (let hops = 0; node && hops < 12; hops += 1) {
        const infos = node._debugInfo
        if (infos?.length) {
          for (let index = infos.length - 1; index >= 0; index -= 1) {
            let info: ServerDebugInfo | null | undefined = infos[index]
            while (info?.name && !isFrameworkInspectorName(info.name)) {
              if (seenNames.has(info.name)) {
                info = info.owner
                continue
              }
              const resolved = resolveClimbStepSync(parentFiber, from, info)
              steps.push({
                name: info.name,
                source: resolved.source,
                definition: resolved.definition,
                parentFiber,
                debugInfo: resolved.debugInfo,
              })
              seenNames.add(info.name)
              if (
                isRouteFileBoundary(resolved.source, info.name) ||
                isRouteFileBoundary(resolved.definition, info.name)
              ) {
                return true
              }
              info = info.owner
            }
          }
        }
        node = node.return ?? node._debugOwner ?? null
      }
      return false
    }

    const buildOwnerChain = (fiber: ReactFiber): OwnerChainStep[] => {
      const cached = ownerChainCache.get(fiber)
      if (cached) return cached
      const steps: OwnerChainStep[] = []
      const seen = new Set<ReactFiber>(), seenNames = new Set<string>()
      const isHostHover = isHostComponentFiber(fiber) || fiber.stateNode instanceof Element
      let child: ReactFiber, parent: ReactFiber | null = null
      if (isHostHover) {
        const owner = getDirectClimbOwner(fiber)
        if (!owner || (!owner.isSelfDebugOwner && !isDirectFiberChildOf(fiber, owner.fiber))) return []
        const resolved = resolveClimbStepSync(owner.fiber, fiber, owner.debugInfo)
        steps.push({ name: owner.name, source: resolved.source, definition: resolved.definition, parentFiber: owner.fiber, debugInfo: resolved.debugInfo })
        seen.add(owner.fiber)
        seenNames.add(owner.name)
        if (
          isRouteFileBoundary(resolved.source, owner.name) ||
          isRouteFileBoundary(resolved.definition, owner.name)
        ) {
          ownerChainCache.set(fiber, steps)
          return steps
        }
        child = owner.fiber
        parent = findNextNamedOwner(child)
        if (!parent || !isDirectFiberChildOf(child, parent)) {
          appendRscOwnerSteps(steps, fiber, owner.fiber, seenNames)
          if (steps.length > 0) ownerChainCache.set(fiber, steps)
          return steps
        }
      } else {
        const named = getNamedTarget(fiber)?.fiber ?? fiber
        parent = findNextNamedOwner(named)
        if (!parent || !isDirectFiberChildOf(named, parent)) return []
        child = named
      }
      for (let hops = 0; parent && hops < 32; hops += 1) {
        if (seen.has(parent)) break
        seen.add(parent)
        if (!isDirectFiberChildOf(child, parent)) break
        const name = readFiberDisplayName(parent)
        if (!name || isFrameworkInspectorName(name) || (seenNames.has(name) && seen.has(parent))) break
        const debugInfo = [...(parent._debugInfo ?? []), ...(child._debugInfo ?? [])]
          .reverse()
          .find((info) => debugInfoMatchesName(info, name))
        const resolved = resolveClimbStepSync(parent, child, debugInfo)
        steps.push({ name, source: resolved.source, definition: resolved.definition, parentFiber: parent, debugInfo: resolved.debugInfo })
        seenNames.add(name)
        if (isRouteFileBoundary(resolved.source, name) || isRouteFileBoundary(resolved.definition, name) || isClimbUsageBoundary({ usage: resolved.source, definition: resolved.definition })) break
        child = parent
        const next = findNextNamedOwner(parent)
        if (!next || !isDirectFiberChildOf(parent, next)) {
          appendRscOwnerSteps(steps, child, parent, seenNames)
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
      const index = Math.min(Math.max(0, ownerChainDepth), chain.length - 1)
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

    const getCachedPageName = (fiber: ReactFiber, kind: OpenKind) => {
      if (kind === "used") {
        const step = getActiveChainStep(fiber)
        const display = step ? getClimbStepDisplaySource(step) : null
        if (display) return formatPageLabel(display, projectRoot)
        let pageName = instantDefinedPathCache.get(step?.parentFiber ?? fiber) ?? instantUsedPathCache.get(fiber) ?? null
        if (!pageName) {
          const instantSource = getInstantDefinedSource(step?.parentFiber ?? fiber, projectRoot) ?? getInstantUsedSource(step?.parentFiber ?? fiber, projectRoot)
          if (instantSource) { pageName = formatPageLabel(instantSource, projectRoot); instantUsedPathCache.set(fiber, pageName) }
        }
        return pageName
      }
      let pageName = instantHostPathCache.get(fiber) ?? null
      if (!pageName) {
        const instantSource = getHostAuthorSource(fiber, projectRoot)
        if (instantSource) { pageName = formatPageLabel(instantSource, projectRoot); instantHostPathCache.set(fiber, pageName) }
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
      if (infoVisible && infoSelectedNode) { syncInfoTreeSelection(infoSelectedNode); return }
      const kind = resolveOpenKind(fiber)
      const step = kind === "used" ? (infoVisible && infoClimbSelection ? infoClimbSelection.step : getActiveChainStep(fiber)) : null
      const prev = infoClimbSelection
      let infoNeedsRefresh = false
      if (kind === "used" && step) {
        const nextSel = { depth: ownerChainDepth, step }
        infoNeedsRefresh = !prev || prev.depth !== nextSel.depth || prev.step.name !== step.name || prev.step.parentFiber !== step.parentFiber
        infoClimbSelection = nextSel
      } else if (prev && !infoVisible) { infoClimbSelection = null; infoNeedsRefresh = true }
      setTooltipLabel(formatTooltipLabel({
        title: getTooltipTitle(fiber, kind), pageName: getCachedPageName(fiber, kind),
        tooltipProps: settings.tooltipProps, tagStyle: kind === "used" ? "component" : "dom",
      }) || (kind === "used" ? formatComponentTag("Component") : formatDomTag("element")))
      inspectTooltip.showSourceIcon(kind === "used", !!fiber && buildOwnerChain(fiber).length > 0)
      if (lastTargetRect) positionTooltip(lastTargetRect)
      if (infoNeedsRefresh && infoVisible && infoTarget && hoveredElement === infoTarget) void renderInfo(infoTarget, fiber)
    }

    info.setAttribute("aria-hidden", "true")
    markInspectNode(info, "data-dev-inspector-info")
    const paintTooltipChrome = () => {
      applyOverlayStyles(overlay, tooltip, settings)
      applyOverlayStyles(ghostOverlay, tooltip, {
        ...settings,
        devSpotlightProps: { ...settings.devSpotlightProps, strokeStyle: "dotted", strokeWidth: 2 },
      })

    }

    paintTooltipChrome()
    document.body.append(overlay, tooltip, ghostOverlay, info)

    let onSettingsChanged: (() => void) | null = null
    let paintChrome: (() => void) | null = null
    const unsubscribe = subscribeInspectorSettings(() => {
      settings = getInspectorSettings()
      paintChrome?.()
      onSettingsChanged?.()
    })

    const positionInfo = (targetRect: { left: number; top: number; width: number; height: number }) => {
      const pos = getInfoPanelPosition({
        target: targetRect,
        panelWidth: info.offsetWidth,
        panelHeight: info.offsetHeight,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      })
      info.style.left = `${pos.left}px`
      info.style.top = `${pos.top}px`
    }

    const clearGhost = () => {
      ghostOverlay.style.display = "none"
    }
    const paintGhost = (node: InfoTreeNode) => {
      const elements: Element[] = []
      if (node.element) {
        if (node.element === infoTarget) { clearGhost(); return }
        elements.push(node.element)
      } else if (!node.isDom) {
        const root = infoTreeChain[node.climbIndex]?.parentFiber
        const collect = (fiber: ReactFiber) => {
          if (fiber.stateNode instanceof Element) {
            if (fiber.stateNode.isConnected) elements.push(fiber.stateNode)
            return
          }
          for (let child = fiber.child; child; child = (child as ReactFiber & { sibling?: ReactFiber | null }).sibling ?? null) collect(child)
        }
        if (root) collect(root)
      }
      const boxes = elements.map(element => element.getBoundingClientRect()).filter(box => box.width > 0 && box.height > 0)
      if (!boxes.length) { clearGhost(); return }
      const left = Math.min(...boxes.map(box => box.left))
      const top = Math.min(...boxes.map(box => box.top))
      const right = Math.max(...boxes.map(box => box.right))
      const bottom = Math.max(...boxes.map(box => box.bottom))
      const rect = expandRectWithPadding({ left, top, width: right - left, height: bottom - top }, {
        left: 0, right: 0, top: 0, bottom: 0,
      })
      ghostOverlay.style.borderRadius = elements.length === 1 ? getComputedStyle(elements[0]!).borderRadius : "0px"
      Object.assign(ghostOverlay.style, { display: "block", left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` })

    }
    const openInfoNode = (node: InfoTreeNode) => {
      void (node.pendingSource ?? Promise.resolve(node.source)).then(source => {
        if (source && infoVisible) openInEditor(source, settings.ide)
      }).catch(() => {})
    }
    const hideInfo = () => {
      clearGhost()
      if (info.contains(document.activeElement)) infoPreviousFocus?.focus({ preventScroll: true })
      infoRenderGeneration += 1
      infoPreviousFocus = null
      infoSelectedNode = null
      infoPinnedNode = null
      infoTabChange = null
      infoVisible = false
      infoTarget = null
      infoClimbSelection = null
      infoTreeMove = null
      infoTreeChain = []
      infoTitleEl = null
      infoSourceBox = null
      info.setAttribute("aria-hidden", "true")
      info.style.display = "none"
      if (isActive) {
        document.body.style.cursor = "crosshair"
        const fiber = hoveredElement ? getFiber(hoveredElement) : null
        if (fiber) paintTooltipForFiber(fiber)
      }
    }

    const reposition = () => {
      if (lastTargetRect) positionInfo(lastTargetRect)
    }


    const syncInfoTreeSelection = (node: InfoTreeNode) => {
      infoSelectedNode = node
      if (infoTitleEl) infoTitleEl.textContent = node.isDom ? formatDomTag(node.name) : formatComponentTag(node.name)
      if (infoSourceBox) paintSourceBox(infoSourceBox, node.source)
      if (infoTab === "element") {
        infoClimbSelection = null
        paintGhost(node)
      } else {
        paintGhost(node)
        const step = node.isDom ? null : infoTreeChain[node.climbIndex]
        infoClimbSelection = step ? { depth: node.climbIndex, step } : null
        const targetFiber = infoTarget ? getFiber(infoTarget) : null
        const canClimb = !!targetFiber && buildOwnerChain(targetFiber).length > 0
        if (node.isDom || (canClimb && node.climbIndex === 0)) {
          setTooltipLabel(formatTooltipLabel({
            title: node.name,
            pageName: node.source ? formatPageLabel(node.source, projectRoot) : null,
            tooltipProps: settings.tooltipProps,
            tagStyle: node.isDom ? "dom" : "component",
          }) || (node.isDom ? formatDomTag(node.name) : formatComponentTag(node.name)))
          inspectTooltip.showSourceIcon(!node.isDom, canClimb)
          if (lastTargetRect) positionTooltip(lastTargetRect)
        }
      }
    }

    const createInfoTreeSection = (nodes: InfoTreeNode[], initialIndex: number, label: string) => {
      const originalNodes = nodes
      const initialNode = nodes[initialIndex]!
      if (nodes.some(node => node.element)) {
        const expanded: InfoTreeNode[] = []
        const stack: InfoTreeNode[] = []
        const close = (depth: number) => {
          while (stack.length && stack[stack.length - 1]!.depth >= depth) {
            const node = stack.pop()!
            expanded.push({ ...node, closingTag: getElementMarkup(node.element!).closing })
          }
        }
        nodes.forEach((node, index) => {
          close(node.depth)
          expanded.push(node)
          if (nodes[index + 1] && nodes[index + 1]!.depth > node.depth && getElementMarkup(node.element!).closing) stack.push(node)
        })
        close(0)
        nodes = expanded
        initialIndex = nodes.indexOf(initialNode)
      }
      const section = mk("div", "data-dev-inspector-owner-tree")
      const tree = mk("div", "data-dev-inspector-tree")
      tree.setAttribute("role", "tree")
      tree.setAttribute("aria-label", label)
      let selectedIndex = initialIndex
      const paths: HTMLButtonElement[] = []
      const paintPath = (path: HTMLButtonElement, node: InfoTreeNode) => {
        path.disabled = !node.source
        path.textContent = node.source ? `${node.source.filePath.split(/[\\/]/).pop()}:${node.source.line}` : "…"
        path.title = node.source ? `Open ${formatPageLabel(node.source, projectRoot)}` : "Source unavailable"
        paintTreePath(path, node.source ? "open" : "empty")
      }
      const select = (index: number, focus = true) => {
        selectedIndex = index
        paint(focus)
        syncInfoTreeSelection(nodes[index]!)
      }
      const paint = (focus = false) => {
        const hadFocus = tree.contains(document.activeElement)
        tree.textContent = ""
        nodes.forEach((node, index) => {
          const active = index === selectedIndex
          const row = mk<HTMLDivElement>("div", "data-dev-inspector-tree-row")
          paintTreeRow(row, active)
          row.setAttribute("role", "treeitem")
          row.setAttribute("aria-selected", String(active))
          row.setAttribute("aria-level", String(node.depth + 1))
          row.tabIndex = active ? 0 : -1
          const indent = mk("span", "data-dev-inspector-tree-indent")
          indent.style.setProperty("--inspect-tree-depth", String(node.depth))
          const nameEl = mk("span", "data-dev-inspector-tree-name", node.isDom ? formatDomTag(node.name) : formatComponentTag(node.name))
          const pathEl = mk<HTMLButtonElement>("button", "data-dev-inspector-tree-path")
          pathEl.type = "button"
          pathEl.tabIndex = active ? 0 : -1
          paths[index] = pathEl
          if (node.element) {
            row.classList.add("next-inspect-ui-html-row")
            const markup = getElementMarkup(node.element)
            const hasVisibleChildren = !!nodes[index + 1]?.element && nodes[index + 1]!.depth > node.depth
            const text = getElementText(node.element)
            nameEl.textContent = node.closingTag ?? `${markup.opening}${text ? ` ${text} ` : ""}${hasVisibleChildren ? "" : markup.closing}`
            nameEl.title = markup.opening
            pathEl.textContent = "…"
            pathEl.classList.add("next-inspect-ui-element-select")
            pathEl.setAttribute("aria-label", `Select ${node.name} element`)
            pathEl.title = "Select this element"
          } else paintPath(pathEl, node)
          pathEl.onclick = (event) => {
            event.preventDefault(); event.stopPropagation()
            if (node.element) openInfoNode(node)
            else if (node.source) openInEditor(node.source, settings.ide)
          }
          row.append(indent, nameEl)
          if (!node.element) row.append(pathEl)
          row.onclick = (event) => {
            if (pathEl.contains(event.target as Node)) return
            event.preventDefault()
            if (node.element) openInfoNode(node)
            else select(index)
          }
          row.onfocus = () => {
            if (selectedIndex !== index) select(index)
          }
          tree.append(row)
          if (active && (focus || hadFocus)) {
            row.focus({ preventScroll: true })
            row.scrollIntoView({ block: "nearest" })
          }
        })
      }
      paint()
      section.append(tree)
      syncInfoTreeSelection(nodes[selectedIndex]!)
      return {
        section,
        moveSelection: (delta: number): InfoTreeNode | null => {
          const next = delta === -Infinity ? 0 : delta === Infinity ? nodes.length - 1 : selectedIndex + delta
          if (next < 0 || next >= nodes.length) return null
          select(next)
          return nodes[next]!
        },
        focusSelection: () => {
          tree.querySelector<HTMLElement>('[aria-selected="true"]')?.focus({ preventScroll: true })
        },
        setSource: (index: number, source: SourceLocation | null) => {
          const original = originalNodes[index]!
          original.source = source
          nodes.forEach(node => { if (node.element && node.element === original.element) node.source = source })
          if (!infoVisible || !info.contains(tree)) return
          const rowIndex = nodes.indexOf(original)
          if (!original.element) paintPath(paths[rowIndex]!, original)
          if (nodes[selectedIndex] === original || nodes[selectedIndex]?.element === original.element || original === infoPinnedNode) syncInfoTreeSelection(nodes[selectedIndex]!)
          reposition()
        },
      }
    }

    const refineInfoStep = async (step: OwnerChainStep) => {
      if (step.debugInfo) {
        const pair = await resolveDebugInfoPair(step.debugInfo, projectRoot, sourceMapCache)
        if (pair.source) step.source = pair.source
        if (pair.renderedBy) step.definition = pair.renderedBy
        return
      }
      if (!step.definition) {
        const def = await getSource(step.parentFiber)
        if (def && !isBundledOrExternalPath(def.filePath)) step.definition = def
      }
      if (!step.source) {
        const usage = await getInstanceSource(step.parentFiber)
        if (usage && !isBundledOrExternalPath(usage.filePath)) step.source = usage
      }
    }
    const renderInfo = async (target: Element, fiber: ReactFiber | null) => {
      const generation = ++infoRenderGeneration
      const hostTag = (fiber ? getDomHoverName(fiber) : null) ?? target.tagName.toLowerCase()
      const hostSource = fiber ? getHostAuthorSource(fiber, projectRoot) : null
      const chain = (fiber ? getPopoverComponentAncestors(fiber) : []).map(({ name, fiber: parentFiber, debugInfo }) => ({
        name, parentFiber, ...resolveClimbStepSync(parentFiber, fiber!, debugInfo),
      }))
      infoTreeChain = chain
      const componentNodes: InfoTreeNode[] = [
        { name: hostTag, isDom: true, source: hostSource, climbIndex: -1, depth: 0,
          pendingSource: fiber ? resolveHostAuthorSource(fiber, projectRoot, sourceMapCache) : Promise.resolve(null) },
        ...chain.map((step, climbIndex) => ({
          name: step.name, isDom: false, source: getClimbStepDisplaySource(step), climbIndex,
          depth: climbIndex + 1,
          pendingSource: refineInfoStep(step).then(() => getClimbStepDisplaySource(step)),
        })),
      ]
      const elementNodes: InfoTreeNode[] = getElementTreeRows(target).map(({ element, depth, relation }) => {
        const elementFiber = getFiber(element)
        return {
          element, name: element.tagName.toLowerCase(), isDom: true, climbIndex: -1, depth, relation,
          source: elementFiber ? getHostAuthorSource(elementFiber, projectRoot) : null,
          pendingSource: elementFiber ? resolveHostAuthorSource(elementFiber, projectRoot, sourceMapCache) : Promise.resolve(null),
        }
      })
      if (!infoVisible || infoTarget !== target) return
      infoPinnedNode = elementNodes.find(node => node.relation === "current") ?? null
      info.textContent = ""
      info.setAttribute("role", "dialog")
      info.setAttribute("aria-label", "Inspector trees")
      info.setAttribute("aria-hidden", "false")
      infoTitleEl = mk<HTMLDivElement>("div", "data-dev-inspector-info-title")
      infoSourceBox = mk<HTMLDivElement>("div", "data-dev-inspector-source-box")
      infoTitleEl.textContent = formatDomTag(hostTag)
      info.append(infoTitleEl, infoSourceBox)
      const tabs = mk("div", "data-dev-inspector-info-tabs")
      tabs.setAttribute("role", "tablist")
      tabs.setAttribute("aria-label", "Tree view")
      const panel = mk("div", "data-dev-inspector-info-panel")
      panel.id = `${popoverId}-panel`
      panel.setAttribute("role", "tabpanel")
      const tabButtons = new Map<"component" | "element", HTMLButtonElement>()
      const trees = new Map<"component" | "element", ReturnType<typeof createInfoTreeSection>>()
      const showTab = (tab: "component" | "element", focus = false) => {
        infoTab = tab
        tabButtons.forEach((button, key) => {
          button.setAttribute("aria-selected", String(key === tab))
          button.tabIndex = key === tab ? 0 : -1
        })
        panel.setAttribute("aria-labelledby", `${popoverId}-${tab}`)
        let tree = trees.get(tab)
        if (!tree) {
          const nodes = tab === "component" ? componentNodes : elementNodes
          const initial = tab === "component"
            ? optionHeld && fiber && buildOwnerChain(fiber).length && chain.length ? 1 : 0
            : elementNodes.findIndex(node => node.relation === "current")
          tree = createInfoTreeSection(nodes, initial, tab === "component" ? "Component tree" : "Element tree")
          trees.set(tab, tree)
          nodes.forEach((node, index) => {
            void node.pendingSource?.then(source => {
              if (generation === infoRenderGeneration) {
              tree!.setSource(index, source)
            }
            }).catch(() => {})
          })
        }
        panel.replaceChildren(tree.section)
        infoTreeMove = tree.moveSelection
        // Restore this tab's selected row without changing the selection.
        tree.moveSelection(0)
        if (focus) tabButtons.get(tab)?.focus({ preventScroll: true })
        reposition()
      }
      for (const [tab, label] of [["component", "Component"], ["element", "Element"]] as const) {
        const button = mk<HTMLButtonElement>("button", "data-dev-inspector-info-tab", label)
        button.type = "button"
        button.id = `${popoverId}-${tab}`
        button.setAttribute("role", "tab")
        button.setAttribute("aria-controls", panel.id)
        button.onclick = () => showTab(tab, true)
        tabButtons.set(tab, button)
        tabs.append(button)
      }
      info.append(tabs, panel)
      info.append(mk("div", "data-dev-inspector-info-hint", "← → tabs · ↑ ↓ preview · ⌘/Ctrl ↑ ↓ first / last · Enter open · Space close"))
      infoTabChange = showTab
      info.style.display = "block"
      info.style.pointerEvents = "auto"
      showTab(infoTab)
      trees.get(infoTab)?.focusSelection()
      reposition()
    }

    const refineClimbStep = async (step: OwnerChainStep) => {
      if (step.source && !isBundledOrExternalPath(step.source.filePath) && isClimbUsageBoundary({ usage: step.source, definition: step.definition })) return
      if (!step.debugInfo) {
        let carrier: ReactFiber | null = step.parentFiber
        for (let hops = 0; carrier && hops < 8; hops += 1, carrier = carrier._debugOwner ?? null) {
          for (const info of [...(carrier._debugInfo ?? [])].reverse()) {
            if (!info?.name || info.name !== step.name) continue
            const pair = await resolveDebugInfoPair(info, projectRoot, sourceMapCache)
            if (pair.source && !isBundledOrExternalPath(pair.source.filePath)) {
              step.source = pair.source
              if (pair.renderedBy) step.definition = pair.renderedBy
              return
            }
          }
        }
      }
      if (step.debugInfo) {
        const pair = await resolveDebugInfoPair(step.debugInfo, projectRoot, sourceMapCache)
        if (pair.source) step.source = pair.source
        if (pair.renderedBy) step.definition = pair.renderedBy
        return
      }
      const ownCreation = await resolveFirstMappedFrame(getOwnStackFrames(step.parentFiber), projectRoot, sourceMapCache, getComponentName(step.parentFiber))
      if (ownCreation && !isBundledOrExternalPath(ownCreation.filePath)) { step.source = ownCreation; return }
      if (!step.source) {
        const stepUsage = await getInstanceSource(step.parentFiber)
        if (stepUsage && !isBundledOrExternalPath(stepUsage.filePath)) step.source = stepUsage
      }
      if (!step.definition) {
        const stepDef = await getSource(step.parentFiber)
        if (stepDef && !isBundledOrExternalPath(stepDef.filePath)) step.definition = stepDef
      }
    }


    const refineOwnerChain = async (fiber: ReactFiber, host: SourceLocation | null) => {
      const chain = buildOwnerChain(fiber)
      await Promise.all(chain.map((step) => refineClimbStep(step)))
      const boundary = chain.findIndex((step) => isRouteFileBoundary(step.source, step.name) || isClimbUsageBoundary({
        usage: step.source, definition: step.definition, host,
      }))
      if (boundary >= 0) chain.splice(boundary + 1)
      return chain
    }

    let logOptionPress: (() => void) | null = null
    let moveToParentInspectable: (() => boolean) | null = null
    let shakeTooltip: (() => void) | null = null

    const syncOptionFromEvent = (event: KeyboardEvent | MouseEvent | PointerEvent) => {
      const next = event.altKey
      if (next === optionHeld) return
      optionHeld = next; ownerChainDepth = 0; bustOwnerChainCache()
      if (infoVisible) return
      if (next) {
        const fiber = hoveredElement ? getFiber(hoveredElement) : null
        const chainLen = fiber ? buildOwnerChain(fiber).length : 0
        if (chainLen === 0 && inspectTooltip.isOpen()) shakeTooltip?.()
      } else clearTooltipStack()
      updateOpenHint()
      if (next) logOptionPress?.()
    }

    paintChrome = () => {
      paintTooltipChrome()
      const fiber = hoveredElement ? getFiber(hoveredElement) : null
      const kind = resolveOpenKind(fiber)
      if (!infoVisible) inspectTooltip.showSourceIcon(kind === "used", !!fiber && buildOwnerChain(fiber).length > 0)
    }

    const updateOpenHint = () => {
      const fiber = hoveredElement ? getFiber(hoveredElement) : null
      paintChrome?.()
      if (hoveredElement && inspectTooltip.isOpen() && fiber) {
        paintTooltipForFiber(fiber)
      }
    }

    const refineActiveStep = (fiber: ReactFiber, step: OwnerChainStep, depthAtRequest: number, checkBundled = false) => {
      void refineClimbStep(step).then(() => {
        if (!optionHeld || ownerChainDepth !== depthAtRequest) return
        const display = getClimbStepDisplaySource(step)
        if (!display || (checkBundled && isBundledOrExternalPath(display.filePath))) return
        paintTooltipForFiber(fiber)
      })
    }
    logOptionPress = () => {
      if (!hoveredElement) return
      const fiber = getFiber(hoveredElement)
      if (!fiber) return
      const step = buildOwnerChain(fiber)[ownerChainDepth]
      if (!step) return
      refineActiveStep(fiber, step, ownerChainDepth)
    }

    let shakeAnimation: Animation | null = null
    const shakeEl = (el: HTMLElement) => {
      if (el.style.display === "none") return
      shakeAnimation?.cancel()
      const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      shakeAnimation = el.animate(
        rm
          ? [{ opacity: "1" }, { opacity: "0.45" }, { opacity: "1" }]
          : [
              { transform: "translateX(0)" },
              { transform: "translateX(-4px)" },
              { transform: "translateX(4px)" },
              { transform: "translateX(-2px)" },
              { transform: "translateX(3px)" },
              { transform: "translateX(0)" },
            ],
        { duration: rm ? 160 : 260, easing: "ease-out" }
      )
    }
    const shakeOverlay = () => shakeEl(overlay)
    shakeTooltip = () => shakeEl(tooltip)

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
      inspectTooltip.hide()
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

    const cachedResolve = (
      fiber: ReactFiber,
      cache: WeakMap<ReactFiber, Promise<SourceLocation | null>>,
      resolve: (f: ReactFiber) => Promise<SourceLocation | null>
    ) => {
      let p = cache.get(fiber)
      if (!p) { p = resolve(fiber); cache.set(fiber, p) }
      return p
    }
    const getSource = (fiber: ReactFiber) =>
      cachedResolve(fiber, sourceCache, (f) => resolveSource(f, projectRoot, sourceMapCache))
    const getInstanceSource = (fiber: ReactFiber) =>
      cachedResolve(fiber, instanceSourceCache, (f) => resolveInstanceSource(f, projectRoot, sourceMapCache))

    const inspect = async (target: Element, fiber: ReactFiber, generation: number) => {
      const stale = () => generation !== inspectGeneration || hoveredElement !== target
      try {
        const [hostSource, definition, usage] = await Promise.all([
          resolveHostAuthorSource(fiber, projectRoot, sourceMapCache), getSource(fiber), getInstanceSource(fiber),
        ])
        if (stale()) return
        const setPath = (cache: WeakMap<ReactFiber, string>, loc: SourceLocation | null) => {
          if (loc) cache.set(fiber, formatPageLabel(loc, projectRoot)); else cache.delete(fiber)
        }
        setPath(instantHostPathCache, hostSource); setPath(instantDefinedPathCache, definition); setPath(instantUsedPathCache, usage)
        const chain = await refineOwnerChain(fiber, hostSource)
        if (stale()) return
        if (!hostSource && !definition && !usage && chain.every((s) => !s.source)) {
          setTooltipLabel("Source unavailable"); if (lastTargetRect) positionTooltip(lastTargetRect); return
        }
        paintTooltipForFiber(fiber)
      } catch {
        if (!stale()) { setTooltipLabel("Source unavailable"); if (lastTargetRect) positionTooltip(lastTargetRect) }
      }
    }

    const highlightTarget = (target: Element, exact = false) => {
      const resolved = exact ? target : resolveInspectElement(target)
      if (isInspectorChrome(resolved)) return false
      const fiber = getFiber(resolved)
      if (!fiber && !(infoVisible && exact)) { hide(); return false }
      const hasTargetChanged = hoveredElement !== resolved
      hoveredElement = resolved
      const rect = expandRectWithPadding(resolved.getBoundingClientRect(), {
        left: 0, right: 0, top: 0, bottom: 0,
      })
      const corners = getComputedStyle(resolved)
      overlay.style.borderRadius = corners.borderRadius
      overlay.style.setProperty("corner-shape", corners.getPropertyValue("corner-shape"))
      lastTargetRect = rect
      const wasHidden = overlay.style.display === "none"
      if (wasHidden) setInspectMotion(overlay, tooltip, false)
      overlay.style.display = "block"
      overlay.style.left = `${rect.left}px`
      overlay.style.top = `${rect.top}px`
      overlay.style.width = `${rect.width}px`
      overlay.style.height = `${rect.height}px`
      inspectTooltip.show()
      if (hasTargetChanged) {
        ownerChainDepth = 0; bustOwnerChainCache(); clearTooltipStack(); infoClimbSelection = null
        if (fiber) {
          paintTooltipForFiber(fiber)
          void inspect(resolved, fiber, inspectGeneration += 1)
        }
        if (infoVisible) { infoTarget = resolved; void renderInfo(resolved, fiber) }
      }
      positionTooltip(rect)
      if (infoVisible && !hasTargetChanged && lastTargetRect) positionInfo(lastTargetRect)
      if (wasHidden && settings.devSpotlightProps.animated) {
        void overlay.offsetWidth
        applyOverlayStyles(overlay, tooltip, settings)
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
        const chainStep = infoVisible && infoClimbSelection ? infoClimbSelection.step : kind === "used" ? getActiveChainStep(fiber) : null
        let openSourceLoc: SourceLocation | null = null
        if (chainStep) {
          if (chainStep.debugInfo) {
            const pair = await resolveDebugInfoPair(chainStep.debugInfo, projectRoot, sourceMapCache)
            chainStep.source = pair.source ?? chainStep.source
            chainStep.definition = pair.renderedBy ?? chainStep.definition
          } else {
            if (!chainStep.definition) chainStep.definition = await getSource(chainStep.parentFiber)
            if (!chainStep.source) chainStep.source = await getInstanceSource(chainStep.parentFiber)
          }
          openSourceLoc = getClimbStepDisplaySource(chainStep)
          if (openSourceLoc && isBundledOrExternalPath(openSourceLoc.filePath)) openSourceLoc = null
        } else {
          openSourceLoc = (await resolveHostAuthorSource(fiber, projectRoot, sourceMapCache)) ?? getHostAuthorSource(fiber, projectRoot)
        }
        if (openSourceLoc) {
          openInEditor(openSourceLoc, settings.ide)
          if (kind === "used" && !infoVisible) paintTooltipForFiber(fiber)
          return
        }
        const hostElement = fiber.stateNode instanceof Element ? fiber.stateNode : hoveredElement
        const nearest = hostElement ? await resolveNearestAncestorSource(hostElement, projectRoot, sourceMapCache) : null
        if (nearest) openInEditor(nearest.source, settings.ide)
        else {
          inspectTooltip.show()
          setTooltipLabel(chainStep ? `No accurate source for ${formatComponentTag(chainStep.name)}` : "Could not resolve source")
        }
      } catch {
        inspectTooltip.show()
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

      if (infoVisible) {
        const node = infoSelectedNode
        if (node && ghostOverlay.style.display !== "none") {
          const rect = ghostOverlay.getBoundingClientRect()
          if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) openInfoNode(node)
        }
        return
      }

      const target = pendingClickElement ?? hoveredElement ?? clicked
      pendingClickElement = null
      const fiber = target ? getFiber(target) : null
      if (!fiber || !target) return

      syncOptionFromEvent(event)
      void openSource(fiber)
    }

    const navOrShake = (next: Element | null, from: Element, exact = false) => {
      if (!next || next === from) { shakeOverlay(); return false }
      pointerPinned = true
      const ok = revealAndHighlight(next, exact)
      if (!ok || hoveredElement === from) { shakeOverlay(); return false }
      return true
    }
    const findBracketChild = (from: Element) => {
      while (treeNavStack.length > 0) {
        const candidate = treeNavStack[treeNavStack.length - 1]!
        treeNavStack.pop()
        if (candidate.isConnected && from.contains(candidate) && candidate !== from) return candidate
      }
      let resolvedChild: Element | null = null
      findChildInspectableWhere(from, (candidate) => {
        const resolved = resolveInspectElement(candidate)
        if (resolved !== from && from.contains(resolved)) { resolvedChild = resolved; return true }
        return false
      })
      return resolvedChild ?? findChildInspectable(from)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesInspectorShortcut(event, settings.shortcut)) {
        event.preventDefault()
        isActive = !isActive
        if (isActive) { document.body.style.cursor = "crosshair"; syncOptionFromEvent(event); updateOpenHint() }
        else deactivate()
        return
      }
      if (!isActive) return
      syncOptionFromEvent(event)
      if (event.key === "Escape") { deactivate(); return }
      if (event.key === "Enter") {
        if (infoVisible && infoSelectedNode) {
          event.preventDefault(); event.stopPropagation()
          const node = infoSelectedNode
          void (node.pendingSource ?? Promise.resolve(node.source)).then(source => {
            if (source && infoVisible && infoSelectedNode === node) openInEditor(source, settings.ide)
          }).catch(() => {})
          return
        }
        if (!hoveredElement) return
        const fiber = getFiber(hoveredElement)
        if (!fiber) return
        event.preventDefault(); event.stopPropagation(); void openSource(fiber)
        return
      }
      if (event.code === "Space" || event.key === " ") {
        if (!hoveredElement) return
        event.preventDefault()
        if (infoVisible && infoTarget === hoveredElement) { hideInfo(); return }
        const fiber = getFiber(hoveredElement)
        if (!fiber) return
        infoTab = defaultTab
        infoPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
        infoVisible = true; infoTarget = hoveredElement; document.body.style.cursor = "crosshair"
        void renderInfo(hoveredElement, fiber)
        return
      }
      const isMod = event.metaKey || event.ctrlKey
      const parentKey = event.code === "BracketLeft" || event.key === "[" || event.key === "{"
      const childKey = event.code === "BracketRight" || event.key === "]" || event.key === "}"
      if ((parentKey || childKey) && !isMod && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        if (!hoveredElement) { shakeOverlay(); return }
        if (parentKey) { moveToParentInspectable?.(); return }
        navOrShake(findBracketChild(hoveredElement), hoveredElement, true)
        return
      }

      if (!/Arrow(U|D|L|R)/.test(event.code)) return
      event.preventDefault()
      event.stopPropagation()
      const isModArrow = event.metaKey || event.ctrlKey
      const up = event.key === "ArrowUp", down = event.key === "ArrowDown"
      const prev = up || event.key === "ArrowLeft", nextKey = down || event.key === "ArrowRight"
      if (infoVisible) {
        if (up || down) infoTreeMove?.(isModArrow ? (up ? -Infinity : Infinity) : (up ? -1 : 1))
        else infoTabChange?.(infoTab === "component" ? "element" : "component", true)
        return
      }
      if (!hoveredElement) { shakeOverlay(); return }
      const from = hoveredElement
      const next = prev
        ? (isModArrow ? findEdgeSiblingInspectable(from, "first") : findSiblingInspectable(from, "prev"))
        : nextKey
          ? (isModArrow ? findEdgeSiblingInspectable(from, "last") : findSiblingInspectable(from, "next"))
          : null
      if (navOrShake(next, from)) treeNavStack = []
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isActive) return
      syncOptionFromEvent(event)
    }

    const handleScroll = () => {
      if (!isActive) return

      if (infoVisible) {
        if (infoTarget) highlightTarget(infoTarget, true)
        if (infoSelectedNode) paintGhost(infoSelectedNode)
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

    const inspectProbe = async (input: Element | string) => {
      const hit = typeof input === "string" ? document.querySelector(input) : input
      if (!(hit instanceof Element)) return null
      const resolved = resolveInspectElement(hit)
      if (isInspectorChrome(resolved)) return null
      const fiber = getFiber(resolved)
      if (!fiber) return null
      const hostSource = (await resolveHostAuthorSource(fiber, projectRoot, sourceMapCache)) ?? getHostAuthorSource(fiber, projectRoot)
      const chain = await refineOwnerChain(fiber, hostSource)
      const hostTag = getDomHoverName(fiber) ?? resolved.tagName.toLowerCase()
      const labelOf = (source: SourceLocation | null) => (source ? formatPageLabel(source, projectRoot) : null)
      const nodes = [
        ...[...chain].map((step) => ({ name: step.name, source: labelOf(getClimbStepDisplaySource(step)) })).reverse(),
        { name: hostTag, source: labelOf(hostSource) },
      ]
      return {
        element: resolved,
        host: { name: hostTag, source: labelOf(hostSource), filePath: hostSource?.filePath ?? null, line: hostSource?.line ?? null, column: hostSource?.column ?? null },
        nodes,
      }
    }


    ;(window as Window & { __inspectUI?: { projectRoot: string; inspect: typeof inspectProbe } }).__inspectUI = {
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
      delete (window as Window & { __inspectUI?: unknown }).__inspectUI
      overlay.remove()
      tooltip.remove()
      ghostOverlay.remove()
      info.remove()
      document.body.style.cursor = previousCursor
    }
  }, [projectRoot, shortcut, ide, tooltipKey, spotlightKey, defaultTab])

  return null
}
