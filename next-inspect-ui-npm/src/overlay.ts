/**
 * `next-inspect-ui/overlay` — fiber walk, source resolution, and chrome helpers.
 *
 * Kept off the main entry so production apps that only mount `InspectUI` never
 * download this engine. The debug package imports from here instead of forking
 * the same helpers.
 */

export * from "./overlay/fiber"
export * from "./overlay/resolve"
export * from "./overlay/chrome"
