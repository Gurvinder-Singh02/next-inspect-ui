export const SITE_NAME = "Next Inspect UI"
export const SITE_TAGLINE = "Never search for Next.js components again"
export const SITE_TITLE = `${SITE_NAME} | Inspect`
export const SITE_DESCRIPTION =
  "Inspect any React or Next.js element in your browser and jump directly to its source in your IDE. Works with compound components too. Hold Option and press Shift to move up the hierarchy."
export const OG_IMAGE = {
  url: "/og.png",
  width: 1440,
  height: 760,
  alt: "next-inspect-ui inspect overlay on a Next.js heading, showing the DOM tag and source file",
} as const

export const AUTHOR_NAME = "Gxuri"
export const AUTHOR_URL = "https://gxuri.me"
export const GITHUB_PROFILE = "https://github.com/Gurvinder-Singh02"
export const GITHUB_REPO =
  "https://github.com/Gurvinder-Singh02/next-inspect-ui"
export const GITHUB_AVATAR = "https://github.com/Gurvinder-Singh02.png"

export const getSiteUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (fromEnv) return fromEnv

  const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
    /\/$/,
    ""
  )
  if (fromVercel) {
    return fromVercel.startsWith("http") ? fromVercel : `https://${fromVercel}`
  }

  return "http://localhost:3000"
}

export const INDEXABLE_PATHS = [
  "/",
  "/walkthrough",
  "/works-with",
  "/api-reference",
  "/shortcuts",
] as const
