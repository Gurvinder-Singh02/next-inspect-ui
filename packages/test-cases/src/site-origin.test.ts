import assert from "node:assert/strict"
import { test } from "node:test"
import { SITE_ORIGIN, getSiteUrl } from "../../../site/lib/site.ts"

const withEnvironment = (
  values: Record<string, string | undefined>,
  run: () => void
) => {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]])
  )
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    run()
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

test("production refuses unsafe public origins", () => {
  withEnvironment(
    {
      NODE_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
    },
    () => {
      assert.equal(getSiteUrl(), SITE_ORIGIN)
      for (const value of [
        "http://localhost:3000",
        "https://localhost",
        "http://example.com",
        "https://user:password@example.com",
        "https://example.com/path",
        "https://example.com/?q=x",
        "https://example.com/#x",
        "javascript:alert(1)",
      ]) {
        process.env.NEXT_PUBLIC_SITE_URL = value
        assert.throws(getSiteUrl, value)
      }
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/"
      assert.equal(getSiteUrl(), "https://example.com")
    }
  )
})

test("explicit origin takes priority over the canonical production origin", () => {
  withEnvironment(
    {
      NODE_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "project.vercel.app",
      NEXT_PUBLIC_SITE_URL: undefined,
    },
    () => {
      assert.equal(getSiteUrl(), SITE_ORIGIN)
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com"
      assert.equal(getSiteUrl(), "https://example.com")
    }
  )
})

test("development keeps the local origin fallback", () => {
  withEnvironment(
    {
      NODE_ENV: "development",
      VERCEL_PROJECT_PRODUCTION_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
    },
    () => {
      assert.equal(getSiteUrl(), "http://localhost:3000")
    }
  )
})
