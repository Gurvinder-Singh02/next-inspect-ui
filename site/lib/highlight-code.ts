import { codeToHtml, type BundledLanguage, type ShikiTransformer } from "shiki"

type HighlightLineOptions = {
  /** 1-based line number of the first snippet line in the source file. */
  startLine?: number
  /** 1-based source file line numbers to emphasize. */
  highlightLines?: number[]
}

const lineNumberTransformer = ({
  startLine = 1,
  highlightLines = [],
}: HighlightLineOptions): ShikiTransformer => ({
  name: "line-numbers",
  line(node, line) {
    const lineNo = startLine + line - 1
    const classes = new Set(
      String(node.properties.class ?? "")
        .split(/\s+/)
        .filter(Boolean)
    )
    classes.add("line")
    if (highlightLines.includes(lineNo)) classes.add("highlighted")
    node.properties.class = [...classes].join(" ")
    node.properties["data-line"] = String(lineNo)
    node.children.unshift({
      type: "element",
      tagName: "span",
      properties: {
        class: "line-number",
        "aria-hidden": "true",
      },
      children: [{ type: "text", value: String(lineNo) }],
    })
  },
})

export const highlightCode = async (
  code: string,
  lang: BundledLanguage = "tsx",
  options?: HighlightLineOptions
) => {
  return codeToHtml(code, {
    lang,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: false,
    transformers: options ? [lineNumberTransformer(options)] : undefined,
  })
}
