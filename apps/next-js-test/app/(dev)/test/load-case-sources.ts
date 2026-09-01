import { CASE_SOURCE_EXAMPLES, type SuiteSourceFile } from "@next-inspect-ui/test-cases"
import { highlightCode } from "@/lib/highlight-code"

/** Highlight short example snippets for every case’s Show source panel. */
export const loadCaseSources = async (): Promise<
  Record<string, SuiteSourceFile[]>
> => {
  const byCase: Record<string, SuiteSourceFile[]> = {}

  await Promise.all(
    Object.entries(CASE_SOURCE_EXAMPLES).map(async ([id, examples]) => {
      byCase[id] = await Promise.all(
        examples.map(async (example) => ({
          label: example.label,
          file: example.file,
          code: example.code,
          html: await highlightCode(example.code, "tsx"),
        }))
      )
    })
  )

  return byCase
}
