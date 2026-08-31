import type { NextConfig } from "next"
import { withInspectUI } from "next-inspect-ui-debug"

const nextConfig: NextConfig = {
  // Verification launches a second `next dev` beside the user's :3000 server.
  // Next.js 16 refuses that when both share `.next`; a dedicated distDir splits the lock.
  ...(process.env.INSPECT_VERIFY_DIST_DIR
    ? { distDir: process.env.INSPECT_VERIFY_DIST_DIR }
    : {}),
}

// Stamps every JSX element with its authoring location so the inspector reads
// the answer instead of inferring it. Dev-only — the wrapper is a no-op under
// `next build`.
export default withInspectUI(nextConfig)
