export const SITE_NAME = "next-inspect-ui"
export const SITE_TAGLINE = "Never search for Next.js components again"
export const SITE_DESCRIPTION =
  "Dev-only overlay for Next.js. Hover any element for its DOM tag and source, click to open it in your editor, hold ⌥ to climb to where the component is used."

export const AUTHOR_NAME = "Gxuri"
export const AUTHOR_URL = "https://gxuri.me"
export const GITHUB_PROFILE = "https://github.com/Gurvinder-Singh02"
export const GITHUB_REPO = "https://github.com/Gurvinder-Singh02/next-inspect-ui"
export const GITHUB_AVATAR = "https://github.com/Gurvinder-Singh02.png"

export const getSiteUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (fromEnv) return fromEnv

  const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
    /\/$/,
    ""
  )
  if (fromVercel) {
    return fromVercel.startsWith("http")
      ? fromVercel
      : `https://${fromVercel}`
  }

  return "http://localhost:3000"
}

export const INDEXABLE_PATHS = [
  "/",
  "/usage",
  "/api-reference",
  "/shortcuts",
] as const
