import { codeToHtml, type BundledLanguage } from "shiki"

export const highlightCode = async (
  code: string,
  lang: BundledLanguage = "tsx"
) => {
  return codeToHtml(code, {
    lang,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: false,
  })
}
