export const FONTS = [
  {
    name: "Inter",
    value: "inter",
    font: {
      family: "Inter",
      style: {
        fontFamily: "var(--font-sans), Inter, sans-serif",
      },
    },
  },
  {
    name: "Geist Mono",
    value: "geist-mono",
    font: {
      family: "Geist Mono",
      style: {
        fontFamily: "var(--font-mono), ui-monospace, monospace",
      },
    },
  },
] as const

export type Font = (typeof FONTS)[number]
