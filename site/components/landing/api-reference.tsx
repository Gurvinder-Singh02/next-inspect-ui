import { cn } from "@/lib/utils"

type ApiProp = {
  name: string
  type: string
  description: string
}

type ApiSection = {
  title: string
  description: string
  props: ApiProp[]
}

const API_SECTIONS: ApiSection[] = [
  {
    title: "Props ",
    description: "Props for the <InspectUI /> component.",
    props: [
      {
        name: "projectRoot",
        type: "string",
        description:
          "Optional. Explicit root for resolving relative paths and shortening labels. Basic setup needs no props.",
      },
      {
        name: "shortcut",
        type: "string",
        description:
          'Optional seed for the toggle shortcut. Default `"Alt+X"`. Overridable in the settings panel.',
      },
      {
        name: "ide",
        type: '"cursor" | "vscode" | "vscode-insiders" | "windsurf" | "zed"',
        description:
          'Optional seed for open-in-source links. Default `"cursor"`. Overridable in the settings panel.',
      },
      {
        name: "tooltipProps",
        type: "Partial<TooltipProps>",
        description:
          "Optional seed for tooltip appearance. Settings-panel edits override these for the session.",
      },
      {
        name: "popoverProps",
        type: '{ defaultTab?: "component" | "element" }',
        description:
          'Initial tree tab when Space opens the popover. Default "component".',
      },
      {
        name: "devSpotlightProps",
        type: "Partial<DevSpotlightProps>",
        description:
          "Optional seed for spotlight appearance. Settings-panel edits override these for the session.",
      },
    ],
  },
  {
    title: "tooltipProps",
    description:
      "Tooltip appearance from inspector settings (`setTooltipProps` / toolbar).",
    props: [
      {
        name: "background",
        type: "string",
        description: 'Label background color. Default `"#006efe"`.',
      },
      {
        name: "text",
        type: "string",
        description: 'Label text color. Default `"#ffffff"`.',
      },
      {
        name: "showTitle",
        type: "boolean",
        description:
          "Show the component tag (e.g. `<Button/>`) in the label. Default `true`.",
      },
      {
        name: "showFullUrl",
        type: "boolean",
        description:
          "Show the current source path and line. Off shows only the filename and line. Default `true`.",
      },
      {
        name: "side",
        type: '"top" | "right" | "bottom" | "left"',
        description:
          'Preferred side of the spotlight for the label. Flips inside when clipped. Default `"top"`.',
      },
      {
        name: "align",
        type: '"start" | "center" | "end"',
        description: 'Alignment along the chosen side. Default `"start"`.',
      },
      {
        name: "sideOffset",
        type: "number",
        description:
          "Gap between the spotlight edge and the label, in px. Default `6`.",
      },
      {
        name: "alignOffset",
        type: "number",
        description: "Shift along the alignment axis, in px. Default `0`.",
      },
      {
        name: "paddingX",
        type: "number",
        description: "Horizontal padding inside the label, in px. Default `8`.",
      },
      {
        name: "paddingY",
        type: "number",
        description: "Vertical padding inside the label, in px. Default `2`.",
      },
      {
        name: "borderRadius",
        type: "number",
        description: "Label corner radius, in px. Default `8`.",
      },
    ],
  },
  {
    title: "devSpotlightProps",
    description:
      "Spotlight appearance from inspector settings (`setDevSpotlightProps` / toolbar).",
    props: [
      {
        name: "background",
        type: "string",
        description: 'Spotlight fill color. Default `"#006efe"`.',
      },
      {
        name: "border",
        type: "string",
        description: 'Spotlight stroke color. Default `"#006efe"`.',
      },
      {
        name: "bgOpacity",
        type: "number",
        description: "Fill opacity from `0` to `1`. Default `0.1`.",
      },
      {
        name: "strokeOpacity",
        type: "number",
        description: "Stroke opacity from `0` to `1`. Default `1`.",
      },
      {
        name: "strokeWidth",
        type: "number",
        description: "Stroke width in px. Default `0.5`.",
      },
      {
        name: "strokeStyle",
        type: '"solid" | "dashed" | "dotted"',
        description: 'Stroke style. Default `"solid"`.',
      },
      {
        name: "animated",
        type: "boolean",
        description:
          "Animate spotlight and tooltip transitions on hover. Default `true`.",
      },
    ],
  },
]

const PropRow = ({ prop, isLast }: { prop: ApiProp; isLast: boolean }) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:gap-6",
        !isLast && "border-b border-border"
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:w-[42%]">
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-azeret-mono text-[12px] text-foreground">
          {prop.name}
        </code>
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-azeret-mono text-[12px] text-muted-foreground">
          {prop.type}
        </code>
      </div>
      <p className="font-inter text-[13px] leading-relaxed text-muted-foreground">
        {prop.description}
      </p>
    </div>
  )
}

export const ApiReference = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex flex-col gap-10", className)}>
      {API_SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3>{section.title}</h3>
            <p>{section.description}</p>
          </div>
          <div>
            {section.props.map((prop, index) => (
              <PropRow
                key={prop.name}
                prop={prop}
                isLast={index === section.props.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
