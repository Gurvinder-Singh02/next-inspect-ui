const SVG_NS = "http://www.w3.org/2000/svg"

const ARROW_PATHS = ["M7 17 17 7", "M7 7h10v10"]

const createStrokeIcon = (size: number, strokeWidth: string) => {
  const svg = document.createElementNS(SVG_NS, "svg")
  svg.setAttribute("width", String(size))
  svg.setAttribute("height", String(size))
  svg.setAttribute("viewBox", "0 0 24 24")
  svg.setAttribute("fill", "none")
  svg.setAttribute("stroke", "currentColor")
  svg.setAttribute("stroke-width", strokeWidth)
  svg.setAttribute("stroke-linecap", "round")
  svg.setAttribute("stroke-linejoin", "round")
  svg.setAttribute("aria-hidden", "true")
  for (const d of ARROW_PATHS) {
    const path = document.createElementNS(SVG_NS, "path")
    path.setAttribute("d", d)
    svg.append(path)
  }
  return svg
}

export const createUsedIcon = () => createStrokeIcon(12, "2.4")

export const createOpenSourceIcon = () => createStrokeIcon(14, "2.2")

export const createReactIcon = () => {
  const svg = document.createElementNS(SVG_NS, "svg")
  for (const [key, value] of Object.entries({ width: "12", height: "12", viewBox: "-12 -12 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1", "aria-hidden": "true" })) svg.setAttribute(key, value)
  for (const angle of [0, 60, 120]) {
    const ring = document.createElementNS(SVG_NS, "ellipse")
    ring.setAttribute("rx", "11")
    ring.setAttribute("ry", "4")
    ring.setAttribute("transform", `rotate(${angle})`)
    svg.append(ring)
  }
  const dot = document.createElementNS(SVG_NS, "circle")
  dot.setAttribute("r", "2")
  dot.setAttribute("fill", "currentColor")
  svg.append(dot)
  return svg
}
