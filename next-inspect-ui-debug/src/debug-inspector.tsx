"use client"

import { useEffect } from "react"

import {
  findChildInspectable,
  findChildInspectableWhere,
  findEdgeSiblingInspectable,
  findParentInspectable,
  findSiblingInspectable,
  getElementFiber,
  isInspectorChrome,
} from "next-inspect-ui/lib"
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
  INSPECTOR_IDES,
  matchesInspectorShortcut,
  PADDING_MAX,
  PADDING_MIN,
  setDevSpotlightProps,
  subscribeInspectorSettings,
  type InspectorIde,
  type InspectorSettings,
} from "next-inspect-ui/lib"
import {
  formatPageLabel,
  getClimbOpenSource,
  getClimbStepDisplaySource,
  isBundledOrExternalPath,
  isClimbUsageBoundary,
  isDistinctUsedSource,
  isLikelySourceFile,
  isSameSourceLine,
  normalizeSourceLocation,
  pickDefinedSource,
  pickOpenSource,
  pickPreferredStackSource,
  sourceFromFiberDebugSource,
  toAbsolutePath,
  underStackTransform,
  type FiberDebugSource,
  type NamedSourceFrame,
  type SourceLocation,
} from "next-inspect-ui/lib"
import {
  documentHasStamps,
  readHostStamp,
  readOwnerStamp,
} from "next-inspect-ui/lib"

import {
  applyOverlayStyles,
  ARROW_UP_RIGHT_ICON,
  classNameFromProps,
  collectDocumentCssVarNames,
  createCodeSurface,
  createCssBlock,
  createStylesSection,
  createTailwindBlock,
  cssSpan,
  finalizeHostAuthorSource,
  findNearestAuthorCallSite,
  findNearestAuthorCallSiteSync,
  framesFromUnknownStack,
  framesLookServer,
  getComponentName,
  getComponentRuntime,
  getCssDeclarations,
  getDebugInfoFrames,
  getDebugSourceUntil,
  getDirectClimbOwner,
  getDomHoverName,
  getElementClassName,
  getFiber,
  getHostAuthorSource as getHostAuthorSourceRuntime,
  getHostTagName,
  getInstantDefinedSource,
  getInstantUsedSource,
  getLabelOwner,
  getNamedTarget,
  getOwnStackFrames,
  getOwningCompositeFiber,
  getOwningCompositeName,
  getSourceMapSection,
  getStackFrames,
  isColorValue,
  isCompositeComponentFiber,
  isDirectFiberChildOf,
  isFrameworkInspectorName,
  isHostComponentFiber,
  isNestedMediaHit,
  isOwnerAncestorOf,
  isPointInRect,
  isPreferredInspectHost,
  openInEditor,
  parseDebugStack,
  preferredSourceFromFrames,
  readComponentTypeName,
  readDebugInfoOwner,
  resolveDebugInfoPair,
  resolveDebugInfoPairSync,
  resolveFiberDebugSource,
  resolveFirstMappedFrame,
  resolveHostAuthorSource as resolveHostAuthorSourceRuntime,
  resolveInspectElement,
  resolveInstanceSource,
  resolveNearestAncestorSource,
  resolveServerStackFrame,
  resolveSource,
  resolveStackFrame,
  resolveToRgbKey,
  scoreCssColorVar,
  sourceFromStackFrame,
  toCssColorVar,
  type ClimbOwner,
  type ComponentRuntime,
  type CssDeclaration,
  type NamedTarget,
  type OriginalFrameResult,
  type ReactFiber,
  type ServerDebugInfo,
  type SourceMap,
  type SourceMapData,
  type SourceMapSection,
  type StackFrame,
} from "next-inspect-ui/overlay"

const isSameSource = (
  a: SourceLocation | null | undefined,
  b: SourceLocation | null | undefined
) =>
  Boolean(
    a &&
      b &&
      a.filePath === b.filePath &&
      a.line === b.line &&
      a.column === b.column
  )

const formatRuntimeLabel = (runtime: ComponentRuntime) =>
  runtime === "server" ? "Server" : "Client"

const createRuntimeBadge = (runtime: ComponentRuntime) => {
  const badge = document.createElement("span")
  badge.textContent = formatRuntimeLabel(runtime)
  badge.setAttribute("data-dev-inspector-runtime", runtime)
  badge.style.cssText =
    runtime === "server"
      ? "display:inline-flex;align-items:center;flex:none;margin-left:8px;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:0.04em;line-height:1.4;background:rgb(161 161 170 / 18%);color:rgb(212 212 216);border:1px solid rgb(161 161 170 / 28%);"
      : "display:inline-flex;align-items:center;flex:none;margin-left:8px;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:0.04em;line-height:1.4;background:rgb(56 189 248 / 14%);color:rgb(125 211 252);border:1px solid rgb(56 189 248 / 28%);"
  return badge
}

const stampedHostSource = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => {
  const node = fiber.stateNode
  if (!(node instanceof Element)) return null
  return normalizeSourceLocation(readHostStamp(node, projectRoot))
}

const stampedOwnerSource = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => {
  const node = fiber.stateNode
  if (!(node instanceof Element)) return null
  return normalizeSourceLocation(readOwnerStamp(node, projectRoot))
}

let stampsFeedResolution = false

const setStampsFeedResolution = (on: boolean) => {
  stampsFeedResolution = on
}

const readGroundTruthStamp = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null => stampedHostSource(fiber, projectRoot)

const stampedAuthorSource = (
  fiber: ReactFiber,
  projectRoot: string
): SourceLocation | null =>
  stampsFeedResolution ? readGroundTruthStamp(fiber, projectRoot) : null

const getHostAuthorSource = (
  fiber: ReactFiber,
  projectRoot: string,
  useStamps = true
): SourceLocation | null => {
  const stamped = useStamps ? stampedAuthorSource(fiber, projectRoot) : null
  if (stamped) return stamped
  return getHostAuthorSourceRuntime(fiber, projectRoot)
}

const resolveHostAuthorSource = async (
  fiber: ReactFiber,
  projectRoot: string,
  sourceMapCache: Map<string, Promise<SourceMap>>,
  useStamps = true
): Promise<SourceLocation | null> => {
  const stamped = useStamps ? stampedAuthorSource(fiber, projectRoot) : null
  if (stamped) return stamped
  return resolveHostAuthorSourceRuntime(fiber, projectRoot, sourceMapCache)
}

const DUAL_SOURCE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm8.2-6l-1.625 1.625l1.4 1.4L16 13l-4.025-4.025l-1.4 1.4L12.2 12H8v2z"/></svg>'

type OpenKind = "used" | "defined"

type OwnerChainStep = {
  name: string
  source: SourceLocation | null
  definition: SourceLocation | null
  parentFiber: ReactFiber
  debugInfo?: ServerDebugInfo
  runtime: ComponentRuntime | null
}

export const InspectUI = ({
  projectRoot,
  debug = false,
  verify = false,
}: {
  projectRoot: string
  debug?: boolean
  verify?: boolean
}) => {
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
    type SourceAvailability = {
      used: boolean
      defined: boolean
      dual: boolean
    }
    const availabilityCache = new WeakMap<ReactFiber, SourceAvailability>()
    const overlay = document.createElement("div")
    const tooltip = document.createElement("div")
    const info = document.createElement("div")
    const logPanel = document.createElement("div")
    const logEntries = document.createElement("div")
    const logFooter = document.createElement("div")
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
    let infoClimbSelection: ClimbSelection | null = null

    const rememberAvailability = (
      fiber: ReactFiber,
      usage: SourceLocation | null,
      definition: SourceLocation | null
    ) => {
      const avail: SourceAvailability = {
        used: Boolean(usage),
        defined: Boolean(definition),
        dual: isDistinctUsedSource(usage, definition),
      }
      availabilityCache.set(fiber, avail)
      return avail
    }

    const getAvailability = (fiber: ReactFiber): SourceAvailability => {
      const cached = availabilityCache.get(fiber)
      if (cached) return cached

      const usage = getInstantUsedSource(fiber, projectRoot)
      const definition = getInstantDefinedSource(fiber, projectRoot)
      return rememberAvailability(fiber, usage, definition)
    }
    
    
    
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
    
    const tooltipDualBadge = document.createElement("span")
    tooltipDualBadge.setAttribute("aria-hidden", "true")
    tooltipDualBadge.innerHTML = DUAL_SOURCE_ICON
    tooltipDualBadge.style.cssText =
      "display:none;flex:none;align-items:center;justify-content:center;margin-right:3px;width:14px;height:14px;box-sizing:border-box;"
    const tooltipIconWrap = document.createElement("span")
    tooltipIconWrap.setAttribute("aria-hidden", "true")
    tooltipIconWrap.style.cssText =
      "display:inline-flex;flex:none;align-items:center;justify-content:center;overflow:hidden;width:0;margin-right:0;transition:width 160ms ease,margin-right 160ms ease;"
    tooltipIconWrap.innerHTML = ARROW_UP_RIGHT_ICON
    const tooltipLabel = document.createElement("span")
    tooltipLabel.style.cssText =
      "min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
    tooltipFront.append(tooltipDualBadge, tooltipIconWrap, tooltipLabel)
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

    
    const canShowTooltipStack = () => {
      if (!optionHeld || !hoveredElement) return false
      const fiber = getFiber(hoveredElement)
      return Boolean(fiber && buildOwnerChain(fiber).length > 0)
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

    const syncTooltipChromePadding = (hasLeadingIcon: boolean) => {
      const { paddingX, paddingY } = settings.tooltipProps
      
      const padLeft = hasLeadingIcon ? Math.max(4, paddingX - 4) : paddingX
      tooltipFront.style.padding = `${paddingY}px ${paddingX}px ${paddingY}px ${padLeft}px`
    }

    const syncDualBadge = (_fiber: ReactFiber | null) => {
      
      tooltipDualBadge.style.display = "none"
      syncTooltipChromePadding(false)
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
    ): Pick<
      OwnerChainStep,
      "source" | "definition" | "debugInfo" | "runtime"
    > => {
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
          runtime: getComponentRuntime(ownerFiber, debugInfo),
        }
      }

      const definition = getInstantDefinedSource(ownerFiber, projectRoot)
      return {
        source: pickClimbUsageSource(ownerFiber, child, definition),
        definition,
        runtime: getComponentRuntime(ownerFiber),
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
        // HTML host → one climb step only: the component that rendered it
        // (`<Button>` @ page.tsx:39). Never walk into Card / page parents.
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
        const ownerStamp = stampedOwnerSource(fiber, projectRoot)
        steps.push({
          name: owner.name,
          // Prefer the stamped call site when the component forwards props —
          // that is the exact `<Button>` line, not a stack approximation.
          source: ownerStamp ?? resolved.source,
          definition: resolved.definition,
          parentFiber: owner.fiber,
          debugInfo: resolved.debugInfo,
          runtime: resolved.runtime,
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
          runtime: resolved.runtime,
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
      if (optionHeld && getActiveChainStep(fiber)) return "used"
      return "defined"
    }

    const paintTooltipForFiber = (fiber: ReactFiber) => {
      const kind = resolveOpenKind(fiber)
      const step = kind === "used" ? getActiveChainStep(fiber) : null
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
      } else if (prev) {
        
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
      syncDualBadge(fiber)
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
    
    
    
    
    const RESOLVE_MODE_KEY = "next-inspect-ui:resolve-uses-stamps"
    let resolveUsesStamps = false
    try {
      resolveUsesStamps =
        window.sessionStorage.getItem(RESOLVE_MODE_KEY) === "1"
    } catch {
      resolveUsesStamps = false
    }
    setStampsFeedResolution(resolveUsesStamps)

    const DEBUG_PANEL_KEY = "next-inspect-ui:debug-panel"
    let debugPanelOpen = true
    try {
      debugPanelOpen = window.sessionStorage.getItem(DEBUG_PANEL_KEY) !== "0"
    } catch {
      debugPanelOpen = true
    }

    logPanel.setAttribute("aria-hidden", "true")
    logPanel.setAttribute("data-dev-inspector-log", "")
    logPanel.style.cssText =
      'position:fixed;left:12px;bottom:12px;z-index:2147483647;display:none;pointer-events:auto;box-sizing:border-box;width:min(22rem,calc(100vw - 24px));max-height:100vh;flex-direction:column;gap:6px;padding:8px 10px;background:rgb(9 9 11 / 96%);border:1px solid rgb(148 163 184 / 18%);border-radius:8px;box-shadow:0 8px 24px rgb(0 0 0 / 45%);color:#94a3b8;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;'
    const logHeader = document.createElement("div")
    logHeader.style.cssText =
      "flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;"
    const logTitle = document.createElement("div")
    logTitle.textContent = "Debug"
    logTitle.style.cssText =
      "min-width:0;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;font-size:11px;opacity:0.85;"
    const hideLogBtn = document.createElement("button")
    hideLogBtn.type = "button"
    hideLogBtn.textContent = "Hide"
    hideLogBtn.setAttribute("aria-label", "Hide debug panel")
    hideLogBtn.style.cssText =
      "flex:none;appearance:none;border:1px solid rgb(34 197 94 / 45%);background:rgb(34 197 94 / 12%);color:#22c55e;border-radius:4px;padding:2px 8px;font:inherit;cursor:pointer;line-height:1.4;"
    
    const dragHandle = document.createElement("div")
    dragHandle.setAttribute("aria-label", "Drag debug panel")
    dragHandle.setAttribute("role", "button")
    dragHandle.style.cssText = [
      "flex:none",
      "width:12px",
      "height:16px",
      "cursor:grab",
      "touch-action:none",
      "opacity:0.5",
      "background-image:radial-gradient(currentColor 1px, transparent 1px)",
      "background-size:5px 5px",
      "background-position:1px 3px",
      "background-repeat:repeat",
      "color:#94a3b8",
    ].join(";")

    dragHandle.addEventListener("pointerdown", (event) => {
      event.preventDefault()
      event.stopPropagation()
      try {
        dragHandle.setPointerCapture(event.pointerId)
      } catch {
        
      }

      const start = logPanel.getBoundingClientRect()
      const startX = event.clientX
      const startY = event.clientY
      dragHandle.style.cursor = "grabbing"

      let latest: PanelRect = {
        left: start.left,
        top: start.top,
        width: start.width,
        height: start.height,
      }

      const onMove = (move: PointerEvent) => {
        
        
        const left = Math.min(
          Math.max(0, start.left + (move.clientX - startX)),
          Math.max(0, window.innerWidth - start.width)
        )
        const top = Math.min(
          Math.max(0, start.top + (move.clientY - startY)),
          Math.max(0, window.innerHeight - start.height)
        )
        latest = { ...latest, left, top }
        applyPanelRect(latest)
      }

      const onUp = () => {
        dragHandle.removeEventListener("pointermove", onMove)
        dragHandle.removeEventListener("pointerup", onUp)
        dragHandle.removeEventListener("pointercancel", onUp)
        dragHandle.style.cursor = "grab"
        persistPanelRect(latest)
      }

      dragHandle.addEventListener("pointermove", onMove)
      dragHandle.addEventListener("pointerup", onUp)
      dragHandle.addEventListener("pointercancel", onUp)
    })

    logHeader.append(dragHandle, logTitle, hideLogBtn)
    logEntries.style.cssText =
      "flex:1 1 auto;min-height:0;overflow-x:hidden;overflow-y:auto;display:flex;flex-direction:column;gap:2px;"
    logFooter.style.cssText =
      "flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:6px;border-top:1px solid rgb(34 197 94 / 25%);color:#22c55e;"
    const logHint = document.createElement("div")
    logHint.style.cssText =
      "min-width:0;flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
    const copyLogsBtn = document.createElement("button")
    copyLogsBtn.type = "button"
    copyLogsBtn.textContent = "Copy logs"
    copyLogsBtn.style.cssText =
      "flex:none;appearance:none;border:1px solid rgb(34 197 94 / 45%);background:rgb(34 197 94 / 12%);color:#22c55e;border-radius:4px;padding:2px 8px;font:inherit;cursor:pointer;line-height:1.4;"
    
    
    
    const openModeBtn = document.createElement("button")
    openModeBtn.type = "button"
    openModeBtn.style.cssText =
      "flex:none;appearance:none;border:1px solid rgb(148 163 184 / 40%);background:rgb(148 163 184 / 10%);border-radius:4px;padding:2px 8px;font:inherit;cursor:pointer;line-height:1.4;white-space:nowrap;"

    const paintOpenModeBtn = () => {
      openModeBtn.textContent = resolveUsesStamps
        ? "resolve: stamp"
        : "resolve: runtime"
      openModeBtn.style.color = resolveUsesStamps ? "#22c55e" : "#f97316"
      openModeBtn.style.borderColor = resolveUsesStamps
        ? "rgb(34 197 94 / 45%)"
        : "rgb(249 115 22 / 45%)"
      openModeBtn.style.background = resolveUsesStamps
        ? "rgb(34 197 94 / 12%)"
        : "rgb(249 115 22 / 12%)"
      openModeBtn.setAttribute("aria-pressed", String(resolveUsesStamps))
      openModeBtn.title = resolveUsesStamps
        ? "Hover and click use the build-time stamp — exact"
        : "Hover and click use the runtime path — what ships, wrong files included"
    }

    
    const syncOpenModeVisibility = () => {
      const stamped = documentHasStamps()
      openModeBtn.style.display = stamped ? "inline-flex" : "none"
      
      
      if (!stamped && resolveUsesStamps) {
        resolveUsesStamps = false
        setStampsFeedResolution(false)
        paintOpenModeBtn()
      }
    }

    paintOpenModeBtn()
    syncOpenModeVisibility()

    openModeBtn.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      resolveUsesStamps = !resolveUsesStamps
      setStampsFeedResolution(resolveUsesStamps)
      try {
        window.sessionStorage.setItem(
          RESOLVE_MODE_KEY,
          resolveUsesStamps ? "1" : "0"
        )
      } catch {
        
      }
      paintOpenModeBtn()
      logEvent(
        resolveUsesStamps
          ? "resolving from stamps (exact)"
          : "resolving from runtime (shipped behaviour)"
      )
    })

    
    
    const clearLogsBtn = document.createElement("button")
    clearLogsBtn.type = "button"
    clearLogsBtn.textContent = "Clear"
    clearLogsBtn.setAttribute("aria-label", "Clear debug logs")
    clearLogsBtn.style.cssText =
      "flex:none;appearance:none;border:1px solid rgb(148 163 184 / 40%);background:rgb(148 163 184 / 10%);color:#94a3b8;border-radius:4px;padding:2px 8px;font:inherit;cursor:pointer;line-height:1.4;"

    clearLogsBtn.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      logEntries.replaceChildren()
      logLines.length = 0
      verifyTally.match = 0
      verifyTally.mismatch = 0
      verifyTally.unverifiable = 0
      logEvent("logs cleared")
    })

    logFooter.append(logHint, openModeBtn, clearLogsBtn, copyLogsBtn)
    logPanel.append(logHeader, logEntries, logFooter)

    const debugToggleBtn = document.createElement("button")
    debugToggleBtn.type = "button"
    debugToggleBtn.textContent = "Debug"
    debugToggleBtn.setAttribute("aria-label", "Show debug panel")
    debugToggleBtn.setAttribute("aria-pressed", "false")
    debugToggleBtn.setAttribute("data-dev-inspector-debug-toggle", "")
    debugToggleBtn.style.cssText =
      'position:fixed;left:12px;bottom:12px;z-index:2147483647;display:none;pointer-events:auto;appearance:none;border:1px solid rgb(34 197 94 / 45%);background:rgb(0 0 0 / 55%);color:#22c55e;border-radius:999px;padding:6px 12px;font:12px/1.2 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;cursor:pointer;box-shadow:0 4px 16px rgb(0 0 0 / 35%);'

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
    document.body.append(overlay, tooltip, info, logPanel, debugToggleBtn)

    
    
    
    
    

    const PANEL_RECT_KEY = "next-inspect-ui:debug-panel-rect"
    const PANEL_MIN_WIDTH = 240
    const PANEL_MIN_HEIGHT = 120

    type PanelRect = { left: number; top: number; width: number; height: number }

    const applyPanelRect = (rect: PanelRect) => {
      logPanel.style.left = `${rect.left}px`
      logPanel.style.top = `${rect.top}px`
      logPanel.style.width = `${rect.width}px`
      logPanel.style.height = `${rect.height}px`
      
      
      logPanel.style.bottom = "auto"
      logPanel.style.maxHeight = "none"
    }

    const storedPanelRect = (() => {
      try {
        const raw = window.sessionStorage.getItem(PANEL_RECT_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<PanelRect>
        if (
          typeof parsed.left !== "number" ||
          typeof parsed.top !== "number" ||
          typeof parsed.width !== "number" ||
          typeof parsed.height !== "number"
        ) {
          return null
        }
        return parsed as PanelRect
      } catch {
        return null
      }
    })()

    if (storedPanelRect) applyPanelRect(storedPanelRect)

    const persistPanelRect = (rect: PanelRect) => {
      try {
        window.sessionStorage.setItem(PANEL_RECT_KEY, JSON.stringify(rect))
      } catch {
        
      }
    }

    type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

    const HANDLE_THICKNESS = 8
    const HANDLE_STYLES: Record<ResizeEdge, string> = {
      n: `top:${-HANDLE_THICKNESS / 2}px;left:0;right:0;height:${HANDLE_THICKNESS}px;cursor:ns-resize;`,
      s: `bottom:${-HANDLE_THICKNESS / 2}px;left:0;right:0;height:${HANDLE_THICKNESS}px;cursor:ns-resize;`,
      w: `left:${-HANDLE_THICKNESS / 2}px;top:0;bottom:0;width:${HANDLE_THICKNESS}px;cursor:ew-resize;`,
      e: `right:${-HANDLE_THICKNESS / 2}px;top:0;bottom:0;width:${HANDLE_THICKNESS}px;cursor:ew-resize;`,
      nw: `top:${-HANDLE_THICKNESS / 2}px;left:${-HANDLE_THICKNESS / 2}px;width:${HANDLE_THICKNESS * 2}px;height:${HANDLE_THICKNESS * 2}px;cursor:nwse-resize;`,
      ne: `top:${-HANDLE_THICKNESS / 2}px;right:${-HANDLE_THICKNESS / 2}px;width:${HANDLE_THICKNESS * 2}px;height:${HANDLE_THICKNESS * 2}px;cursor:nesw-resize;`,
      sw: `bottom:${-HANDLE_THICKNESS / 2}px;left:${-HANDLE_THICKNESS / 2}px;width:${HANDLE_THICKNESS * 2}px;height:${HANDLE_THICKNESS * 2}px;cursor:nesw-resize;`,
      se: `bottom:${-HANDLE_THICKNESS / 2}px;right:${-HANDLE_THICKNESS / 2}px;width:${HANDLE_THICKNESS * 2}px;height:${HANDLE_THICKNESS * 2}px;cursor:nwse-resize;`,
    }

    for (const edge of Object.keys(HANDLE_STYLES) as ResizeEdge[]) {
      const handle = document.createElement("div")
      handle.dataset.devInspectorResize = edge
      handle.style.cssText = `position:absolute;z-index:1;touch-action:none;${HANDLE_STYLES[edge]}`

      handle.addEventListener("pointerdown", (event) => {
        event.preventDefault()
        event.stopPropagation()
        try {
          handle.setPointerCapture(event.pointerId)
        } catch {
          
          
        }

        const start = logPanel.getBoundingClientRect()
        const startX = event.clientX
        const startY = event.clientY
        let latest: PanelRect = {
          left: start.left,
          top: start.top,
          width: start.width,
          height: start.height,
        }

        const onMove = (move: PointerEvent) => {
          const dx = move.clientX - startX
          const dy = move.clientY - startY

          let { left, top } = start
          let { width, height } = start

          if (edge.includes("e")) {
            width = start.width + dx
          }
          if (edge.includes("w")) {
            
            
            width = start.width - dx
            left = start.left + dx
          }
          if (edge.includes("s")) {
            height = start.height + dy
          }
          if (edge.includes("n")) {
            height = start.height - dy
            top = start.top + dy
          }

          if (width < PANEL_MIN_WIDTH) {
            if (edge.includes("w")) left = start.left + start.width - PANEL_MIN_WIDTH
            width = PANEL_MIN_WIDTH
          }
          if (height < PANEL_MIN_HEIGHT) {
            if (edge.includes("n")) top = start.top + start.height - PANEL_MIN_HEIGHT
            height = PANEL_MIN_HEIGHT
          }

          
          left = Math.min(Math.max(0, left), window.innerWidth - PANEL_MIN_WIDTH)
          top = Math.min(Math.max(0, top), window.innerHeight - PANEL_MIN_HEIGHT)
          width = Math.min(width, window.innerWidth - left)
          height = Math.min(height, window.innerHeight - top)

          latest = { left, top, width, height }
          applyPanelRect(latest)
        }

        const onUp = () => {
          handle.removeEventListener("pointermove", onMove)
          handle.removeEventListener("pointerup", onUp)
          handle.removeEventListener("pointercancel", onUp)
          persistPanelRect(latest)
        }

        handle.addEventListener("pointermove", onMove)
        handle.addEventListener("pointerup", onUp)
        handle.addEventListener("pointercancel", onUp)
      })

      logPanel.appendChild(handle)
    }

    const syncDebugPanelVisibility = () => {
      if (!debug) {
        logPanel.style.display = "none"
        debugToggleBtn.style.display = "none"
        logPanel.setAttribute("aria-hidden", "true")
        return
      }
      if (debugPanelOpen) {
        logPanel.style.display = "flex"
        debugToggleBtn.style.display = "none"
        logPanel.setAttribute("aria-hidden", "false")
        debugToggleBtn.setAttribute("aria-pressed", "true")
      } else {
        logPanel.style.display = "none"
        debugToggleBtn.style.display = "inline-flex"
        logPanel.setAttribute("aria-hidden", "true")
        debugToggleBtn.setAttribute("aria-pressed", "false")
      }
    }

    const setDebugPanelOpen = (open: boolean) => {
      debugPanelOpen = open
      try {
        window.sessionStorage.setItem(DEBUG_PANEL_KEY, open ? "1" : "0")
      } catch {
        
      }
      syncDebugPanelVisibility()
    }

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
      info.style.display = "none"
      if (isActive) document.body.style.cursor = "crosshair"
    }

    const reposition = () => {
      if (lastTargetRect) positionInfo(lastTargetRect)
    }

    
    const createClimbTreeSection = (
      hostTag: string,
      hostSource: SourceLocation | null,
      chain: OwnerChainStep[],
      activeDepth: number
    ) => {
      type TreeNode = {
        name: string
        isDom: boolean
        source: SourceLocation | null
        
        climbIndex: number
      }

      
      
      const nodes: TreeNode[] = [
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
      tree.style.cssText =
        'display:flex;flex-direction:column;gap:0;font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;'

      
      const expanded = nodes.map(() => true)

      const paint = () => {
        tree.textContent = ""

        nodes.forEach((node, index) => {
          
          for (let a = 0; a < index; a += 1) {
            if (!expanded[a]) return
          }

          const hasChildren = index < nodes.length - 1
          
          const isActive = optionHeld
            ? node.climbIndex === activeDepth
            : node.climbIndex === -1

          const row = document.createElement("div")
          row.style.cssText = [
            "display:flex;align-items:center;gap:6px;min-width:0;padding:3px 2px;",
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
          tree.appendChild(row)
        })
      }

      paint()
      section.appendChild(tree)

      return {
        section,
        refinePaths: (refine: (step: OwnerChainStep) => Promise<void>) => {
          chain.forEach((step, index) => {
            void refine(step).then(() => {
              if (!infoVisible || !info.contains(tree)) return
              
              const nodeIndex = chain.length - 1 - index
              if (nodeIndex >= 0 && nodeIndex < nodes.length) {
                nodes[nodeIndex].source = getClimbStepDisplaySource(step)
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

      const sourceContainer = document.createElement("div")
      sourceContainer.style.cssText =
        "display:flex;flex-direction:column;gap:2px;"
      const loading = document.createElement("span")
      loading.textContent = "Resolving…"
      loading.style.cssText =
        "font-size:12px;color:var(--muted-foreground,#8b949e);opacity:0.6;font-weight:500;"
      sourceContainer.appendChild(loading)
      info.appendChild(sourceContainer)

      
      const treeHostSource = getHostAuthorSource(fiber, projectRoot)
      const climbTree =
        chain.length > 0
          ? createClimbTreeSection(
              hostTag,
              treeHostSource,
              chain,
              climbDepth
            )
          : null
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
          rememberAvailability(composite, usageLoc, definitionLoc)

          
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

    const MAX_LOG_ENTRIES = 40

    let logOptionPress: (() => void) | null = null
    let walkOwnerChain: ((delta: number) => void) | null = null
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
          logEvent("⌥: HTML wrapper or no owner — can't climb")
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
      syncDualBadge(fiber)
      syncUsedIcon(kind === "used")
    }

    const updateOpenHint = () => {
      const fiber = hoveredElement ? getFiber(hoveredElement) : null
      const chainLen = fiber ? buildOwnerChain(fiber).length : 0

      if (optionHeld) {
        logHint.textContent =
          chainLen > 0
            ? `usage · ⇧ climb · ${ownerChainDepth + 1}/${chainLen}`
            : `⌥ · can't climb`
      } else {
        logHint.textContent =
          chainLen > 0 ? `hold ⌥ for usage` : `hover · DOM`
      }
      paintChrome?.()
      
      if (hoveredElement && tooltip.style.display !== "none" && fiber) {
        paintTooltipForFiber(fiber)
        rememberHoverTarget(fiber)
      }
    }

    const formatLogTime = () => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, "0")
      const mm = String(now.getMinutes()).padStart(2, "0")
      const ss = String(now.getSeconds()).padStart(2, "0")
      const ms = String(now.getMilliseconds()).padStart(3, "0")
      return `${hh}:${mm}:${ss}.${ms}`
    }

    type LogTarget = { name: string; path: string }

    
    let lastHoverLog: LogTarget | null = null

    const getLogTarget = (fiber: ReactFiber): LogTarget => {
      const kind = resolveOpenKind(fiber)
      return {
        name: getTooltipTitle(fiber, kind) ?? "Component",
        path: getCachedPageName(fiber, kind) ?? "?",
      }
    }

    const logTargetsMatch = (a: LogTarget | null, b: LogTarget) =>
      Boolean(
        a &&
          b &&
          a.name === b.name &&
          a.path &&
          b.path &&
          a.path !== "?" &&
          b.path !== "?" &&
          a.path === b.path
      )

    const logLines: string[] = []

    copyLogsBtn.addEventListener("click", async (event) => {
      event.preventDefault()
      event.stopPropagation()
      try {
        await navigator.clipboard.writeText(logLines.join("\n"))
        copyLogsBtn.textContent = "Copied"
        window.setTimeout(() => {
          copyLogsBtn.textContent = "Copy logs"
        }, 1200)
      } catch {
        copyLogsBtn.textContent = "Copy failed"
        window.setTimeout(() => {
          copyLogsBtn.textContent = "Copy logs"
        }, 1200)
      }
    })

    hideLogBtn.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      setDebugPanelOpen(false)
      logEvent("debug panel hidden")
    })

    debugToggleBtn.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      setDebugPanelOpen(true)
      logEvent("debug panel shown")
    })

    
    const appendLogRow = (
      label: string,
      labelColor: string,
      value: string,
      valueColor: string
    ) => {
      const stamp = formatLogTime()

      const row = document.createElement("div")
      row.style.cssText =
        "display:flex;gap:10px;align-items:baseline;justify-content:space-between"

      const left = document.createElement("div")
      left.style.cssText =
        "flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"

      if (label) {
        const name = document.createElement("span")
        name.textContent = `${label} : `
        name.style.color = labelColor
        left.appendChild(name)
      }

      const body = document.createElement("span")
      body.textContent = value
      body.style.color = valueColor
      left.appendChild(body)

      const time = document.createElement("span")
      time.textContent = stamp
      time.style.cssText = "flex-shrink:0;color:#64748b;opacity:0.7"

      row.append(left, time)
      logEntries.appendChild(row)
      logLines.push(`${stamp}  ${label ? `${label} : ` : ""}${value}`)

      while (logEntries.childElementCount > MAX_LOG_ENTRIES) {
        logEntries.firstElementChild?.remove()
        logLines.shift()
      }
      logEntries.scrollTop = logEntries.scrollHeight
    }

    
    const appendLogSeparator = () => {
      const rule = document.createElement("div")
      rule.style.cssText =
        "margin:6px 0;border-top:1px solid rgba(148,163,184,0.18)"
      logEntries.appendChild(rule)
      while (logEntries.childElementCount > MAX_LOG_ENTRIES) {
        logEntries.firstElementChild?.remove()
      }
      logEntries.scrollTop = logEntries.scrollHeight
    }

    const logEvent = (message: string, tone: "ok" | "error" = "ok") => {
      if (!debug) return
      appendLogRow("", "", message, tone === "ok" ? "#94a3b8" : "#ef4444")
    }

    const logStage = (
      label: string,
      labelColor: string,
      value: string,
      valueColor: string
    ) => {
      if (!debug) return
      appendLogRow(label, labelColor, value, valueColor)
    }

    
    const verifyTally = { match: 0, mismatch: 0, unverifiable: 0 }

    const VERDICT_COLOR = {
      match: "#22c55e",
      mismatch: "#ef4444",
      unverifiable: "#94a3b8",
    } as const

    
    
    const verifyElement = async (element: Element) => {
      const fiber = getFiber(element)
      if (!fiber) return { status: "no-fiber" as const }

      const truth = stampedHostSource(fiber, projectRoot)
      const answer =
        (await resolveHostAuthorSource(
          fiber,
          projectRoot,
          sourceMapCache,
          false
        )) ?? getHostAuthorSource(fiber, projectRoot, false)

      if (!truth) {
        return {
          status: "unscored" as const,
          reason: "no host stamp",
          runtime: answer ? formatPageLabel(answer, projectRoot) : null,
        }
      }

      return {
        status: isSameSourceLine(truth, answer)
          ? ("match" as const)
          : ("mismatch" as const),
        expected: formatPageLabel(truth, projectRoot),
        runtime: answer ? formatPageLabel(answer, projectRoot) : null,
      }
    }

    const scoreClimb = (fiber: ReactFiber, step: OwnerChainStep | null) => {
      if (!verify || !step) return

      const truth = stampedOwnerSource(fiber, projectRoot)
      if (!truth) return

      const answer = getClimbStepDisplaySource(step)
      const ok = isSameSourceLine(truth, answer)

      
      
      
      
      
      
      const intentional =
        !ok && stampedHostSource(fiber, projectRoot) === null

      logStage(
        "climb check",
        "#94a3b8",
        answer
          ? `${formatPageLabel(answer, projectRoot)}${
              ok
                ? ""
                : `  ${intentional ? "·  skipped" : " ≠ "}  ${formatPageLabel(
                    truth,
                    projectRoot
                  )}`
            }`
          : `no answer  ≠  ${formatPageLabel(truth, projectRoot)}`,
        ok ? "#22c55e" : intentional ? "#a855f7" : "#ef4444"
      )

      if (intentional) {
        verifyTally.unverifiable += 1
        return
      }

      
      
      
      verifyTally[ok ? "match" : "mismatch"] += 1
      const scored = verifyTally.match + verifyTally.mismatch
      const rate = Math.round((verifyTally.match / scored) * 100)
      logStage(
        "match",
        ok ? "#22c55e" : "#ef4444",
        `${rate}%  (${verifyTally.match}/${scored}${
          verifyTally.unverifiable
            ? `, ${verifyTally.unverifiable} unscored`
            : ""
        })`,
        ok ? "#22c55e" : "#ef4444"
      )
    }

    const scoreHover = (fiber: ReactFiber, target: Element) => {
      if (!verify) return

      const truth = readGroundTruthStamp(fiber, projectRoot)
      
      
      const blindSync = getHostAuthorSource(fiber, projectRoot, false)

      const settle = (
        verdict: "match" | "mismatch" | "unverifiable",
        found: string
      ) => {
        verifyTally[verdict] += 1
        const scored = verifyTally.match + verifyTally.mismatch
        const rate =
          scored === 0 ? 100 : Math.round((verifyTally.match / scored) * 100)

        const MUTED = "#94a3b8"
        const verdictColor =
          verdict === "match"
            ? "#22c55e"
            : verdict === "mismatch"
              ? "#ef4444"
              : MUTED

        
        
        logStage("run time check", MUTED, found, MUTED)
        logStage(
          "stamp check",
          MUTED,
          truth ? formatPageLabel(truth, projectRoot) : "no host stamp",
          MUTED
        )
        logStage(
          "match",
          verdictColor,
          `${rate}%  (${verifyTally.match}/${scored}${
            verifyTally.unverifiable
              ? `, ${verifyTally.unverifiable} unscored`
              : ""
          })`,
          verdictColor
        )
        appendLogSeparator()

        
        if (hoveredElement !== target) return
        const color = VERDICT_COLOR[verdict]
        overlay.style.borderColor = color
        overlay.style.backgroundColor = `${color}22`
      }

      if (!truth) {
        
        
        
        
        
        void resolveHostAuthorSource(fiber, projectRoot, sourceMapCache, false)
          .then((refined) => {
            const found = refined ?? blindSync
            settle(
              "unverifiable",
              found ? formatPageLabel(found, projectRoot) : "no answer"
            )
            
            
            
            
            const owner = stampedOwnerSource(fiber, projectRoot)
            if (owner) {
              logStage(
                "  owner stamp",
                "#94a3b8",
                formatPageLabel(owner, projectRoot),
                "#94a3b8"
              )
            }
          })
          .catch(() => settle("unverifiable", "no answer"))
        return
      }

      if (isSameSourceLine(truth, blindSync)) {
        settle("match", `found instantly · ${formatPageLabel(truth, projectRoot)}`)
        return
      }

      
      
      
      
      void resolveHostAuthorSource(fiber, projectRoot, sourceMapCache, false)
        .then((refined) => {
          if (isSameSourceLine(truth, refined)) {
            settle(
              "match",
              `found after lookup · ${formatPageLabel(truth, projectRoot)}`
            )
            return
          }
          settle(
            "mismatch",
            refined ? formatPageLabel(refined, projectRoot) : "no answer"
          )
        })
        .catch(() => {
          settle("mismatch", "threw")
        })
    }

    const logHoverTarget = (fiber: ReactFiber) => {
      const target = getLogTarget(fiber)
      lastHoverLog = target
      const kind = resolveOpenKind(fiber)
      const tag =
        kind === "used"
          ? formatComponentTag(target.name)
          : formatDomTag(target.name)
      logEvent(`hover: ${tag} ; ${target.path}`)
    }

    const rememberHoverTarget = (fiber: ReactFiber) => {
      lastHoverLog = getLogTarget(fiber)
    }

    const refineClimbStep = async (step: OwnerChainStep) => {
      // Keep a solid call site (owner stamp / distinct usage) — don't let
      // async stack refine replace page.tsx:39 with button.tsx.
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

    logOptionPress = () => {
      if (!hoveredElement) return
      const fiber = getFiber(hoveredElement)
      if (!fiber) return
      const target = getLogTarget(fiber)
      lastHoverLog = target
      const chain = buildOwnerChain(fiber)
      const chainLabel =
        chain.length > 0
          ? chain.map((step) => step.name).join(" → ")
          : "—"
      logEvent(
        `⌥ hold: ${formatComponentTag(target.name)} ; ${target.path} · chain ${chain.length}: ${chainLabel}`
      )
      
      const step = chain[ownerChainDepth]
      if (!step) return
      const depthAtRequest = ownerChainDepth
      void refineClimbStep(step).then(() => {
        if (!optionHeld || ownerChainDepth !== depthAtRequest) return
        const display = climbDisplaySource(step)
        if (!display) return
        const path = formatPageLabel(display, projectRoot)
        lastHoverLog = { name: step.name, path }
        paintTooltipForFiber(fiber)
        logEvent(
          `⌥ path: ${formatComponentTag(step.name)} ; ${path} (rendered by)`
        )
        scoreClimb(fiber, step)
      })
    }

    walkOwnerChain = (delta: number) => {
      if (!canShowTooltipStack()) return
      const fiber = getFiber(hoveredElement!)
      if (!fiber) return
      const chain = buildOwnerChain(fiber)
      if (chain.length === 0) {
        shakeTooltip?.()
        logEvent("⇧: can't climb")
        return
      }

      
      if (delta <= 0) return

      const next = Math.min(chain.length - 1, ownerChainDepth + delta)
      if (next === ownerChainDepth) {
        shakeTooltip?.()
        logEvent("⇧: top of tree")
        return
      }

      const currentLabel = tooltipLabel.textContent
      if (currentLabel) pushTooltipUnder(currentLabel)

      ownerChainDepth = next
      paintTooltipForFiber(fiber)
      const step = chain[ownerChainDepth]
      const syncDisplay = climbDisplaySource(step)
      const syncPath = syncDisplay
        ? formatPageLabel(syncDisplay, projectRoot)
        : null
      
      lastHoverLog = { name: step.name, path: syncPath ?? "" }
      logEvent(
        `⇧ climb: ${formatComponentTag(step.name)} ; ${syncPath ?? "…"} · ${ownerChainDepth + 1}/${chain.length}`
      )
      updateOpenHint()

      
      const depthAtRequest = ownerChainDepth
      void refineClimbStep(step).then(() => {
        const display = climbDisplaySource(step)
        if (!optionHeld || ownerChainDepth !== depthAtRequest || !display) {
          return
        }
        if (isBundledOrExternalPath(display.filePath)) return
        const path = formatPageLabel(display, projectRoot)
        lastHoverLog = { name: step.name, path }
        paintTooltipForFiber(fiber)
        logEvent(`⇧ path: ${formatComponentTag(step.name)} ; ${path}`)
      })
    }

    if (debug) {
      syncDebugPanelVisibility()
      updateOpenHint()
      logEvent("debug panel ready")
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
      lastHoverLog = null
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
        rememberAvailability(fiber, usage, definition)

        
        const chain = buildOwnerChain(fiber)
        await Promise.all(chain.map((step) => refineClimbStep(step)))

        if (generation !== inspectGeneration || hoveredElement !== target) {
          return
        }

        if (!hostSource && !definition && !usage && chain.every((s) => !s.source)) {
          setTooltipLabel("Source unavailable")
          syncDualBadge(fiber)
          if (lastTargetRect) positionTooltip(lastTargetRect)
          return
        }

        paintTooltipForFiber(fiber)
        rememberHoverTarget(fiber)
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
        if (!verify) logHoverTarget(fiber)
        scoreHover(fiber, resolved)

        
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
        const chainStep = kind === "used" ? getActiveChainStep(fiber) : null

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
            openSourceLoc = getClimbOpenSource(chainStep)
          } else {
            if (!chainStep.definition) {
              chainStep.definition = await getSource(chainStep.parentFiber)
            }
            if (!chainStep.source) {
              chainStep.source = await getInstanceSource(chainStep.parentFiber)
            }
            openSourceLoc = getClimbOpenSource(chainStep)
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
          const opened: LogTarget = {
            name: openName,
            path: formatPageLabel(openSourceLoc, projectRoot),
          }
          const tag =
            kind === "used"
              ? formatComponentTag(opened.name)
              : formatDomTag(opened.name)
          logEvent(
            `open${resolveUsesStamps ? " (stamped)" : ""}: ${tag} ; ${opened.path}`,
            logTargetsMatch(lastHoverLog, opened) ? "ok" : "error"
          )
          openInEditor(openSourceLoc, settings.ide)
          if (kind === "used") paintTooltipForFiber(fiber)
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
            const nearestTag = getDomHoverName(getFiber(nearest.element)) ?? "?"
            logEvent(
              `open (nearest ${formatDomTag(nearestTag)}): ${formatPageLabel(
                nearest.source,
                projectRoot
              )}`
            )
            openInEditor(nearest.source, settings.ide)
          } else {
            tooltip.style.display = "flex"
            setTooltipLabel(
              chainStep
                ? `No accurate source for ${formatComponentTag(chainStep.name)}`
                : "Could not resolve source"
            )
            logEvent(
              chainStep
                ? `open: ${formatComponentTag(chainStep.name)} ; unavailable`
                : "open: source unavailable",
              "error"
            )
          }
        }
      } catch {
        tooltip.style.display = "flex"
        setTooltipLabel("Could not resolve source")
        logEvent("open: source unavailable", "error")
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
          syncOpenModeVisibility()
      logEvent("inspect mode on")
        } else {
          logEvent("inspect mode off")
          deactivate()
        }
        return
      }

      if (!isActive) return

      syncOptionFromEvent(event)

      if (event.key === "Escape") {
        logEvent("user pressed escape")
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
          logEvent("user closed info")
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
        logEvent(
          infoClimbSelection
            ? `user opened info · climb ${formatComponentTag(infoClimbSelection.step.name)}`
            : "user opened info · dom"
        )
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
          logEvent(
            isPadGrow
              ? `user grew padding ${nextX} · ${nextY}`
              : `user shrank padding ${nextX} · ${nextY}`
          )

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

        const treeAction = isBracketLeft ? "parent" : "child"
        if (!hoveredElement) {
          shakeOverlay()
          logEvent(`press ${treeAction} → overlay shook`)
          return
        }
        const from = hoveredElement
        let next: Element | null = null

        if (isBracketLeft) {
          next = findParentInspectable(from)
          if (next) treeNavStack.push(from)
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
          logEvent(`press ${treeAction} → overlay shook`)
          return
        }

        pointerPinned = true
        
        const ok = revealAndHighlight(next, true)
        if (ok && hoveredElement !== from) {
          logEvent(`press ${treeAction} → overlay moved ${treeAction}`)
        } else if (ok) {
          
          if (isBracketLeft && treeNavStack[treeNavStack.length - 1] === from) {
            treeNavStack.pop()
          }
          shakeOverlay()
          logEvent(`press ${treeAction} → overlay shook`)
        } else {
          
          if (isBracketLeft && treeNavStack[treeNavStack.length - 1] === from) {
            treeNavStack.pop()
          }
          shakeOverlay()
          logEvent(
            `press ${treeAction} → mismatch: next found but overlay didn't move`,
            "error"
          )
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
          logEvent(`user reset padding ${nextX} · ${nextY}`)

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

      const direction = event.key.replace("Arrow", "").toLowerCase()
      const isModArrow = event.metaKey || event.ctrlKey
      const pressLabel = isModArrow ? `⌘${direction}` : direction

      if (!hoveredElement) {
        shakeOverlay()
        logEvent(`press ${pressLabel} → overlay shook`)
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
        logEvent(`press ${pressLabel} → overlay shook`)
        return
      }

      pointerPinned = true
      const ok = revealAndHighlight(next)
      if (ok && hoveredElement !== from) {
        
        treeNavStack = []
        logEvent(`press ${pressLabel} → overlay moved ${direction}`)
      } else if (ok) {
        shakeOverlay()
        logEvent(`press ${pressLabel} → overlay shook`)
      } else {
        
        shakeOverlay()
        logEvent(
          `press ${pressLabel} → mismatch: next found but overlay didn't move`,
          "error"
        )
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

    if (verify) {
      ;(window as unknown as Record<string, unknown>).__inspectUIVerify =
        verifyElement
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

    return () => {
      unsubscribe()
      document.removeEventListener("pointermove", handlePointerMove, true)
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("keyup", handleKeyUp, true)
      window.removeEventListener("blur", deactivate)
      window.removeEventListener("scroll", handleScroll, { capture: true })
      delete (window as unknown as Record<string, unknown>).__inspectUIVerify
      overlay.remove()
      tooltip.remove()
      info.remove()
      logPanel.remove()
      debugToggleBtn.remove()
      document.body.style.cursor = previousCursor
    }
  }, [projectRoot, debug])

  return null
}
