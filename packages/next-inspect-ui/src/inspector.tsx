"use client"

import { useEffect } from "react"

import { DEFAULT_DEV_SPOTLIGHT_PROPS, formatTooltipLabel, formatComponentTag, formatDomTag, getInspectorSettings, initInspectorSettings, matchesInspectorShortcut, PADDING_MAX, PADDING_MIN, setDevSpotlightProps, subscribeInspectorSettings } from "./lib.ts"
import { applyOverlayStyles, createStylesSection, findChildInspectable, findChildInspectableWhere, findEdgeSiblingInspectable, findParentInspectable, findSiblingInspectable, formatPageLabel, getClimbStepDisplaySource, getComponentName, getDirectClimbOwner, getDomHoverName, getFiber, getHostAuthorSource, getInstantDefinedSource, getInstantUsedSource, getNamedTarget, getOwnStackFrames, isBundledOrExternalPath, isClimbUsageBoundary, isCompositeComponentFiber, isDirectFiberChildOf, isDistinctUsedSource, isFrameworkInspectorName, isHostComponentFiber, isInspectorChrome, isOwnerAncestorOf, isPointInRect, openInEditor, preferredSourceFromFrames, readComponentTypeName, resolveDebugInfoPair, resolveDebugInfoPairSync, resolveFirstMappedFrame, resolveHostAuthorSource, resolveInspectElement, resolveInstanceSource, resolveNearestAncestorSource, resolveSource, sourceFromFiberDebugSource, sourceFromStackFrame, type ReactFiber, type ServerDebugInfo, type SourceLocation, type SourceMap } from "./engine.ts"
import { createOpenSourceIcon } from "./icons.ts"
import overlayCss from "./overlay.css"
import {
  ensureInspectorStyles,
  markInspectNode,
  paintTreePath,
  paintTreeRow,
  paintTwisty,
  setInspectMotion,
} from "./styles.ts"
import { createInspectTooltip, expandRectWithPadding, getInfoPanelPosition } from "./tooltip.ts"

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
    ensureInspectorStyles(overlayCss)

    const sourceMapCache = new Map<string, Promise<SourceMap>>()
    const sourceCache = new WeakMap<ReactFiber, Promise<SourceLocation | null>>()

    const instanceSourceCache = new WeakMap<ReactFiber, Promise<SourceLocation | null>>()

    const instantDefinedPathCache = new WeakMap<ReactFiber, string>()
    const instantUsedPathCache = new WeakMap<ReactFiber, string>()
    const overlay = document.createElement("div")
    const inspectTooltip = createInspectTooltip()
    const tooltip = inspectTooltip.root
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
    const bustOwnerChainCache = () => { ownerChainCache = new WeakMap() }

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
      source.filePath.startsWith(projectRoot)
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
      const path = mk("a", "data-dev-inspector-source-path")
      const pathIcon = mk("span", "data-dev-inspector-source-icon")
      pathIcon.append(createOpenSourceIcon())
      path.append(mk("span", undefined, `${relSourcePath(source)}:${source.line}:${source.column}`), pathIcon)
      path.onclick = () => openInEditor(source, settings.ide)
      row.append(path)
      box.append(row)
    }

    overlay.setAttribute("aria-hidden", "true")
    markInspectNode(overlay, "data-dev-inspector-overlay")

    const clearTooltipStack = () => inspectTooltip.clearStack()
    const pushTooltipUnder = (text: string) => {
      if (!optionHeld || !text) return
      inspectTooltip.pushUnder(text)
    }
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
        const name = readComponentTypeName(node.type)
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

    const buildOwnerChain = (fiber: ReactFiber): OwnerChainStep[] => {
      const cached = ownerChainCache.get(fiber)
      if (cached) return cached
      const steps: OwnerChainStep[] = []
      const seen = new Set<ReactFiber>(), seenNames = new Set<string>()
      const isHostHover = isHostComponentFiber(fiber) || fiber.stateNode instanceof Element
      let child: ReactFiber, parent: ReactFiber | null = null
      if (isHostHover) {
        const owner = getDirectClimbOwner(fiber)
        if (!owner || (!owner.isSelfDebugOwner && !isDirectFiberChildOf(fiber, owner.fiber) && !isOwnerAncestorOf(fiber, owner.fiber))) return []
        const resolved = resolveClimbStepSync(owner.fiber, fiber, owner.debugInfo)
        steps.push({ name: owner.name, source: resolved.source, definition: resolved.definition, parentFiber: owner.fiber, debugInfo: resolved.debugInfo })
        ownerChainCache.set(fiber, steps)
        return steps
      }
      const named = getNamedTarget(fiber)?.fiber ?? fiber
      parent = findNextNamedOwner(named)
      if (!parent || (!isDirectFiberChildOf(named, parent) && !isOwnerAncestorOf(named, parent))) return []
      child = named
      for (let hops = 0; parent && hops < 32; hops += 1) {
        if (seen.has(parent)) break
        seen.add(parent)
        if (!isDirectFiberChildOf(child, parent) && !isOwnerAncestorOf(child, parent)) break
        const name = readFiberDisplayName(parent)
        if (!name || isFrameworkInspectorName(name) || (seenNames.has(name) && seen.has(parent))) break
        const resolved = resolveClimbStepSync(parent, child)
        steps.push({ name, source: resolved.source, definition: resolved.definition, parentFiber: parent })
        seenNames.add(name)
        if (isRouteFileBoundary(resolved.source, name) || isRouteFileBoundary(resolved.definition, name) || isClimbUsageBoundary({ usage: resolved.source, definition: resolved.definition })) break
        child = parent
        const next = findNextNamedOwner(parent)
        if (!next || (!isDirectFiberChildOf(parent, next) && !isOwnerAncestorOf(parent, next))) break
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
      if (!settings.tooltipProps.showPageName) return null
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
      syncUsedIcon(kind === "used")
      if (lastTargetRect) positionTooltip(lastTargetRect)
      if (infoNeedsRefresh && infoVisible && infoTarget && hoveredElement === infoTarget) void renderInfo(infoTarget, fiber)
    }

    info.setAttribute("aria-hidden", "true")
    markInspectNode(info, "data-dev-inspector-info")
    const paintTooltipChrome = () => {
      applyOverlayStyles(overlay, tooltip, settings)
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


    const syncInfoTreeSelection = (node: InfoTreeNode) => {
      if (infoTitleEl) {
        infoTitleEl.textContent = node.isDom
          ? formatDomTag(node.name)
          : formatComponentTag(node.name)
      }
      infoSourceBox && paintSourceBox(infoSourceBox, node.source)

      if (node.isDom) {
        infoClimbSelection = null
      } else {
        const step = infoTreeChain[node.climbIndex]
        if (step) {
          ownerChainDepth = node.climbIndex
          infoClimbSelection = { depth: node.climbIndex, step }
        }
      }

      setTooltipLabel(formatTooltipLabel({
        title: node.name,
        pageName: node.source ? formatPageLabel(node.source, projectRoot) : null,
        tooltipProps: settings.tooltipProps,
        tagStyle: node.isDom ? "dom" : "component",
      }) || (node.isDom ? formatDomTag(node.name) : formatComponentTag(node.name)))
      syncUsedIcon(!node.isDom)
      if (lastTargetRect) { positionTooltip(lastTargetRect); positionInfo(lastTargetRect) }
    }

    const createClimbTreeSection = (
      hostTag: string,
      hostSource: SourceLocation | null,
      chain: OwnerChainStep[],
      initialClimbIndex: number
    ) => {
      const nodes: InfoTreeNode[] = [
        ...[...chain].map((step, index) => ({
          name: step.name,
          isDom: false,
          source: getClimbStepDisplaySource(step),
          climbIndex: index,
        })).reverse(),
        { name: hostTag, isDom: true, source: hostSource, climbIndex: -1 },
      ]
      const section = mk("div", "data-dev-inspector-owner-tree")
      section.append(mk("div", "data-dev-inspector-tree-heading", "Node tree"))
      const tree = mk("div", "data-dev-inspector-tree")
      tree.setAttribute("role", "tree")
      tree.setAttribute("aria-label", "Node tree")
      const expanded = nodes.map(() => true)
      const selection = { climbIndex: initialClimbIndex }
      const visibleNodeIndices = () => {
        const indices: number[] = []
        for (let i = 0; i < nodes.length; i += 1) {
          if (expanded.slice(0, i).every(Boolean)) indices.push(i)
        }
        return indices
      }
      const syncNode = (nodeIndex: number, source: SourceLocation | null) => {
        if (!infoVisible || !info.contains(tree)) return
        if (nodeIndex < 0 || nodeIndex >= nodes.length) return
        nodes[nodeIndex].source = source
        paint()
        const node = nodes[nodeIndex]
        if (node && node.climbIndex === selection.climbIndex) syncInfoTreeSelection(node)
        reposition()
      }
      const paint = () => {
        tree.textContent = ""
        nodes.forEach((node, index) => {
          if (!expanded.slice(0, index).every(Boolean)) return
          const hasChildren = index < nodes.length - 1
          const active = node.climbIndex === selection.climbIndex
          const row = mk("div", "data-dev-inspector-tree-row")
          paintTreeRow(row, active)
          row.setAttribute("role", "treeitem")
          row.setAttribute("aria-selected", active ? "true" : "false")
          row.setAttribute("aria-level", String(index + 1))
          const gutter = mk("div", "data-dev-inspector-tree-gutter")
          const indent = mk("span", "data-dev-inspector-tree-indent")
          indent.style.setProperty("--inspect-tree-depth", String(index))
          gutter.append(indent)
          const twisty = mk<HTMLButtonElement>("button", "data-dev-inspector-tree-twisty")
          twisty.type = "button"
          if (hasChildren) {
            paintTwisty(twisty, true)
            twisty.textContent = expanded[index] ? "▾" : "▸"
            twisty.onclick = (e) => { e.preventDefault(); e.stopPropagation(); expanded[index] = !expanded[index]; paint(); reposition() }
          }
          gutter.append(twisty)
          const nameEl = mk("span", "data-dev-inspector-tree-name", node.isDom ? formatDomTag(node.name) : formatComponentTag(node.name))
          const pathEl = mk<HTMLButtonElement>("button", "data-dev-inspector-tree-path")
          pathEl.type = "button"
          if (node.source) {
            const label = formatPageLabel(node.source, projectRoot)
            pathEl.textContent = label
            pathEl.title = label
            paintTreePath(pathEl, "open")
            pathEl.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openInEditor(node.source!, settings.ide) }
          } else {
            pathEl.textContent = "…"
            paintTreePath(pathEl, "empty")
          }
          row.append(gutter, nameEl, pathEl)
          row.onclick = (e) => {
            if (pathEl.contains(e.target as Node)) return
            e.preventDefault()
            selection.climbIndex = node.climbIndex
            paint()
            syncInfoTreeSelection(node)
          }
          tree.append(row)
        })
      }
      paint()
      section.append(tree)
      return {
        section,
        moveSelection: (delta: number): InfoTreeNode | null => {
          const visible = visibleNodeIndices()
          if (!visible.length) return null
          const current = visible.findIndex((i) => nodes[i]?.climbIndex === selection.climbIndex)
          const from = current === -1 ? visible.length - 1 : current
          const next = from + delta
          if (next < 0 || next >= visible.length) return null
          const node = nodes[visible[next]!]
          if (!node) return null
          selection.climbIndex = node.climbIndex
          paint()
          syncInfoTreeSelection(node)
          return node
        },
        refinePaths: (refine: (step: OwnerChainStep) => Promise<void>) => {
          chain.forEach((step, index) => {
            void refine(step).then(() => syncNode(chain.length - 1 - index, getClimbStepDisplaySource(step)))
          })
        },
        setHostSource: (source: SourceLocation | null) => syncNode(nodes.length - 1, source),
        setClimbStepSource: (climbIndex: number, source: SourceLocation | null) =>
          syncNode(chain.length - 1 - climbIndex, source),
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
    const resolveClimbStepForInfo = async (step: OwnerChainStep) => {
      if (step.debugInfo) {
        const pair = await resolveDebugInfoPair(step.debugInfo, projectRoot, sourceMapCache)
        step.source = pair.source ?? step.source
        step.definition = pair.renderedBy ?? step.definition
        return
      }
      const composite = step.parentFiber
      const [usage, definition] = await Promise.all([
        step.source ? Promise.resolve(step.source) : getInstanceSource(composite),
        step.definition ? Promise.resolve(step.definition) : getSource(composite),
      ])
      step.source = usage ?? getInstantUsedSource(composite, projectRoot) ?? step.source
      step.definition = definition ?? getInstantDefinedSource(composite, projectRoot) ?? step.definition
    }
    const renderInfo = async (target: Element, fiber: ReactFiber) => {
      const liveStep = optionHeld ? getActiveChainStep(fiber) : null
      infoClimbSelection = liveStep ? { depth: ownerChainDepth, step: liveStep } : null
      const climbStep = infoClimbSelection?.step ?? null
      const climbDepth = infoClimbSelection?.depth ?? 0
      const hostTag = getDomHoverName(fiber) ?? "element"
      const chain = buildOwnerChain(fiber)
      info.textContent = ""
      info.append(
        mk("div", "data-dev-inspector-info-title", climbStep ? formatComponentTag(climbStep.name) : formatDomTag(hostTag)),
      )
      infoTitleEl = info.firstElementChild as HTMLDivElement
      const sourceContainer = mk<HTMLDivElement>("div", "data-dev-inspector-source-box")
      sourceContainer.append(mk("span", "data-dev-inspector-source-pending", "Resolving…"))
      info.append(sourceContainer)
      infoSourceBox = sourceContainer
      infoTreeChain = chain
      const climbTree = chain.length
        ? createClimbTreeSection(hostTag, getHostAuthorSource(fiber, projectRoot), chain, climbStep ? climbDepth : -1)
        : null
      infoTreeMove = climbTree?.moveSelection ?? null
      if (climbTree) info.append(climbTree.section)
      info.append(createStylesSection(target, reposition))
      info.style.display = "block"
      info.style.pointerEvents = "auto"
      reposition()
      climbTree?.refinePaths(refineInfoStep)
      try {
        const hostSource = (await resolveHostAuthorSource(fiber, projectRoot, sourceMapCache)) ?? getHostAuthorSource(fiber, projectRoot)
        if (!infoVisible || infoTarget !== target) return
        climbTree?.setHostSource(hostSource)
        if (climbStep) {
          await resolveClimbStepForInfo(climbStep)
          if (!infoVisible || infoTarget !== target) return
          const climbPath = getClimbStepDisplaySource(climbStep)
          if (climbPath) climbTree?.setClimbStepSource(climbDepth, climbPath)
          paintSourceBox(sourceContainer, climbPath)
        } else paintSourceBox(sourceContainer, hostSource)
        reposition()
      } catch {
        if (infoVisible && infoTarget === target) sourceContainer.textContent = "Source unavailable"
      }
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


    let logOptionPress: (() => void) | null = null
    let walkOwnerChain: ((delta: number) => void) | null = null
    let moveToParentInspectable: (() => boolean) | null = null
    let climbUpPastHosts: (() => boolean) | null = null
    let shakeTooltip: (() => void) | null = null

    const syncOptionFromEvent = (event: KeyboardEvent | MouseEvent | PointerEvent) => {
      const next = event.altKey
      if (next === optionHeld) return
      const previousLabel = inspectTooltip.label
      optionHeld = next; ownerChainDepth = 0; bustOwnerChainCache()
      if (next) {
        const fiber = hoveredElement ? getFiber(hoveredElement) : null
        const chainLen = fiber ? buildOwnerChain(fiber).length : 0
        if (chainLen > 0 && previousLabel) pushTooltipUnder(previousLabel)
        else if (inspectTooltip.isOpen()) shakeTooltip?.()
      } else clearTooltipStack()
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

    walkOwnerChain = (delta: number) => {
      if (!optionHeld || !hoveredElement || delta <= 0) return
      const fiber = getFiber(hoveredElement)
      const chain = fiber ? buildOwnerChain(fiber) : []
      if (chain.length > 0) {
        const next = Math.min(chain.length - 1, ownerChainDepth + delta)
        if (next !== ownerChainDepth) {
          const currentLabel = inspectTooltip.label
          if (currentLabel) pushTooltipUnder(currentLabel)
          ownerChainDepth = next
          paintTooltipForFiber(fiber!)
          updateOpenHint()
          refineActiveStep(fiber!, chain[ownerChainDepth]!, ownerChainDepth, true)
          return
        }
      }
      climbUpPastHosts?.()
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
        const chain = buildOwnerChain(fiber)
        await Promise.all(chain.map((step) => refineClimbStep(step)))
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
      if (!fiber) { hide(); return false }
      const hasTargetChanged = hoveredElement !== resolved
      hoveredElement = resolved
      const rect = expandRectWithPadding(resolved.getBoundingClientRect(), {
        left: settings.devSpotlightProps.paddingX, right: settings.devSpotlightProps.paddingX,
        top: settings.devSpotlightProps.paddingY, bottom: settings.devSpotlightProps.paddingY,
      })
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
        paintTooltipForFiber(fiber)
        void inspect(resolved, fiber, inspectGeneration += 1)
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

      if (infoVisible) return

      const target = pendingClickElement ?? hoveredElement ?? clicked
      pendingClickElement = null
      const fiber = target ? getFiber(target) : null
      if (!fiber || !target) return

      syncOptionFromEvent(event)
      void openSource(fiber)
    }

    const applyPadding = (delta: number | "reset") => {
      const { paddingX, paddingY } = settings.devSpotlightProps
      const nextX = delta === "reset" ? DEFAULT_DEV_SPOTLIGHT_PROPS.paddingX : Math.min(PADDING_MAX, Math.max(PADDING_MIN, paddingX + delta))
      const nextY = delta === "reset" ? DEFAULT_DEV_SPOTLIGHT_PROPS.paddingY : Math.min(PADDING_MAX, Math.max(PADDING_MIN, paddingY + delta))
      setDevSpotlightProps({ paddingX: nextX, paddingY: nextY })
      settings = getInspectorSettings()
      if (!hoveredElement) return
      highlightTarget(hoveredElement)
      inspectTooltip.show()
      setTooltipLabel(delta === "reset" ? `padding reset ${nextX} · ${nextY}` : `padding ${nextX} · ${nextY}`)
      if (lastTargetRect) positionTooltip(lastTargetRect)
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
      if (optionHeld && !event.metaKey && (event.key === "Shift" || event.code === "ShiftLeft" || event.code === "ShiftRight")) {
        event.preventDefault(); event.stopPropagation()
        if (!event.repeat) walkOwnerChain?.(1)
        return
      }
      if (event.key === "Enter") {
        if (!hoveredElement) return
        const fiber = getFiber(hoveredElement)
        if (!fiber) return
        event.preventDefault(); event.stopPropagation(); void openSource(fiber)
        return
      }
      if (event.code === "KeyI" || event.key === "i" || event.key === "I") {
        if (!hoveredElement) return
        event.preventDefault()
        if (infoVisible && infoTarget === hoveredElement) { hideInfo(); return }
        const fiber = getFiber(hoveredElement)
        if (!fiber) return
        const liveStep = optionHeld ? getActiveChainStep(fiber) : null
        infoClimbSelection = liveStep ? { depth: ownerChainDepth, step: liveStep } : null
        infoVisible = true; infoTarget = hoveredElement; document.body.style.cursor = "crosshair"
        void renderInfo(hoveredElement, fiber)
        return
      }
      const isMod = event.metaKey || event.ctrlKey
      if (event.altKey && !isMod) {
        const grow = event.code === "Equal" || event.key === "=" || event.key === "+"
        const shrink = event.code === "Minus" || event.key === "-" || event.key === "_"
        if (grow || shrink) {
          event.preventDefault()
          event.stopPropagation()
          applyPadding(grow ? 4 : -4)
          return
        }
      }

      if ((event.key === "[" || event.key === "]") && !isMod && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        if (!hoveredElement) { shakeOverlay(); return }
        if (event.key === "[") { moveToParentInspectable?.(); return }
        navOrShake(findBracketChild(hoveredElement), hoveredElement, true)
        return
      }

      if (isMod && (event.code === "Backslash" || event.key === "\\")) {
        event.preventDefault()
        event.stopPropagation()
        applyPadding("reset")
        return
      }

      if (!/Arrow(U|D|L|R)/.test(event.code)) return
      event.preventDefault()
      event.stopPropagation()
      const isModArrow = event.metaKey || event.ctrlKey
      const up = event.key === "ArrowUp", down = event.key === "ArrowDown"
      const prev = up || event.key === "ArrowLeft", nextKey = down || event.key === "ArrowRight"
      if (infoVisible && !isModArrow && (up || down)) {
        const node = infoTreeMove?.(up ? -1 : 1)
        if (!node) up ? climbUpPastHosts?.() : shakeOverlay()
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

    const inspectProbe = async (input: Element | string) => {
      const hit = typeof input === "string" ? document.querySelector(input) : input
      if (!(hit instanceof Element)) return null
      const resolved = resolveInspectElement(hit)
      if (isInspectorChrome(resolved)) return null
      const fiber = getFiber(resolved)
      if (!fiber) return null
      const hostSource = (await resolveHostAuthorSource(fiber, projectRoot, sourceMapCache)) ?? getHostAuthorSource(fiber, projectRoot)
      const chain = buildOwnerChain(fiber)
      await Promise.all(chain.map((step) => refineClimbStep(step)))
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
      info.remove()
      document.body.style.cursor = previousCursor
    }
  }, [projectRoot])

  return null
}

