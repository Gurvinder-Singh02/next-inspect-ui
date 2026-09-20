import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
