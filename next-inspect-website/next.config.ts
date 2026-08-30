import type { NextConfig } from "next"
import { withInspectUI } from "next-inspect-ui-debug"

const nextConfig: NextConfig = {}

// Stamps every JSX element with its authoring location so the inspector reads
// the answer instead of inferring it. Dev-only — the wrapper is a no-op under
// `next build`.
export default withInspectUI(nextConfig)
