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
          // Next hydration and the theme script require inline scripts. Styles
          // are also used by the interactive demos and syntax highlighting.
          value:
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
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
    ]
  },
}

export default nextConfig
