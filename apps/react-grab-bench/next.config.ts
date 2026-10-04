import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["next-inspect-ui"],
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
