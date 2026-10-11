export const SITE_NAME = "Next Inspect UI"
const SITE_TAGLINE = "Never search for Next.js components again"
export const SITE_TITLE = `${SITE_NAME} | Inspect`
export const SITE_DESCRIPTION =
  "Inspect any React or Next.js element in your browser and jump directly to its source in your IDE. Works with compound components too. Hold Option to select the owning component. Press Space to browse Component and Element trees."
export const OG_IMAGE = {
  url: "/og.png",
  width: 1440,
  height: 760,
  alt: "next-inspect-ui inspect overlay on a Next.js heading, showing the DOM tag and source file",
} as const

export const AUTHOR_NAME = "Gxuri"
export const AUTHOR_URL = "https://gxuri.me"
const GITHUB_PROFILE = "https://github.com/Gurvinder-Singh02"
export const GITHUB_REPO =
  "https://github.com/Gurvinder-Singh02/next-inspect-ui"
export const GITHUB_AVATAR = "/author-avatar.png"

export const getSiteUrl = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const deployment = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const value =
    configured ||
    (deployment
      ? `https://${deployment.replace(/^https?:\/\//, "")}`
      : undefined)
  if (value) {
    const url = new URL(value)
    if (
      !/^https?:$/.test(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without credentials, paths or query parameters."
      )
    }
    if (
      process.env.NODE_ENV === "production" &&
      (url.protocol !== "https:" ||
        /^(localhost|127\.|\[::1\])/.test(url.hostname))
    ) {
      throw new Error(
        "Production requires a public HTTPS NEXT_PUBLIC_SITE_URL."
      )
    }
    return url.origin
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Set NEXT_PUBLIC_SITE_URL to the public HTTPS origin before building, or use VERCEL_PROJECT_PRODUCTION_URL."
    )
  }
  return "http://localhost:3000"
}

export const INDEXABLE_PATHS = [
  "/",
  "/walkthrough",
  "/how-it-works",
  "/benchmarks",
  "/api-reference",
  "/shortcuts",
] as const
