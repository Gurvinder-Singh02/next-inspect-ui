export const SITE_NAME = "Next Inspect UI"
const SITE_TAGLINE = "Inspect React & Next.js components in your browser"
export const SITE_TITLE = `${SITE_NAME} | ${SITE_TAGLINE}`
export const SITE_DESCRIPTION =
  "Inspect any React or Next.js element in your browser and jump directly to its source in your IDE. Works with compound components too. Hold Option to select the owning component. Press Space to browse Component and Element trees."
export const OG_IMAGE = {
  url: "/og.png",
  width: 1440,
  height: 760,
  alt: "next-inspect-ui inspect overlay on a Next.js heading, showing the DOM tag and source file",
} as const

/** Canonical public origin for production SEO (canonical, sitemap, OG). */
export const SITE_ORIGIN = "https://niu.gxuri.me"

export const AUTHOR_NAME = "Gxuri"
export const AUTHOR_URL = "https://gxuri.me"
export const GITHUB_REPO =
  "https://github.com/Gurvinder-Singh02/next-inspect-ui"
export const GITHUB_AVATAR = "/author-avatar.webp"
export const NPM_PACKAGE_URL = "https://www.npmjs.com/package/next-inspect-ui"

export const getSiteUrl = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const deployment = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const value =
    configured ||
    (process.env.NODE_ENV === "production" ? SITE_ORIGIN : undefined) ||
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

export const FAQ_ENTRIES = [
  {
    q: "How does this work?",
    a: "Press Option / Alt + X to enable inspect mode, then hover an element. The inspector reads React Fiber metadata and source maps to find its source. Click or press Enter to open it. Hold Option / Alt to inspect the owning component’s usage.",
  },
  {
    q: "Does this affect production?",
    a: "Use the development-only dynamic import shown in Usage. Your bundler tree-shakes the whole library, leaving 0 B of inspector code in production. A static import disables the inspector but may retain a small wrapper. Serve the standalone script only in development.",
  },
  {
    q: "Does it rely on any other libraries internally?",
    a: "No additional runtime libraries are required. Source resolution, stack parsing, and source-map decoding are built in. React and ReactDOM are peer dependencies.",
  },
  {
    q: "Is this a build plugin?",
    a: "No. There is no Webpack, Vite, Turbopack, Babel, or SWC plugin. You mount InspectUI in development. It reads the React fiber tree at runtime. No props are required. projectRoot can optionally resolve relative paths explicitly.",
  },
  {
    q: "Does this only work with Next.js?",
    a: "No. It supports React 19+ apps, including Next.js and Vite. React 18 compatibility is experimental. Source accuracy depends on your framework’s development metadata and source maps; Next.js Server Component locations use available server debug metadata.",
  },
  {
    q: "How do I navigate the tree?",
    a: "Press Space to open the popover. Component nests from the page boundary down to the hovered element. Element shows nearby HTML, stopping at body. Left opens Component and Right opens Element; Up / Down moves between rows and previews their elements. Enter opens the selected source. Press Space to close the popover or Escape to exit inspect mode.",
  },
  {
    q: "Which editors does it support?",
    a: "Cursor, VS Code, VS Code Insiders, Windsurf, and Zed. Choose your editor in the inspector settings. The inspector opens source through an editor URL or your framework’s development endpoint.",
  },
  {
    q: "What kind of elements can I inspect?",
    a: "Any React element in the rendered tree: HTML, SVG, shadcn, compound components, and the rest of the usual patterns.",
  },
] as const
