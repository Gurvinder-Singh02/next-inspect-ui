import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ]
    if (process.env.NODE_ENV === "production") {
      headers.push(
        { key: "Strict-Transport-Security", value: "max-age=31536000" },
        {
          key: "Content-Security-Policy",
          // Next hydration and the theme script require inline scripts. Vercel Web
          // Analytics loads from va.vercel-scripts.com and reports to
          // vitals.vercel-insights.com. Styles are also used by the interactive
          // demos and syntax highlighting.
          value:
            "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://vitals.vercel-insights.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
        }
      )
    }
    return [
      { source: "/:path*", headers },
      {
        source: "/lab",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/usage",
        destination: "/walkthrough",
        permanent: true,
      },
      {
        source: "/works-with",
        destination: "/benchmarks",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
